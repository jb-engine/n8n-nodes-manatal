/**
 * Manatal.node.ts
 *
 * Main action node for the Manatal ATS integration.
 * Exposes CRUD operations for 19 resources across candidates, contacts, jobs,
 * matches, organizations, notes, attachments, and candidate/job sub-resources.
 *
 * Architecture:
 * - The resource dropdown and all field definitions live in *Description.ts files.
 * - Execution logic is split into handler files (handlers/*.ts) — one per resource group.
 * - This file wires everything together: imports descriptions, imports handlers,
 *   and routes each resource/operation combination to the correct handler in execute().
 *
 * loadOptions methods power dynamic dropdowns (users, stages, industries, etc.)
 * by fetching lookup data from the Manatal API at design time.
 *
 * listSearch methods support the "By Name" search mode on resourceLocator fields,
 * enabling users to search for records rather than pasting raw IDs.
 */

import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeListSearchResult,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { attachmentFields, attachmentOperations } from './descriptions/AttachmentDescription';
import { candidateFields, candidateOperations } from './descriptions/CandidateDescription';
import {
	candidateMatchViewFields,
	candidateMatchViewOperations,
	candidateResumeFields,
	candidateResumeOperations,
	candidateSocialMediaFields,
	candidateSocialMediaOperations,
} from './descriptions/CandidateSubresourceDescription';
import { contactFields, contactOperations } from './descriptions/ContactDescription';
import { manatalApiRequest, normalizeManatalId, parentResourcePath } from './GenericFunctions';
import { jobFields, jobOperations } from './descriptions/JobDescription';
import {
	jobMatchViewFields,
	jobMatchViewOperations,
} from './descriptions/JobSubresourceDescription';
import { matchFields, matchOperations } from './descriptions/MatchDescription';
import { noteFields, noteOperations } from './descriptions/NoteDescription';
import { organizationFields, organizationOperations } from './descriptions/OrganizationDescription';

import { attachmentExecute } from './handlers/attachment';
import { candidateExecute } from './handlers/candidate';
import { candidateSubresourceExecute } from './handlers/candidateSubresources';
import { contactExecute } from './handlers/contact';
import { jobExecute } from './handlers/job';
import { jobSubresourceExecute } from './handlers/jobSubresources';
import { matchExecute } from './handlers/match';
import { noteExecute } from './handlers/note';
import { organizationExecute } from './handlers/organization';

async function loadSubresourceOptions(
	ctx: ILoadOptionsFunctions,
	subpath: string,
	mapFn: (item: IDataObject) => INodePropertyOptions,
): Promise<INodePropertyOptions[]> {
	const resource = ctx.getNodeParameter('resource') as string;
	let parentInfo: { apiBase: string; idParam: string };
	try {
		parentInfo = parentResourcePath(resource);
	} catch {
		return [];
	}
	const { apiBase, idParam } = parentInfo;
	const parentId = normalizeManatalId(ctx.getNodeParameter(idParam) as IDataObject | string);
	if (!parentId) return [];
	const items = (await manatalApiRequest.call(
		ctx,
		'GET',
		`/${apiBase}/${parentId}/${subpath}`,
	)) as unknown as IDataObject[];
	return (Array.isArray(items) ? items : []).map(mapFn);
}

// Industries endpoint returns either a raw array or a { count, results[] } envelope
async function fetchIndustries(ctx: ILoadOptionsFunctions): Promise<IDataObject[]> {
	const response = await manatalApiRequest.call(ctx, 'GET', '/industries/');
	return (
		Array.isArray(response) ? response : ((response.results as IDataObject[]) ?? [])
	) as IDataObject[];
}

const CANDIDATE_SUBRESOURCES = ['candidateResume', 'candidateSocialMedia', 'candidateMatch'];

export class Manatal implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Manatal',
		name: 'manatal',
		icon: 'file:assets/manatal.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Create, retrieve, update, and delete Manatal ATS records',
		usableAsTool: true,
		defaults: { name: 'Manatal' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'manatalOpenAPIKey',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Candidate', value: 'candidate' },
					{ name: 'Candidate Attachment', value: 'candidateAttachment' },
					{ name: 'Candidate Match', value: 'candidateMatch' },
					{ name: 'Candidate Note', value: 'candidateNote' },
					{ name: 'Candidate Resume', value: 'candidateResume' },
					{ name: 'Candidate Social Media', value: 'candidateSocialMedia' },
					{ name: 'Contact', value: 'contact' },
					{ name: 'Contact Attachment', value: 'contactAttachment' },
					{ name: 'Contact Note', value: 'contactNote' },
					{ name: 'Job', value: 'job' },
					{ name: 'Job Attachment', value: 'jobAttachment' },
					{ name: 'Job Match', value: 'jobMatch' },
					{ name: 'Job Note', value: 'jobNote' },
					{ name: 'Match', value: 'match' },
					{ name: 'Match Attachment', value: 'matchAttachment' },
					{ name: 'Match Note', value: 'matchNote' },
					{ name: 'Organization', value: 'organization' },
					{ name: 'Organization Attachment', value: 'organizationAttachment' },
					{ name: 'Organization Note', value: 'organizationNote' },
				],
				default: 'candidate',
			},
			// Core resources
			...candidateOperations,
			...candidateFields,
			...jobOperations,
			...jobFields,
			...matchOperations,
			...matchFields,
			...organizationOperations,
			...organizationFields,
			...contactOperations,
			...contactFields,
			// Shared sub-resources
			...noteOperations,
			...noteFields,
			...attachmentOperations,
			...attachmentFields,
			// Candidate-specific sub-resources
			...candidateResumeOperations,
			...candidateResumeFields,
			...candidateSocialMediaOperations,
			...candidateSocialMediaFields,
			...candidateMatchViewOperations,
			...candidateMatchViewFields,
			// Job-specific sub-resources
			...jobMatchViewOperations,
			...jobMatchViewFields,
		],
	};

	methods = {
		loadOptions: {
			async getUsers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const response = await manatalApiRequest.call(
					this,
					'GET',
					'/users/',
					{},
					{ page_size: 100 },
				);
				const users = (response.results as IDataObject[]) ?? [];
				return users.map((u) => ({
					name: (u.full_name as string) || (u.email as string) || String(u.id),
					value: u.id as string | number,
				}));
			},

			async getIndustries(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const industries = await fetchIndustries(this);
				return industries.map((ind) => ({
					name: ind.name as string,
					value: ind.id as string | number,
				}));
			},

			async getCurrencies(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const items = (await manatalApiRequest.call(
					this,
					'GET',
					'/currencies/',
				)) as unknown as IDataObject[];
				return items.map((c) => ({
					name: `${c.name as string} (${c.code as string})`,
					value: c.code as string,
				}));
			},

			async getNationalities(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const items = (await manatalApiRequest.call(
					this,
					'GET',
					'/nationalities/',
				)) as unknown as IDataObject[];
				return items.map((n) => ({
					name: n.common_name as string,
					value: n.id as string | number,
				}));
			},

			async getAttachmentOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return loadSubresourceOptions(this, 'attachments/', (att) => ({
					name: `#${String(att.id)}${att.name ? ` — ${String(att.name)}` : ''}`,
					value: att.id as number,
				}));
			},

			async getNoteOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return loadSubresourceOptions(this, 'notes/', (note) => ({
					name: `#${String(note.id)}${note.info ? ` - ${String(note.info).slice(0, 25)}` : ''}`,
					value: note.id as number,
				}));
			},

			async getMatchPipelineStages(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const matchLocator = this.getNodeParameter('matchId') as IDataObject | string;
				const matchId = normalizeManatalId(matchLocator);
				if (!matchId) return [];
				const match = (await manatalApiRequest.call(
					this,
					'GET',
					`/matches/${matchId}/`,
				)) as IDataObject;
				const pipelineId = ((match.job_pipeline_stage as IDataObject)?.job_pipeline as IDataObject)
					?.id;
				if (!pipelineId) return [];
				const pipeline = (await manatalApiRequest.call(
					this,
					'GET',
					`/job-pipelines/${pipelineId}/`,
				)) as IDataObject;
				const stages = (pipeline.job_pipeline_stages as IDataObject[]) ?? [];
				return stages.map((stage) => ({
					name: stage.name as string,
					value: stage.id as number,
				}));
			},
		},

		listSearch: {
			async searchIndustries(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				const all = await fetchIndustries(this);
				const filtered = filter
					? all.filter((ind) => (ind.name as string).toLowerCase().includes(filter.toLowerCase()))
					: all;
				return {
					results: filtered.map((ind) => ({
						name: ind.name as string,
						value: ind.id as string | number,
					})),
				};
			},

			async searchUsers(
				this: ILoadOptionsFunctions,
				filter?: string,
				paginationToken?: string,
			): Promise<INodeListSearchResult> {
				const qs: IDataObject = { page_size: 50 };
				if (filter) qs.search = filter;
				if (paginationToken) qs.page = Number(paginationToken);
				const response = await manatalApiRequest.call(this, 'GET', '/users/', {}, qs);
				const users = (response.results as IDataObject[]) ?? [];
				const currentPage = paginationToken ? Number(paginationToken) : 1;
				return {
					results: users.map((u) => ({
						name: (u.full_name as string) || (u.email as string) || String(u.id),
						value: u.id as string | number,
					})),
					paginationToken: response.next ? String(currentPage + 1) : undefined,
				};
			},

			async searchOrganizations(
				this: ILoadOptionsFunctions,
				filter?: string,
				paginationToken?: string,
			): Promise<INodeListSearchResult> {
				const qs: IDataObject = { page_size: 50 };
				if (filter) qs.name = filter;
				if (paginationToken) qs.page = Number(paginationToken);
				const response = await manatalApiRequest.call(this, 'GET', '/organizations/', {}, qs);
				const organizations = (response.results as IDataObject[]) ?? [];
				const currentPage = paginationToken ? Number(paginationToken) : 1;
				return {
					results: organizations.map((o) => ({
						name: o.name as string,
						value: o.id as string | number,
					})),
					paginationToken: response.next ? String(currentPage + 1) : undefined,
				};
			},

			async searchCandidates(
				this: ILoadOptionsFunctions,
				filter?: string,
				paginationToken?: string,
			): Promise<INodeListSearchResult> {
				const qs: IDataObject = { page_size: 50 };
				if (filter) qs.full_name = filter;
				if (paginationToken) qs.page = Number(paginationToken);
				const response = await manatalApiRequest.call(this, 'GET', '/candidates/', {}, qs);
				const candidates = (response.results as IDataObject[]) ?? [];
				const currentPage = paginationToken ? Number(paginationToken) : 1;
				return {
					results: candidates.map((candidate) => ({
						name:
							(candidate.full_name as string) ||
							(candidate.email as string) ||
							`Candidate ${String(candidate.id)}`,
						value: candidate.id as string | number,
					})),
					paginationToken: response.next ? String(currentPage + 1) : undefined,
				};
			},

			async searchContacts(
				this: ILoadOptionsFunctions,
				filter?: string,
				paginationToken?: string,
			): Promise<INodeListSearchResult> {
				const qs: IDataObject = { page_size: 50 };
				if (filter) qs.full_name = filter;
				if (paginationToken) qs.page = Number(paginationToken);
				const response = await manatalApiRequest.call(this, 'GET', '/contacts/', {}, qs);
				const contacts = (response.results as IDataObject[]) ?? [];
				const currentPage = paginationToken ? Number(paginationToken) : 1;
				return {
					results: contacts.map((contact) => ({
						name:
							(contact.full_name as string) ||
							(contact.display_name as string) ||
							(contact.email as string) ||
							`Contact ${String(contact.id)}`,
						value: contact.id as string | number,
					})),
					paginationToken: response.next ? String(currentPage + 1) : undefined,
				};
			},

			async searchJobs(
				this: ILoadOptionsFunctions,
				filter?: string,
				paginationToken?: string,
			): Promise<INodeListSearchResult> {
				const qs: IDataObject = { page_size: 50 };
				if (filter) qs.position_name = filter;
				if (paginationToken) qs.page = Number(paginationToken);
				const response = await manatalApiRequest.call(this, 'GET', '/jobs/', {}, qs);
				const jobs = (response.results as IDataObject[]) ?? [];
				const currentPage = paginationToken ? Number(paginationToken) : 1;
				return {
					results: jobs.map((job) => ({
						name: (job.position_name as string) || (job.name as string) || `Job ${String(job.id)}`,
						value: job.id as string | number,
					})),
					paginationToken: response.next ? String(currentPage + 1) : undefined,
				};
			},

			async searchMatches(
				this: ILoadOptionsFunctions,
				filter?: string,
				paginationToken?: string,
			): Promise<INodeListSearchResult> {
				const qs: IDataObject = { page_size: 50 };
				if (paginationToken) qs.page = Number(paginationToken);
				const response = await manatalApiRequest.call(this, 'GET', '/matches/', {}, qs);
				const matches = (response.results as IDataObject[]) ?? [];
				const currentPage = paginationToken ? Number(paginationToken) : 1;
				const filtered = filter
					? matches.filter((match) =>
							JSON.stringify(match).toLowerCase().includes(filter.toLowerCase()),
						)
					: matches;
				return {
					results: filtered.map((match) => {
						const s = match.job_pipeline_stage as IDataObject | null;
						const stageSuffix =
							s && typeof s === 'object' && s.name ? ` [${s.name as string}]` : '';
						return {
							name: `Match ${String(match.id)}: Candidate ${String(match.candidate)} - Job ${String(match.job)}${stageSuffix}`,
							value: match.id as string | number,
						};
					}),
					paginationToken: response.next ? String(currentPage + 1) : undefined,
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject | IDataObject[];

				if (resource === 'candidate') {
					responseData = await candidateExecute.call(this, operation, i);
				} else if (resource === 'job') {
					responseData = await jobExecute.call(this, operation, i);
				} else if (resource === 'match') {
					responseData = await matchExecute.call(this, operation, i);
				} else if (resource === 'organization') {
					responseData = await organizationExecute.call(this, operation, i);
				} else if (resource === 'contact') {
					responseData = await contactExecute.call(this, operation, i);
				} else if (resource.endsWith('Note')) {
					responseData = await noteExecute.call(this, resource, operation, i);
				} else if (resource.endsWith('Attachment')) {
					responseData = await attachmentExecute.call(this, resource, operation, i);
				} else if (CANDIDATE_SUBRESOURCES.includes(resource)) {
					responseData = await candidateSubresourceExecute.call(this, resource, operation, i);
				} else if (resource === 'jobMatch') {
					responseData = await jobSubresourceExecute.call(this, resource, operation, i);
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource "${resource}"`, {
						itemIndex: i,
					});
				}

				const execItems = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as IDataObject | IDataObject[]),
					{ itemData: { item: i } },
				);
				returnData.push(...execItems);
			} catch (error) {
				if (this.continueOnFail()) {
					const errorItem = this.helpers.constructExecutionMetaData(
						[{ json: { error: (error as Error).message } }],
						{ itemData: { item: i } },
					);
					returnData.push(...errorItem);
					continue;
				}
				// eslint-disable-next-line @n8n/community-nodes/require-node-api-error
				throw error; // already a NodeApiError or NodeOperationError from handlers
			}
		}

		return [returnData];
	}
}
