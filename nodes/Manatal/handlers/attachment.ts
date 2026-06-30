/**
 * handlers/attachment.ts
 *
 * Generic handler for attachments across all five parent resources:
 * Candidate, Job, Match, Organization, and Contact.
 *
 * Uses the same parentResourcePath() pattern as note.ts to resolve the
 * correct API path at runtime without duplicating logic. For example:
 *   'candidateAttachment' → /candidates/{candidateId}/attachments/
 *   'jobAttachment'       → /jobs/{jobId}/attachments/
 *
 * Like notes, attachments are returned as a raw JSON array, so getMany
 * uses asArray() rather than handleGetMany().
 */

import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	asArray,
	getManatalIdParameter,
	manatalApiRequest,
	normalizeLocatorField,
	parentResourcePath,
} from '../GenericFunctions';

export async function attachmentExecute(
	this: IExecuteFunctions,
	resource: string,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	// Resolve parent resource (e.g. 'jobAttachment' → { apiBase: 'jobs', idParam: 'jobId' })
	const { apiBase, idParam } = parentResourcePath(resource);
	const parentId = getManatalIdParameter.call(this, idParam, i);

	if (operation === 'getMany') {
		// Attachments endpoint returns a raw array, not a paginated envelope
		return asArray(
			await manatalApiRequest.call(this, 'GET', `/${apiBase}/${parentId}/attachments/`),
		);
	} else if (operation === 'get') {
		const attachmentId = getManatalIdParameter.call(this, 'attachmentId', i);
		return manatalApiRequest.call(
			this,
			'GET',
			`/${apiBase}/${parentId}/attachments/${attachmentId}/`,
		);
	} else if (operation === 'create') {
		const name = this.getNodeParameter('name', i) as string;
		const file = this.getNodeParameter('file', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
		normalizeLocatorField(additionalFields, 'creator');
		return manatalApiRequest.call(this, 'POST', `/${apiBase}/${parentId}/attachments/`, {
			name,
			file,
			...additionalFields,
		});
	} else if (operation === 'update') {
		const attachmentId = getManatalIdParameter.call(this, 'attachmentId', i);
		const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
		normalizeLocatorField(updateFields, 'creator');
		return manatalApiRequest.call(
			this,
			'PATCH',
			`/${apiBase}/${parentId}/attachments/${attachmentId}/`,
			updateFields,
		);
	}

	throw new NodeOperationError(
		this.getNode(),
		`Unknown operation "${operation}" for resource "${resource}"`,
		{ itemIndex: i },
	);
}
