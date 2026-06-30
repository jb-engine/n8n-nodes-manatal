import type { INodeProperties } from 'n8n-workflow';
import { JOB_MODES, MATCH_MODES } from './SharedFields';

export const jobMatchViewOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['jobMatch'] } },
		options: [
			{ name: 'Get', value: 'get', action: 'Get a match', description: 'Retrieve a match by ID' },
			{
				name: 'Get Many',
				value: 'getMany',
				action: 'Get many matches',
				description: 'Retrieve all matches for this job',
			},
		],
		default: 'getMany',
	},
];

export const jobMatchViewFields: INodeProperties[] = [
	{
		displayName: 'Job ID',
		name: 'jobId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: JOB_MODES,
		displayOptions: { show: { resource: ['jobMatch'] } },
		description: 'Numeric ID of the job whose pipeline matches to view',
	},
	{
		displayName: 'Match ID',
		name: 'matchId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: MATCH_MODES,
		displayOptions: { show: { resource: ['jobMatch'], operation: ['get'] } },
		description: 'Numeric ID of the pipeline match to retrieve',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: { show: { resource: ['jobMatch'], operation: ['getMany'] } },
		description: 'Fetch every pipeline match for this job instead of stopping at the limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 10,
		displayOptions: {
			show: { resource: ['jobMatch'], operation: ['getMany'], returnAll: [false] },
		},
		description: 'Max number of results to return',
	},
];
