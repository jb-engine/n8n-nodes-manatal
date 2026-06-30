/**
 * handlers/candidateSubresources.ts
 *
 * Handles candidate-specific sub-resources that don't fit the generic
 * note/attachment pattern:
 *
 *   candidateMatch     — read-only view of pipeline matches for a candidate
 *                        (paginated, getMany + get by ID)
 *   candidateResume    — non-standard URL shape (/resume/ not /resumes/),
 *                        raw-array response, supports get and upload only
 *   candidateSocialMedia — raw-array list, supports optional platform filter,
 *                          create and get by ID
 *
 * All operations first resolve the parent candidate ID from the 'candidateId'
 * node parameter, then build the sub-resource URL from there.
 */

import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	asArray,
	getManatalIdParameter,
	handleGetMany,
	manatalApiRequest,
} from '../GenericFunctions';

export async function candidateSubresourceExecute(
	this: IExecuteFunctions,
	resource: string,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	const candidateId = getManatalIdParameter.call(this, 'candidateId', i);

	// Match: read-only view of pipeline matches for a candidate
	if (resource === 'candidateMatch') {
		if (operation === 'getMany') {
			return handleGetMany.call(this, `/candidates/${candidateId}/matches/`, i, {});
		}
		if (operation === 'get') {
			const matchId = getManatalIdParameter.call(this, 'matchId', i);
			return manatalApiRequest.call(this, 'GET', `/candidates/${candidateId}/matches/${matchId}/`);
		}
	}

	// Resume: non-standard URL (/resume/ singular), raw array response, no update
	if (resource === 'candidateResume') {
		if (operation === 'get') {
			return asArray(
				await manatalApiRequest.call(this, 'GET', `/candidates/${candidateId}/resume/`),
			);
		}
		if (operation === 'upload') {
			const resumeFile = this.getNodeParameter('resume_file', i) as string;
			return manatalApiRequest.call(this, 'POST', `/candidates/${candidateId}/resume/`, {
				resume_file: resumeFile,
			});
		}
	}

	// Social media: raw array list with optional platform filter, no update
	if (resource === 'candidateSocialMedia') {
		if (operation === 'getMany') {
			const filters = this.getNodeParameter('filters', i) as IDataObject;
			const qs: IDataObject = {};
			if (filters.social_media) qs.social_media = filters.social_media;
			return asArray(
				await manatalApiRequest.call(
					this,
					'GET',
					`/candidates/${candidateId}/social-media/`,
					{},
					qs,
				),
			);
		}
		if (operation === 'get') {
			const socialMediaId = getManatalIdParameter.call(this, 'socialMediaId', i);
			return manatalApiRequest.call(
				this,
				'GET',
				`/candidates/${candidateId}/social-media/${socialMediaId}/`,
			);
		}
		if (operation === 'create') {
			const social_media = this.getNodeParameter('social_media', i) as string;
			const social_media_url = this.getNodeParameter('social_media_url', i) as string;
			const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
			return manatalApiRequest.call(this, 'POST', `/candidates/${candidateId}/social-media/`, {
				social_media,
				social_media_url,
				...additionalFields,
			});
		}
	}

	throw new NodeOperationError(
		this.getNode(),
		`Unknown operation "${operation}" for resource "${resource}"`,
		{ itemIndex: i },
	);
}
