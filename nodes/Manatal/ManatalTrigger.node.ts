/**
 * ManatalTrigger.node.ts
 *
 * Webhook trigger node for the Manatal ATS integration.
 * Starts an n8n workflow automatically when a selected event occurs in Manatal.
 *
 * Supported events: candidate created/updated, contact created/updated,
 * job status updated, match created, match moved (pipeline stage change).
 *
 * Lifecycle:
 * - On workflow activation: checkExists() verifies a matching webhook is already
 *   registered; if not, create() POSTs a new webhook to the Manahook API and
 *   stores the webhook ID in workflow static data for future reference.
 * - On incoming POST: webhook() passes the raw request body straight through
 *   as the workflow's trigger data.
 * - On workflow deactivation: delete() removes the webhook from Manatal using
 *   the stored ID. A 404 response is treated as success (already removed).
 *
 * Static data is used to persist the webhook ID between n8n restarts without
 * requiring a database or external store.
 *
 * EVENT_MAP translates n8n-facing event names (e.g. 'matchMoved') to the
 * model/action pair that the Manatal webhook API expects.
 */

import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { manatalWebhookApiRequest } from './GenericFunctions';

interface ManatalWebhook {
	id: number;
	target_url: string;
	model?: string;
	action?: string;
	object_id?: number;
	content_type?: string;
	event_id?: number;
	created_at?: string;
	updated_at?: string;
}

const EVENT_MAP: Record<string, { model: string; action: string }> = {
	candidateCreate: { model: 'candidate', action: 'create' },
	candidateUpdate: { model: 'candidate', action: 'update' },
	contactCreate: { model: 'contact', action: 'create' },
	contactUpdate: { model: 'contact', action: 'update' },
	matchCreate: { model: 'match', action: 'create' },
	matchMoved: { model: 'match', action: 'moved' },
	jobStatusUpdate: { model: 'job', action: 'status_update' },
};

/**
 * Clears or sets webhook static data in one call.
 * Called with no data argument to clear (on delete/mismatch),
 * or with data to store the newly registered webhook's identity.
 *
 * model and action are intentionally NOT stored — they are always
 * derivable from EVENT_MAP[event] and storing them would create a
 * second source of truth that could drift from the event key.
 */
function setWebhookStaticData(
	staticData: IDataObject,
	data?: { id: string | number; url: string; event: string },
): void {
	delete staticData.webhookId;
	delete staticData.webhookUrl;
	delete staticData.webhookEvent;
	if (data) {
		staticData.webhookId = data.id;
		staticData.webhookUrl = data.url;
		staticData.webhookEvent = data.event;
	}
}

export class ManatalTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Manatal Trigger',
		name: 'manatalTrigger',
		icon: 'file:assets/manatal.svg',
		group: ['trigger'],
		version: 1,
		description: 'Starts a workflow when a selected Manatal event occurs',
		subtitle: '={{$parameter["event"]}}',
		usableAsTool: true,
		defaults: { name: 'Manatal Trigger' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'manatalOpenAPIKey', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				required: true,
				options: [
					{
						name: 'Candidate Created',
						value: 'candidateCreate',
						description: 'Runs when a candidate is created',
						action: 'Candidate created',
					},
					{
						name: 'Candidate Updated',
						value: 'candidateUpdate',
						description: 'Runs when a candidate is updated',
						action: 'Candidate updated',
					},
					{
						name: 'Contact Created',
						value: 'contactCreate',
						description: 'Runs when a contact is created',
						action: 'Contact created',
					},
					{
						name: 'Contact Updated',
						value: 'contactUpdate',
						description: 'Runs when a contact is updated',
						action: 'Contact updated',
					},
					{
						name: 'Job Status Updated',
						value: 'jobStatusUpdate',
						description: 'Runs when a job status changes',
						action: 'Job status updated',
					},
					{
						name: 'Match Created',
						value: 'matchCreate',
						description: 'Runs when a candidate is added to a job pipeline',
						action: 'Match created',
					},
					{
						name: 'Match Moved',
						value: 'matchMoved',
						description: 'Runs when a candidate moves to a different pipeline stage',
						action: 'Match moved',
					},
				],
				default: 'candidateCreate',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const event = this.getNodeParameter('event') as string;
				const { model, action } = EVENT_MAP[event];
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const staticData = this.getWorkflowStaticData('node');
				const webhookId = staticData.webhookId as string | number | undefined;

				if (
					!webhookId ||
					staticData.webhookUrl !== webhookUrl ||
					staticData.webhookEvent !== event
				) {
					return false;
				}

				let existing: ManatalWebhook[];
				try {
					const response = await manatalWebhookApiRequest.call(this, 'GET', '/webhooks/');
					const raw = response as unknown as ManatalWebhook[] | { results: ManatalWebhook[] };
					existing = Array.isArray(raw) ? raw : ((raw.results as ManatalWebhook[]) ?? []);
				} catch {
					return false;
				}

				const matchingHookExists = existing.some(
					(hook) =>
						String(hook.id) === String(webhookId) &&
						hook.target_url === webhookUrl &&
						hook.model === model &&
						hook.action === action,
				);

				if (!matchingHookExists) {
					setWebhookStaticData(staticData);
				}

				return matchingHookExists;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const event = this.getNodeParameter('event') as string;
				const { model, action } = EVENT_MAP[event];
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const staticData = this.getWorkflowStaticData('node');

				const response = await manatalWebhookApiRequest.call(this, 'POST', '/webhooks/', {
					model,
					action,
					target_url: webhookUrl,
				});

				if (!response.id) return false;
				setWebhookStaticData(staticData, {
					id: response.id as string | number,
					url: webhookUrl,
					event,
				});
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const webhookId = staticData.webhookId as number | undefined;

				if (!webhookId) {
					setWebhookStaticData(staticData);
					return true;
				}

				try {
					await manatalWebhookApiRequest.call(this, 'DELETE', `/webhooks/${webhookId}/`);
				} catch (error) {
					// 404 means the webhook was already removed from Manatal — treat as success
					const httpError = error as { httpCode?: string; statusCode?: number };
					if (httpError.httpCode === '404' || httpError.statusCode === 404) {
						setWebhookStaticData(staticData);
						return true;
					}
					return false;
				}

				setWebhookStaticData(staticData);
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;
		if (!body || Object.keys(body).length === 0) {
			return { webhookResponse: '' };
		}
		return {
			workflowData: [[{ json: body }]],
		};
	}
}
