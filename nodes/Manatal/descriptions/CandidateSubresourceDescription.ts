import type { INodeProperties } from 'n8n-workflow';
import { CANDIDATE_MODES, MATCH_MODES } from './SharedFields';

//	CANDIDATE RESUME

export const candidateResumeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['candidateResume'] } },
		options: [
			{
				name: 'Get Many',
				value: 'getMany',
				action: 'Get resumes',
				description: 'Retrieve all resume versions for a candidate',
			},
			{
				name: 'Upload',
				value: 'upload',
				action: 'Upload a resume',
				description: 'Upload a resume URL for a candidate',
			},
		],
		default: 'getMany',
	},
];

export const candidateResumeFields: INodeProperties[] = [
	{
		displayName: 'Candidate ID',
		name: 'candidateId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: CANDIDATE_MODES,
		displayOptions: { show: { resource: ['candidateResume'] } },
		description: 'Numeric ID of the candidate whose resumes to manage',
	},
	{
		displayName: 'Resume File URL',
		name: 'resume_file',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://example.com/resume.pdf',
		displayOptions: { show: { resource: ['candidateResume'], operation: ['upload'] } },
		description: 'Publicly accessible URL of the resume file to upload',
	},
];

//	CANDIDATE SOCIAL MEDIA

export const candidateSocialMediaOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['candidateSocialMedia'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a social media profile',
				description: 'Add a social media profile to a candidate',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a social media profile',
				description: 'Retrieve a social media profile by ID',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				action: 'Get many social media profiles',
				description: 'Retrieve all social media profiles for a candidate',
			},
		],
		default: 'getMany',
	},
];

export const candidateSocialMediaFields: INodeProperties[] = [
	{
		displayName: 'Candidate ID',
		name: 'candidateId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: CANDIDATE_MODES,
		displayOptions: { show: { resource: ['candidateSocialMedia'] } },
		description: 'Numeric ID of the candidate whose social media profiles to manage',
	},
	{
		displayName: 'Social Media ID',
		name: 'socialMediaId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 4291037',
		displayOptions: { show: { resource: ['candidateSocialMedia'], operation: ['get'] } },
		description: 'Numeric ID of the social media profile to retrieve',
	},
	{
		displayName: 'Platform',
		name: 'social_media',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'linkedin',
		displayOptions: { show: { resource: ['candidateSocialMedia'], operation: ['create'] } },
		description: 'Platform identifier slug for the social media network (e.g. linkedin, twitter)',
	},
	{
		displayName: 'Profile URL',
		name: 'social_media_url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://linkedin.com/in/username',
		displayOptions: { show: { resource: ['candidateSocialMedia'], operation: ['create'] } },
		description: 'Full public URL of the candidate profile on the platform',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['candidateSocialMedia'], operation: ['create'] } },
		options: [
			{
				displayName: 'To Be Scraped',
				name: 'to_be_scraped',
				type: 'boolean',
				default: false,
				description:
					'Enable to have Manatal automatically enrich the candidate profile from this URL',
			},
			{
				displayName: 'Username',
				name: 'username',
				type: 'string',
				default: '',
				placeholder: 'jane.smith',
				description: "Candidate's username or handle on this platform",
			},
		],
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: ['candidateSocialMedia'], operation: ['getMany'] } },
		options: [
			{
				displayName: 'Platform',
				name: 'social_media',
				type: 'string',
				default: '',
				placeholder: 'linkedin',
				description: 'Return profiles for this platform only (partial match on slug)',
			},
		],
	},
];

//	CANDIDATE MATCH

export const candidateMatchViewOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['candidateMatch'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a match',
				description: 'Retrieve a pipeline match by ID',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				action: 'Get many matches',
				description: 'Retrieve all pipeline matches for a candidate',
			},
		],
		default: 'getMany',
	},
];

export const candidateMatchViewFields: INodeProperties[] = [
	{
		displayName: 'Candidate ID',
		name: 'candidateId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: CANDIDATE_MODES,
		displayOptions: { show: { resource: ['candidateMatch'] } },
		description: 'Numeric ID of the candidate whose matches to view',
	},
	{
		displayName: 'Match ID',
		name: 'matchId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: MATCH_MODES,
		displayOptions: { show: { resource: ['candidateMatch'], operation: ['get'] } },
		description: 'Numeric ID of the match to retrieve',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: { show: { resource: ['candidateMatch'], operation: ['getMany'] } },
		description: 'Fetch every match for this candidate instead of stopping at the limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 10,
		displayOptions: {
			show: { resource: ['candidateMatch'], operation: ['getMany'], returnAll: [false] },
		},
		description: 'Max number of results to return',
	},
];
