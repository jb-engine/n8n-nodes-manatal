/**
 * handlers/organization.ts
 *
 * Handles all operations for the Organization resource.
 * Organizations represent client companies in Manatal's CRM.
 *
 * Notable behaviour:
 * - GetMany: normalises creator_id and owner_id locator fields to plain
 *   numeric IDs before forwarding them as query parameters.
 * - Create / Update: normalises the owner locator before sending the request.
 */

import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	getManatalIdParameter,
	handleGetMany,
	manatalApiRequest,
	normalizeLocatorField,
} from '../GenericFunctions';

export async function organizationExecute(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'get') {
		const id = getManatalIdParameter.call(this, 'organizationId', i);
		return manatalApiRequest.call(this, 'GET', `/organizations/${id}/`);
	}

	if (operation === 'getMany') {
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		normalizeLocatorField(filters, 'creator_id');
		normalizeLocatorField(filters, 'owner_id');
		return handleGetMany.call(this, '/organizations/', i, { ...filters });
	}

	if (operation === 'create') {
		const name = this.getNodeParameter('name', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
		normalizeLocatorField(additionalFields, 'owner');
		const body: IDataObject = { name, ...additionalFields };
		return manatalApiRequest.call(this, 'POST', '/organizations/', body);
	}

	if (operation === 'update') {
		const id = getManatalIdParameter.call(this, 'organizationId', i);
		const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
		normalizeLocatorField(updateFields, 'owner');
		return manatalApiRequest.call(this, 'PATCH', `/organizations/${id}/`, updateFields);
	}

	throw new NodeOperationError(
		this.getNode(),
		`Unknown operation "${operation}" for resource "organization"`,
		{ itemIndex: i },
	);
}
