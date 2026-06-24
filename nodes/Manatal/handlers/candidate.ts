/**
 * handlers/candidate.ts
 *
 * Handles all operations for the Candidate resource.
 *
 * Notable behaviour:
 * - Get: fires three parallel requests (candidate + educations + experiences)
 *   and merges them into a single output object. Manatal returns education
 *   and experience as separate raw-array endpoints, not inside the candidate
 *   body, so this enrichment step avoids making users chain multiple nodes.
 * - GetMany: forwards any filter parameters the user has set, normalising
 *   resourceLocator fields (e.g. owner_id) before sending the request.
 * - Create / Update: parses custom_fields from a JSON string if needed, since
 *   the API requires a JSON object but users often paste raw JSON.
 */

import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	asArray,
	getManatalIdParameter,
	handleGetMany,
	manatalApiRequest,
	normalizeDateField,
	normalizeLocatorField,
	parseJsonField,
} from '../GenericFunctions';

export async function candidateExecute(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'get') {
		const id = getManatalIdParameter.call(this, 'candidateId', i);

		// Fetch the candidate profile, education list, and experience list in parallel
		// to minimise latency. Education and experience are returned as raw arrays.
		const [candidate, educationsRaw, experiencesRaw] = await Promise.all([
			manatalApiRequest.call(this, 'GET', `/candidates/${id}/`),
			manatalApiRequest.call(this, 'GET', `/candidates/${id}/educations/`),
			manatalApiRequest.call(this, 'GET', `/candidates/${id}/experiences/`),
		]);
		return { ...candidate, educations: asArray(educationsRaw), experiences: asArray(experiencesRaw) };
	}

	if (operation === 'getMany') {
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		normalizeLocatorField(filters, 'owner_id');
		return handleGetMany.call(this, '/candidates/', i, { ...filters });
	}

	if (operation === 'create') {
		const fullName = this.getNodeParameter('fullName', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
		normalizeLocatorField(additionalFields, 'owner');
		const body: IDataObject = { full_name: fullName, ...additionalFields };
		normalizeDateField(body, 'birth_date');
		parseJsonField(body, 'custom_fields');
		return manatalApiRequest.call(this, 'POST', '/candidates/', body);
	}

	if (operation === 'update') {
		const id = getManatalIdParameter.call(this, 'candidateId', i);
		const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
		normalizeLocatorField(updateFields, 'owner');
		normalizeDateField(updateFields, 'birth_date');
		parseJsonField(updateFields, 'custom_fields');
		return manatalApiRequest.call(this, 'PATCH', `/candidates/${id}/`, updateFields);
	}

	throw new NodeOperationError(this.getNode(), `Unknown operation "${operation}" for resource "candidate"`, { itemIndex: i });
}
