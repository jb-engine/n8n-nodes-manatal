import type { INodeProperties } from 'n8n-workflow';
import {
	CANDIDATE_MODES,
	CONTACT_MODES,
	JOB_MODES,
	MATCH_MODES,
	ORGANIZATION_MODES,
} from './SharedFields';

const ALL_NOTE_RESOURCES = [
	'candidateNote',
	'jobNote',
	'matchNote',
	'organizationNote',
	'contactNote',
];

export const noteOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ALL_NOTE_RESOURCES } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a note',
				description: 'Create a new note',
			},
			{ name: 'Get', value: 'get', action: 'Get a note', description: 'Retrieve a note by ID' },
			{
				name: 'Get Many',
				value: 'getMany',
				action: 'Get many notes',
				description: 'Retrieve all notes',
			},
			{ name: 'Update', value: 'update', action: 'Update a note', description: 'Update a note' },
		],
		default: 'getMany',
	},
];

export const noteFields: INodeProperties[] = [
	{
		displayName: 'Candidate ID',
		name: 'candidateId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: CANDIDATE_MODES,
		displayOptions: { show: { resource: ['candidateNote'] } },
		description: 'Numeric ID of the candidate whose notes to manage',
	},
	{
		displayName: 'Job ID',
		name: 'jobId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: JOB_MODES,
		displayOptions: { show: { resource: ['jobNote'] } },
		description: 'Numeric ID of the job whose notes to manage',
	},
	{
		displayName: 'Match ID',
		name: 'matchId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: MATCH_MODES,
		displayOptions: { show: { resource: ['matchNote'] } },
		description: 'Numeric ID of the match whose notes to manage',
	},
	{
		displayName: 'Organization ID',
		name: 'organizationId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: ORGANIZATION_MODES,
		displayOptions: { show: { resource: ['organizationNote'] } },
		description: 'Numeric ID of the organization whose notes to manage',
	},
	{
		displayName: 'Contact ID',
		name: 'contactId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: CONTACT_MODES,
		displayOptions: { show: { resource: ['contactNote'] } },
		description: 'Numeric ID of the contact whose notes to manage',
	},

	{
		displayName: 'Note',
		name: 'noteId',
		type: 'options',
		required: true,
		default: '',
		displayOptions: {
			show: { resource: ALL_NOTE_RESOURCES, operation: ['get', 'update'] },
		},
		description: 'Note to retrieve or update. Loads from the selected parent resource.',
		typeOptions: {
			loadOptionsMethod: 'getNoteOptions',
			loadOptionsDependsOn: ['candidateId', 'contactId', 'jobId', 'matchId', 'organizationId'],
		},
	},

	//	Create

	{
		displayName: 'Info',
		name: 'info',
		type: 'string',
		required: true,
		default: '',
		placeholder: '',
		typeOptions: { rows: 4 },
		displayOptions: { show: { resource: ALL_NOTE_RESOURCES, operation: ['create'] } },
		description: 'Body text of the note',
	},

	// Update

	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ALL_NOTE_RESOURCES, operation: ['update'] } },
		options: [
			{
				displayName: 'Info',
				name: 'info',
				type: 'string',
				default: '',
				placeholder: '',
				typeOptions: { rows: 4 },
				description: 'Replacement body text for the note',
			},
		],
	},
];
