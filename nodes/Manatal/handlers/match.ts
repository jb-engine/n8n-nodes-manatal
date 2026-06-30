/**
 * handlers/match.ts
 *
 * Handles all operations for the Match resource.
 * A "match" is a candidate-to-job pipeline entry in Manatal.
 *
 * Notable behaviour:
 * - Create: requires both a candidateId and a jobId; the API fields are
 *   'candidate' and 'job' (plain numeric IDs, not nested objects).
 * - Update: the pipeline stage field requires special handling — the API
 *   expects { job_pipeline_stage: { id: <stageId> } } rather than a flat ID.
 *   This transformation is applied here before the PATCH request.
 */

import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	getManatalIdParameter,
	handleGetMany,
	manatalApiRequest,
	normalizeDateField,
	normalizeLocatorField,
	normalizeManatalId,
} from '../GenericFunctions';

export async function matchExecute(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'get') {
		const id = getManatalIdParameter.call(this, 'matchId', i);
		return manatalApiRequest.call(this, 'GET', `/matches/${id}/`);
	}

	if (operation === 'getMany') {
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		return handleGetMany.call(this, '/matches/', i, { ...filters });
	}

	if (operation === 'create') {
		const candidateId = getManatalIdParameter.call(this, 'candidateId', i);
		const jobId = getManatalIdParameter.call(this, 'jobId', i);
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
		normalizeLocatorField(additionalFields, 'owner');
		const body: IDataObject = { candidate: candidateId, job: jobId, ...additionalFields };
		for (const f of ['dropped_at', 'hired_at', 'interview_at', 'offer_at', 'submitted_at']) {
			normalizeDateField(body, f);
		}
		return manatalApiRequest.call(this, 'POST', '/matches/', body);
	}

	if (operation === 'update') {
		const id = getManatalIdParameter.call(this, 'matchId', i);
		const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
		normalizeLocatorField(updateFields, 'owner');
		for (const f of ['dropped_at', 'hired_at', 'interview_at', 'offer_at', 'submitted_at']) {
			normalizeDateField(updateFields, f);
		}
		// The Manatal API requires pipeline stage as a nested object, not a flat ID
		if (updateFields.job_pipeline_stage !== undefined && updateFields.job_pipeline_stage !== '') {
			updateFields.job_pipeline_stage = { id: normalizeManatalId(updateFields.job_pipeline_stage) };
		}
		return manatalApiRequest.call(this, 'PATCH', `/matches/${id}/`, updateFields);
	}

	throw new NodeOperationError(
		this.getNode(),
		`Unknown operation "${operation}" for resource "match"`,
		{ itemIndex: i },
	);
}
