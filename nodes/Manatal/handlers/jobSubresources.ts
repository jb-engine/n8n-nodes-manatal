/**
 * handlers/jobSubresources.ts
 *
 * Handles job-specific sub-resources.
 *
 * Currently supports:
 *   jobMatch — read-only view of pipeline matches for a job
 *              (/jobs/{jobId}/matches/)
 *              Uses the standard paginated handleGetMany for getMany,
 *              and a direct GET for fetching a single match by ID.
 *
 * New job sub-resources (e.g. job stages) can be added as additional
 * resource branches inside jobSubresourceExecute.
 */

import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { getManatalIdParameter, handleGetMany, manatalApiRequest } from '../GenericFunctions';

export async function jobSubresourceExecute(
	this: IExecuteFunctions,
	resource: string,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	const jobId = getManatalIdParameter.call(this, 'jobId', i);

	if (resource === 'jobMatch') {
		if (operation === 'getMany') {
			return handleGetMany.call(this, `/jobs/${jobId}/matches/`, i, {});
		}
		if (operation === 'get') {
			const matchId = getManatalIdParameter.call(this, 'matchId', i);
			return manatalApiRequest.call(this, 'GET', `/jobs/${jobId}/matches/${matchId}/`);
		}
	}

	throw new NodeOperationError(
		this.getNode(),
		`Unknown operation "${operation}" for resource "${resource}"`,
		{ itemIndex: i },
	);
}
