/**
 * handlers/note.ts
 *
 * Generic handler for notes across all five parent resources:
 * Candidate, Job, Match, Organization, and Contact.
 *
 * Instead of five separate handlers, this single function uses
 * parentResourcePath() to resolve the correct API base path and parent ID
 * parameter at runtime. For example:
 *   'candidateNote' → /candidates/{candidateId}/notes/
 *   'jobNote'       → /jobs/{jobId}/notes/
 *
 * Notes are returned by the API as a raw JSON array (not paginated),
 * so getMany uses asArray() rather than handleGetMany().
 */

import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { asArray, getManatalIdParameter, manatalApiRequest, parentResourcePath } from '../GenericFunctions';

export async function noteExecute(
	this: IExecuteFunctions,
	resource: string,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	// Resolve parent resource (e.g. 'candidateNote' → { apiBase: 'candidates', idParam: 'candidateId' })
	const { apiBase, idParam } = parentResourcePath(resource);
	const parentId = getManatalIdParameter.call(this, idParam, i);

	if (operation === 'getMany') {
		// Notes endpoint returns a raw array, not a paginated envelope
		return asArray(await manatalApiRequest.call(this, 'GET', `/${apiBase}/${parentId}/notes/`));

	} else if (operation === 'get') {
		const noteId = getManatalIdParameter.call(this, 'noteId', i);
		return manatalApiRequest.call(this, 'GET', `/${apiBase}/${parentId}/notes/${noteId}/`);

	} else if (operation === 'create') {
		const info = this.getNodeParameter('info', i) as string;
		return manatalApiRequest.call(this, 'POST', `/${apiBase}/${parentId}/notes/`, { info });

	} else if (operation === 'update') {
		const noteId = getManatalIdParameter.call(this, 'noteId', i);
		const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
		return manatalApiRequest.call(this, 'PATCH', `/${apiBase}/${parentId}/notes/${noteId}/`, updateFields);
	}

	throw new NodeOperationError(this.getNode(), `Unknown operation "${operation}" for resource "${resource}"`, { itemIndex: i });
}
