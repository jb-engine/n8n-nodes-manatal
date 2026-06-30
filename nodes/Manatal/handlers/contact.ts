/**
 * handlers/contact.ts
 *
 * Handles all operations for the Contact resource.
 *
 * Notable behaviour:
 * - GetMany filter: the user picks an organization via a resourceLocator field
 *   named 'organization', but the API filter parameter is 'organization_id'.
 *   We remap and normalise the value before forwarding the query string.
 * - Create: organization is a required field (contacts must belong to an org).
 * - Update: normalises the organization locator field before patching.
 */

import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	getManatalIdParameter,
	handleGetMany,
	manatalApiRequest,
	normalizeLocatorField,
	remapLocatorField,
} from '../GenericFunctions';

export async function contactExecute(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'get') {
		const id = getManatalIdParameter.call(this, 'contactId', i);
		return manatalApiRequest.call(this, 'GET', `/contacts/${id}/`);
	}

	if (operation === 'getMany') {
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		// UI field 'organization' maps to the API query param 'organization_id'
		remapLocatorField(filters, 'organization', 'organization_id');
		return handleGetMany.call(this, '/contacts/', i, { ...filters });
	}

	if (operation === 'create') {
		const fullName = this.getNodeParameter('fullName', i) as string;
		const organization = getManatalIdParameter.call(this, 'organization', i);
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
		const body: IDataObject = { full_name: fullName, organization, ...additionalFields };
		return manatalApiRequest.call(this, 'POST', '/contacts/', body);
	}

	if (operation === 'update') {
		const id = getManatalIdParameter.call(this, 'contactId', i);
		const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
		normalizeLocatorField(updateFields, 'organization');
		return manatalApiRequest.call(this, 'PATCH', `/contacts/${id}/`, updateFields);
	}

	throw new NodeOperationError(
		this.getNode(),
		`Unknown operation "${operation}" for resource "contact"`,
		{ itemIndex: i },
	);
}
