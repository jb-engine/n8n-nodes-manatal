import type { INodeProperties } from 'n8n-workflow';
import { ORGANIZATION_MODES, USER_MODES } from './SharedFields';

export const organizationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: { resource: ['organization'] },
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create an organization',
				description: 'Create a new organization',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an organization',
				description: 'Retrieve an organization by ID',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				action: 'Get many organizations',
				description: 'Retrieve a list of organizations',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an organization',
				description: 'Update an organization',
			},
		],
		default: 'getMany',
	},
];

export const organizationFields: INodeProperties[] = [
	{
		displayName: 'Organization ID',
		name: 'organizationId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: ORGANIZATION_MODES,
		displayOptions: {
			show: { resource: ['organization'], operation: ['get'] },
		},
		description: 'Numeric ID of the organization to retrieve',
	},

	//	GET MANY
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: { resource: ['organization'], operation: ['getMany'] },
		},
		description: 'Fetch every matching organization instead of stopping at the limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 10,
		displayOptions: {
			show: { resource: ['organization'], operation: ['getMany'], returnAll: [false] },
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
			show: { resource: ['organization'], operation: ['getMany'] },
		},
		options: [
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				default: '',
				placeholder: '123 Main Street',
				description: 'Return organizations whose address contains this text (partial match)',
			},
			{
				displayName: 'Created At (From)',
				name: 'created_at__gte',
				type: 'dateTime',
				default: '',
				description: 'Return organizations created on or after this date',
			},
			{
				displayName: 'Created At (To)',
				name: 'created_at__lte',
				type: 'dateTime',
				default: '',
				description: 'Return organizations created on or before this date',
			},
			{
				displayName: 'Creator',
				name: 'creator_id',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Return organizations created by this user',
				modes: USER_MODES,
			},
			{
				displayName: 'External ID',
				name: 'external_id',
				type: 'string',
				default: '',
				placeholder: 'EXT-00142',
				description: 'Return organizations with this exact external system ID',
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'number',
				default: '',
				description: 'Return the organization with this exact ID',
			},
			{
				displayName: 'Is Public',
				name: 'is_public',
				type: 'boolean',
				default: true,
				description:
					'Set to true to return only public organizations; set to false for private only',
			},
			{
				displayName: 'Is Visible',
				name: 'is_visible',
				type: 'boolean',
				default: true,
				description:
					'Set to true to return only visible organizations; set to false for hidden only',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				placeholder: 'Acme Corp',
				description: 'Return organizations whose name contains this text (partial match)',
			},
			{
				displayName: 'Owner',
				name: 'owner_id',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Return organizations owned by this user',
				modes: USER_MODES,
			},
			{
				displayName: 'Updated At (From)',
				name: 'updated_at__gte',
				type: 'dateTime',
				default: '',
				description: 'Return organizations updated on or after this date',
			},
			{
				displayName: 'Updated At (To)',
				name: 'updated_at__lte',
				type: 'dateTime',
				default: '',
				description: 'Return organizations updated on or before this date',
			},
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				default: '',
				placeholder: 'https://example.com',
				description: 'Return organizations whose website URL contains this text',
			},
		],
	},

	//	CREATE
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Acme Corp',
		displayOptions: {
			show: { resource: ['organization'], operation: ['create'] },
		},
		description: 'Name of the organization',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: { resource: ['organization'], operation: ['create'] },
		},
		options: [
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				default: '',
				placeholder: '123 Main Street',
				description: 'Street address of the organization',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				description: 'Free-text notes or summary about the organization',
			},
			{
				displayName: 'External ID',
				name: 'external_id',
				type: 'string',
				default: '',
				placeholder: 'EXT-00142',
				description: 'Identifier for this organization in an external system',
			},
			{
				displayName: 'Owner',
				name: 'owner',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'User responsible for managing this organization record',
				modes: USER_MODES,
			},
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				default: '',
				placeholder: 'https://example.com',
				description: "URL of the organization's website",
			},
		],
	},

	// UPDATE
	{
		displayName: 'Organization ID',
		name: 'organizationId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		modes: ORGANIZATION_MODES,
		displayOptions: {
			show: { resource: ['organization'], operation: ['update'] },
		},
		description: 'Numeric ID of the organization to update',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: { resource: ['organization'], operation: ['update'] },
		},
		options: [
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				default: '',
				placeholder: '123 Main Street',
				description: 'Street address of the organization',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				description: 'Free-text notes or summary about the organization',
			},
			{
				displayName: 'External ID',
				name: 'external_id',
				type: 'string',
				default: '',
				placeholder: 'EXT-00142',
				description: 'Identifier for this organization in an external system',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				placeholder: 'Acme Corp',
				description: 'Name of the organization',
			},
			{
				displayName: 'Owner',
				name: 'owner',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				modes: USER_MODES,
				description: 'User responsible for managing this organization record',
			},
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				default: '',
				placeholder: 'https://example.com',
				description: "URL of the organization's website",
			},
		],
	},
];
