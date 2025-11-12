import { Braces, CodeXml, FileCode, FileJson, FileType2, LucideIcon, Scroll } from 'lucide-react';

export const HTTP_VERBS_OPTIONS: { label: string; value: string }[] = [
	{ label: 'GET', value: 'GET' },
	{ label: 'POST', value: 'POST' },
	{ label: 'PUT', value: 'PUT' },
	{ label: 'PATCH', value: 'PATCH' },
	{ label: 'DELETE', value: 'DELETE' },
	{ label: 'HEAD', value: 'HEAD' },
	{ label: 'OPTIONS', value: 'OPTIONS' },
];

export const API_KEY_OPTIONS: { label: string; value: string }[] = [
	{ label: 'Header', value: 'header' },
	{ label: 'Query Params', value: 'query' },
];

export const AUTH_SECTION_OPTIONS: { label: string; value: string }[] = [
	{ label: 'NONE', value: 'none' },
	{ label: 'BASIC', value: 'basic' },
	{ label: 'BEARER', value: 'bearer' },
	{ label: 'API KEY', value: 'apikey' },
	{ label: 'OAUTH 2.0', value: 'oauth2' },
	{ label: 'AWS SIGNATURE', value: 'aws' },
];

export const OAUTH2_GRANT_TYPE_OPTIONS: { label: string; value: string }[] = [
	{ label: 'Client Credentials', value: 'client_credentials' },
	{ label: 'Password Credentials', value: 'password' },
];

export const OAUTH2_CLIENT_AUTH_OPTIONS: { label: string; value: string }[] = [
	{ label: 'Send as Basic Auth Header', value: 'header' },
	{ label: 'Send client credentials in body', value: 'body' },
];

export const FORM_DATA_FIELD_TYPE_OPTIONS: { label: string; value: string }[] = [
	{ label: 'Text', value: 'text' },
	{ label: 'File', value: 'file' },
];

export const BODY_TYPE_OPTIONS: { label: string; value: string }[] = [
	{ value: 'json', label: 'JSON' },
	{ value: 'xml', label: 'XML' },
	{ value: 'html', label: 'HTML' },
	{ value: 'javascript', label: 'JavaScript' },
	{ value: 'css', label: 'CSS' },
	{ value: 'text', label: 'Text' },
];

export const RESPONSE_CONTENT_TYPE_OPTIONS: { label: string; value: string; Icon: LucideIcon }[] = [
	{ label: 'JSON', value: 'application/json', Icon: FileJson },
	{ label: 'XML', value: 'application/xml', Icon: CodeXml },
	{ label: 'HTML', value: 'text/html', Icon: FileCode },
	{ label: 'Text', value: 'text/plain', Icon: FileType2 },
	{ label: 'JavaScript', value: 'application/javascript', Icon: Scroll },
	{ label: 'CSS', value: 'text/css', Icon: Braces },
];
