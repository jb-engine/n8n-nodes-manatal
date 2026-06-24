import type { INodeProperties } from 'n8n-workflow';
import { CONTACT_MODES, ORGANIZATION_MODES } from './SharedFields';

export const contactOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: { resource: ['contact'] },
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a contact',
				description: 'Create a new contact',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a contact',
				description: 'Retrieve a contact by ID',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				action: 'Get many contacts',
				description: 'Retrieve a list of contacts',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a contact',
				description: 'Update a contact',
			},
		],
		default: 'getMany',
	},
];

export const contactFields: INodeProperties[] = [
	{
		displayName: 'Contact ID',
		name: 'contactId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: CONTACT_MODES,
		displayOptions: {
			show: { resource: ['contact'], operation: ['get'] },
		},
		description: 'Numeric ID of the contact to retrieve',
	},

	//  GET MANY
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: { resource: ['contact'], operation: ['getMany'] },
		},
		description: 'Fetch every matching contact instead of stopping at the limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 10,
		displayOptions: {
			show: { resource: ['contact'], operation: ['getMany'], returnAll: [false] },
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: { resource: ['contact'], operation: ['getMany'] },
		},
		options: [
			{
				displayName: 'Created At (From)',
				name: 'created_at__gte',
				type: 'dateTime',
				default: '',
				description: 'Return contacts created on or after this date',
			},
			{
				displayName: 'Created At (To)',
				name: 'created_at__lte',
				type: 'dateTime',
				default: '',
				description: 'Return contacts created on or before this date',
			},
			{
				displayName: 'Display Name',
				name: 'display_name',
				type: 'string',
				default: '',
				placeholder: 'Jane Smith',
				description: 'Return contacts whose display name contains this text (partial match)',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'jane.smith@company.com',
				description: 'Return contacts with this exact email address',
			},
			{
				displayName: 'Full Name',
				name: 'full_name',
				type: 'string',
				default: '',
				placeholder: 'Jane Smith',
				description: 'Return contacts whose name contains this text (partial match)',
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'number',
				default: '',
				description: 'Return the contact with this exact ID',
			},
			{
				displayName: 'Organization',
				name: 'organization',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Return contacts belonging to this organization',
				modes: ORGANIZATION_MODES,
			},
			{
				displayName: 'Phone Number',
				name: 'phone_number',
				type: 'string',
				default: '',
				placeholder: '+1 555 000 0001',
				description: 'Return contacts with this exact phone number',
			},
			{
				displayName: 'Updated At (From)',
				name: 'updated_at__gte',
				type: 'dateTime',
				default: '',
				description: 'Return contacts updated on or after this date',
			},
			{
				displayName: 'Updated At (To)',
				name: 'updated_at__lte',
				type: 'dateTime',
				default: '',
				description: 'Return contacts updated on or before this date',
			},
		],
	},

	//	CREATE
	{
		displayName: 'Full Name',
		name: 'fullName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Jane Smith',
		displayOptions: {
			show: { resource: ['contact'], operation: ['create'] },
		},
		description: 'Full name of the contact',
	},
	{
		displayName: 'Organization',
		name: 'organization',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		modes: ORGANIZATION_MODES,
		displayOptions: {
			show: { resource: ['contact'], operation: ['create'] },
		},
		description: 'Organization this contact is associated with',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: { resource: ['contact'], operation: ['create'] },
		},
		options: [
			{
				displayName: 'Custom Fields',
				name: 'custom_fields',
				type: 'json',
				default: '{}',
				description:
					'Custom field values as a JSON object. Must be a full object â€" partial updates will overwrite existing values.',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				description: 'Free-text notes or summary about the contact',
			},
			{
				displayName: 'Display Name',
				name: 'display_name',
				type: 'string',
				default: '',
				placeholder: 'Jane Smith',
				description: 'Alternative display name shown in lists instead of the full name',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'jane.smith@company.com',
				default: '',
				description: "Contact's primary email address",
			},
			{
				displayName: 'Phone Number',
				name: 'phone_number',
				type: 'string',
				default: '',
				placeholder: '+1 555 000 0001',
				description: "Contact's primary phone number",
			},
		],
	},

	// UPDATE
	{
		displayName: 'Contact ID',
		name: 'contactId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: CONTACT_MODES,
		displayOptions: {
			show: { resource: ['contact'], operation: ['update'] },
		},
		description: 'Numeric ID of the contact to update',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: { resource: ['contact'], operation: ['update'] },
		},
		options: [
			{
				displayName: 'Custom Fields',
				name: 'custom_fields',
				type: 'json',
				default: '{}',
				description:
					'Custom field values as a JSON object. Must be a full object - partial updates will overwrite existing values.',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				description: 'Free-text notes or summary about the contact',
			},
			{
				displayName: 'Display Name',
				name: 'display_name',
				type: 'string',
				default: '',
				placeholder: 'Jane Smith',
				description: 'Alternative display name shown in lists instead of the full name',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'jane.smith@company.com',
				default: '',
				description: "Contact's primary email address",
			},
			{
				displayName: 'Full Name',
				name: 'full_name',
				type: 'string',
				default: '',
				placeholder: 'Jane Smith',
				description: "Contact's full name",
			},
			{
				displayName: 'Organization',
				name: 'organization',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				modes: ORGANIZATION_MODES,
				description: 'Organization this contact is associated with',
			},
			{
				displayName: 'Phone Number',
				name: 'phone_number',
				type: 'string',
				default: '',
				placeholder: '+1 555 000 0001',
				description: "Contact's primary phone number",
			},
		],
	},
];
