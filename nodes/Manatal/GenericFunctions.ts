/**
 * GenericFunctions.ts
 *
 * Shared utilities used across all Manatal node handlers.
 * Centralises API communication, pagination, ID normalisation,
 * and the parent-resource path lookup so individual handlers
 * stay thin and don't repeat boilerplate.
 */

import { sleep } from 'n8n-workflow';
import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestOptions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	JsonObject,
} from 'n8n-workflow';

const BASE_URL = 'https://api.manatal.com/open/v3';
const WEBHOOK_BASE_URL = 'https://manahook.api.manatal.com/v1';

/**
 * Makes an authenticated HTTP request to the Manatal API.
 *
 * Wraps n8n's httpRequestWithAuthentication so every call automatically
 * includes the API token from the stored credential. On failure, maps
 * common HTTP status codes to plain-English user messages and throws a
 * NodeApiError that n8n can surface cleanly in the UI.
 *
 * @param method  - HTTP verb (GET, POST, PATCH, DELETE)
 * @param endpoint - Path relative to baseUrl, e.g. '/candidates/123/'
 * @param body    - Request body (omitted if empty)
 * @param qs      - Query-string parameters
 * @param baseUrl - Override to target the webhook API instead of the main API
 */
export async function manatalApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	baseUrl: string = BASE_URL,
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method,
		qs,
		url: `${baseUrl}${endpoint}`,
		json: true,
	};

	if (Object.keys(body).length) {
		options.body = body;
	}

	try {
		return await this.helpers.httpRequestWithAuthentication.call(
			this,
			'manatalOpenAPIKey',
			options,
		);
	} catch (error) {
		// n8n pre-constructs a NodeApiError before our catch runs and stores the parsed
		// API response body at error.context.data. We format that into `description` so
		// n8n surfaces it as the detail line beneath the main error message in the UI.
		const data = ((error as JsonObject).context as JsonObject | undefined)?.data as
			| JsonObject
			| undefined;
		if (data && typeof data === 'object' && !Array.isArray(data)) {
			(error as JsonObject).description = Object.entries(data)
				.map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : String(msgs)}`)
				.join('\n');
		}
		// eslint-disable-next-line @n8n/community-nodes/require-node-api-error
		throw error;
	}
}

/**
 * Convenience wrapper for the Manatal webhook API (manahook.api.manatal.com).
 * Used exclusively by ManatalTrigger.node.ts to register and delete webhooks.
 */
export async function manatalWebhookApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<IDataObject> {
	return manatalApiRequest.call(this, method, endpoint, body, qs, WEBHOOK_BASE_URL);
}

/**
 * Fetches all pages of a paginated Manatal endpoint.
 *
 * Manatal uses page/page_size pagination and signals the last page with
 * `next: null` in the response envelope. Requests pages of 100 items and
 * accumulates results until there are no more pages or MAX_PAGES is reached
 * (a safety cap to prevent infinite loops on unexpected API behaviour).
 *
 * Use this when the user enables "Return All" on a Get Many operation.
 */
export async function manatalApiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<IDataObject[]> {
	const results: IDataObject[] = [];
	let page = 1;
	let retries = 0;
	const MAX_PAGES = 1000;
	const MAX_RETRIES = 10;
	const RETRY_AFTER_MS = 60_000;

	while (page <= MAX_PAGES) {
		let response: IDataObject;
		try {
			response = await manatalApiRequest.call(this, method, endpoint, body, {
				...qs,
				page,
				page_size: 100,
			});
		} catch (error) {
			const httpError = error as { httpCode?: string };
			if (String(httpError.httpCode) === '429') {
				if (++retries > MAX_RETRIES) {
					// eslint-disable-next-line @n8n/community-nodes/require-node-api-error
					throw error;
				}
				await sleep(RETRY_AFTER_MS);
				continue;
			}
			// eslint-disable-next-line @n8n/community-nodes/require-node-api-error
			throw error;
		}

		retries = 0;
		const items = (response.results as IDataObject[]) ?? [];
		results.push(...items);

		if (!response.next) break;
		page++;
	}

	return results;
}

/**
 * Handles the "Get Many" pattern used by every list operation.
 *
 * Reads the `returnAll` and `limit` node parameters, then either
 * auto-paginates through all pages (returnAll=true) or fetches a single
 * page capped at `limit` items (returnAll=false).
 *
 * @param endpoint - API path, e.g. '/candidates/'
 * @param i        - Current item index (for reading node parameters)
 * @param qs       - Additional query-string filters to forward
 */
export async function handleGetMany(
	this: IExecuteFunctions,
	endpoint: string,
	i: number,
	qs: IDataObject = {},
): Promise<IDataObject[]> {
	const returnAll = this.getNodeParameter('returnAll', i) as boolean;
	if (returnAll) {
		return manatalApiRequestAllItems.call(this, 'GET', endpoint, {}, qs);
	}
	const limit = this.getNodeParameter('limit', i) as number;
	const res = await manatalApiRequest.call(this, 'GET', endpoint, {}, { ...qs, page_size: limit });
	return (res.results as IDataObject[]) ?? [];
}

/**
 * Safely casts an API response to IDataObject[].
 *
 * Some Manatal endpoints (notes, attachments, resumes, social media) return a
 * bare JSON array instead of the standard { count, next, results[] } envelope.
 * This helper normalises the response so callers never have to check the shape.
 */
export function asArray(response: unknown): IDataObject[] {
	return Array.isArray(response) ? (response as IDataObject[]) : [];
}

/**
 * Parses a stringified JSON field in-place.
 *
 * Manatal's `custom_fields` property must be sent as a JSON object, but users
 * often supply it as a JSON string. Parsing it before the request prevents a
 * confusing API validation error. If the string is malformed we leave it
 * unchanged — the API will respond with a clear error message.
 *
 * @param obj - The request body object to mutate
 * @param key - The field name to parse (typically 'custom_fields')
 */
export function parseJsonField(obj: IDataObject, key: string): void {
	if (typeof obj[key] === 'string') {
		try {
			obj[key] = JSON.parse(obj[key] as string) as IDataObject;
		} catch {
			// leave as-is; API will return a validation error with a clear message
		}
	}
}

/**
 * Normalises a date field in-place to the YYYY-MM-DD format Manatal requires.
 *
 * n8n's dateTime fields return ISO 8601 strings (e.g. "2024-01-15T00:00:00.000Z").
 * Manatal's date-only fields (e.g. birth_date, expected_close_at) reject anything
 * with a time component. Slicing to the first 10 characters gives YYYY-MM-DD.
 * Skips the field if absent or empty.
 */
export function normalizeDateField(obj: IDataObject, key: string): void {
	if (obj[key] !== undefined && obj[key] !== '') {
		obj[key] = String(obj[key]).slice(0, 10);
	}
}

/**
 * Extracts a numeric or string ID from a resourceLocator field value.
 *
 * n8n's resourceLocator fields produce either a raw number, a plain string,
 * or a nested object { mode, value }. This function normalises all those
 * shapes into the bare ID that the Manatal API expects.
 *
 * Examples:
 *   42           → 42
 *   '42'         → '42'
 *   { value: 42 } → 42
 */
export function normalizeManatalId(value: unknown): string | number {
	if (value && typeof value === 'object' && 'value' in value) {
		return normalizeManatalId((value as IDataObject).value);
	}

	if (typeof value === 'number') return value;

	return String(value ?? '').trim();
}

/**
 * Reads a resourceLocator node parameter and returns its normalised ID.
 *
 * Thin wrapper around normalizeManatalId for use inside handler functions,
 * where node parameters are accessed via `this.getNodeParameter`.
 *
 * @param name - Parameter name as declared in the description file
 * @param i    - Current item index
 */
export function getManatalIdParameter(
	this: IExecuteFunctions,
	name: string,
	i: number,
): string | number {
	return normalizeManatalId(this.getNodeParameter(name, i));
}

/**
 * Normalises a resourceLocator field that lives inside a collection (filters or updateFields).
 *
 * Unlike getManatalIdParameter, this targets a key inside an already-fetched
 * IDataObject rather than reading directly from node parameters. Used to
 * normalise ID fields in filter and update collections before sending the request.
 *
 * Skips the field if it is absent or empty to avoid sending null/empty values.
 */
export function normalizeLocatorField(obj: IDataObject, key: string): void {
	if (obj[key] !== undefined && obj[key] !== '') {
		obj[key] = normalizeManatalId(obj[key]);
	}
}

/**
 * Normalises a resourceLocator field and stores the result under a different key.
 *
 * Used when the n8n UI field name differs from the API parameter name — for
 * example, the 'organization' locator field must become 'organization_id' in
 * the query string. Deletes the original key so only the renamed one is sent.
 *
 * Skips the field if it is absent or empty to mirror normalizeLocatorField's behaviour.
 */
export function remapLocatorField(obj: IDataObject, fromKey: string, toKey: string): void {
	if (obj[fromKey] !== undefined && obj[fromKey] !== '') {
		obj[toKey] = normalizeManatalId(obj[fromKey]);
		delete obj[fromKey];
	}
}

/**
 * Maps a composite resource name (e.g. 'candidateNote') to the parent resource's
 * API base path and ID parameter name.
 *
 * Notes and attachments follow the pattern /{parent}/{parentId}/{sub}/.
 * This lookup table avoids repeating the mapping in every handler and makes
 * adding new parent resources a one-line change here.
 *
 * Supported combinations: candidateNote, jobNote, matchNote, organizationNote,
 * contactNote, candidateAttachment, jobAttachment, matchAttachment,
 * organizationAttachment, contactAttachment.
 */
const PARENT_RESOURCES = [
	{ prefix: 'candidate', apiBase: 'candidates', idParam: 'candidateId' },
	{ prefix: 'job', apiBase: 'jobs', idParam: 'jobId' },
	{ prefix: 'match', apiBase: 'matches', idParam: 'matchId' },
	{ prefix: 'organization', apiBase: 'organizations', idParam: 'organizationId' },
	{ prefix: 'contact', apiBase: 'contacts', idParam: 'contactId' },
] as const;

const PARENT_RESOURCE_MAP: Record<string, { apiBase: string; idParam: string }> =
	Object.fromEntries(
		PARENT_RESOURCES.flatMap(({ prefix, apiBase, idParam }) =>
			['Note', 'Attachment'].map((suffix) => [`${prefix}${suffix}`, { apiBase, idParam }]),
		),
	);

export function parentResourcePath(resource: string): { apiBase: string; idParam: string } {
	const entry = PARENT_RESOURCE_MAP[resource];
	if (!entry) throw new Error(`No parent resource path mapping found for resource "${resource}"`);
	return entry;
}
