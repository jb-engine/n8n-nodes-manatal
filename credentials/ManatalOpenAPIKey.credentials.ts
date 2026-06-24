/**
 * ManatalOpenAPIKey.credentials.ts
 *
 * Defines the "Manatal Open API Key" credential type used by both the
 * Manatal action node and the Manatal Trigger node.
 *
 * The credential stores a single API token and injects it as an
 * Authorization header on every request:  Authorization: Token <apiToken>
 *
 * The credential test calls GET /users/ — a lightweight, read-only endpoint
 * that confirms the token is valid and the account is reachable.
 *
 * To obtain a token: Manatal → Administration → Features → Open API.
 */

import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ManatalOpenAPIKey implements ICredentialType {
	name = 'manatalOpenAPIKey';

	displayName = 'Manatal Open API Key';

	icon = 'file:../nodes/Manatal/assets/manatal.svg' as const;

	documentationUrl = 'https://support.manatal.com/docs/manatal-api';

	properties: INodeProperties[] = [
		{
			displayName: 'Manatal Open API Key',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			placeholder: 'Enter your Manatal Open API Key',
			hint: 'In Manatal, go to Administration > Features > Open API.',
		},
	];

	// Injects the token as a Bearer-style "Token" header on every HTTP request
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Token {{$credentials.apiToken}}',
			},
		},
	};

	// Validates the credential by hitting a cheap read-only endpoint
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.manatal.com/open/v3',
			url: '/users/',
			method: 'GET',
		},
	};
}
