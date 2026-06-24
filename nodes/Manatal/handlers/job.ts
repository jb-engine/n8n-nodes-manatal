/**
 * handlers/job.ts
 *
 * Handles all operations for the Job resource.
 *
 * Notable behaviour:
 * - GetMany filters: the 'organization' locator field must be remapped to
 *   'organization_id' for the API query string (same pattern as contact.ts).
 *   'creator_id' and 'owner_id' are also locator fields that need normalising.
 * - Create: position_name and organization are required fields.
 * - Update: normalises the owner locator and parses custom_fields JSON.
 */

import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	getManatalIdParameter,
	handleGetMany,
	manatalApiRequest,
	normalizeDateField,
	normalizeLocatorField,
	parseJsonField,
	remapLocatorField,
} from '../GenericFunctions';

export async function jobExecute(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'get') {
		const id = getManatalIdParameter.call(this, 'jobId', i);
		return manatalApiRequest.call(this, 'GET', `/jobs/${id}/`);
	}

	if (operation === 'getMany') {
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		// UI field 'organization' maps to the API query param 'organization_id'
		remapLocatorField(filters, 'organization', 'organization_id');
		normalizeLocatorField(filters, 'creator_id');
		normalizeLocatorField(filters, 'owner_id');
		return handleGetMany.call(this, '/jobs/', i, { ...filters });
	}

	if (operation === 'create') {
		const positionName = this.getNodeParameter('positionName', i) as string;
		const organization = getManatalIdParameter.call(this, 'organization', i);
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
		normalizeLocatorField(additionalFields, 'owner');
		const body: IDataObject = { position_name: positionName, organization, ...additionalFields };
		normalizeDateField(body, 'expected_close_at');
		parseJsonField(body, 'custom_fields');
		return manatalApiRequest.call(this, 'POST', '/jobs/', body);
	}

	if (operation === 'update') {
		const id = getManatalIdParameter.call(this, 'jobId', i);
		const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
		normalizeLocatorField(updateFields, 'owner');
		normalizeDateField(updateFields, 'expected_close_at');
		parseJsonField(updateFields, 'custom_fields');
		return manatalApiRequest.call(this, 'PATCH', `/jobs/${id}/`, updateFields);
	}

	throw new NodeOperationError(this.getNode(), `Unknown operation "${operation}" for resource "job"`, { itemIndex: i });
}
