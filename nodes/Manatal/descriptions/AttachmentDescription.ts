import type { INodeProperties } from 'n8n-workflow';
import {
	CANDIDATE_MODES,
	CONTACT_MODES,
	JOB_MODES,
	MATCH_MODES,
	ORGANIZATION_MODES,
	USER_MODES,
} from './SharedFields';

const ALL_ATTACHMENT_RESOURCES = [
	'candidateAttachment',
	'jobAttachment',
	'matchAttachment',
	'organizationAttachment',
	'contactAttachment',
];

export const attachmentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ALL_ATTACHMENT_RESOURCES } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create an attachment',
				description: 'Upload a new attachment',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an attachment',
				description: 'Retrieve an attachment by ID',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				action: 'Get many attachments',
				description: 'Retrieve all attachments',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an attachment',
				description: 'Update an attachment',
			},
		],
		default: 'getMany',
	},
];

export const attachmentFields: INodeProperties[] = [
	//  Parent ID fields

	{
		displayName: 'Candidate ID',
		name: 'candidateId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: CANDIDATE_MODES,
		displayOptions: { show: { resource: ['candidateAttachment'] } },
		description: 'Numeric ID of the candidate whose attachments to manage',
	},
	{
		displayName: 'Job ID',
		name: 'jobId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: JOB_MODES,
		displayOptions: { show: { resource: ['jobAttachment'] } },
		description: 'Numeric ID of the job whose attachments to manage',
	},
	{
		displayName: 'Match ID',
		name: 'matchId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: MATCH_MODES,
		displayOptions: { show: { resource: ['matchAttachment'] } },
		description: 'Numeric ID of the match whose attachments to manage',
	},
	{
		displayName: 'Organization ID',
		name: 'organizationId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: ORGANIZATION_MODES,
		displayOptions: { show: { resource: ['organizationAttachment'] } },
		description: 'Numeric ID of the organization whose attachments to manage',
	},
	{
		displayName: 'Contact ID',
		name: 'contactId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: CONTACT_MODES,
		displayOptions: { show: { resource: ['contactAttachment'] } },
		description: 'Numeric ID of the contact whose attachments to manage',
	},

	//  Attachment ID (get / update / delete)

	{
		displayName: 'Attachment',
		name: 'attachmentId',
		type: 'options',
		required: true,
		default: '',
		displayOptions: {
			show: { resource: ALL_ATTACHMENT_RESOURCES, operation: ['get', 'update'] },
		},
		description: 'Attachment to retrieve or update. Loads from the selected parent resource.',
		typeOptions: {
			loadOptionsMethod: 'getAttachmentOptions',
			loadOptionsDependsOn: ['candidateId', 'contactId', 'jobId', 'matchId', 'organizationId'],
		},
	},

	//	Create

	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'offer_letter.pdf',
		displayOptions: { show: { resource: ALL_ATTACHMENT_RESOURCES, operation: ['create'] } },
		description: 'Display name for this attachment',
	},
	{
		displayName: 'File URL',
		name: 'file',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://example.com/offer_letter.pdf',
		displayOptions: { show: { resource: ALL_ATTACHMENT_RESOURCES, operation: ['create'] } },
		description: 'Publicly accessible URL pointing to the file to attach',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ALL_ATTACHMENT_RESOURCES, operation: ['create'] } },
		options: [
			{
				displayName: 'Creator',
				name: 'creator',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'User to attribute as the creator of this attachment',
				modes: USER_MODES,
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Free-text notes about what this attachment contains',
			},
		],
	},

	//	Update

	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ALL_ATTACHMENT_RESOURCES, operation: ['update'] } },
		options: [
			{
				displayName: 'Creator',
				name: 'creator',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'User to attribute as the creator of this attachment',
				modes: USER_MODES,
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Free-text notes about what this attachment contains',
			},
			{
				displayName: 'File URL',
				name: 'file',
				type: 'string',
				default: '',
				placeholder: 'https://example.com/offer_letter.pdf',
				description: 'Publicly accessible URL pointing to the replacement file',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				placeholder: 'offer_letter.pdf',
				description: 'Display name for this attachment',
			},
		],
	},
];
