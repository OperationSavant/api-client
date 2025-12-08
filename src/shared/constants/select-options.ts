import { Binary, Braces, CodeXml, FileCode, FileJson, FileType2, LucideIcon, Rows4, ScanText, Scroll } from 'lucide-react';
import { GetIcon, PostIcon, PutIcon, PatchIcon, DeleteIcon, HeadIcon, OptionsIcon } from '../../webview/assets';

export const HTTP_VERBS_OPTIONS: (Record<'value' | 'label', string> & {
	Icon?: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
})[] = [
	{ label: 'GET', value: 'GET', Icon: GetIcon },
	{ label: 'POST', value: 'POST', Icon: PostIcon },
	{ label: 'PUT', value: 'PUT', Icon: PutIcon },
	{ label: 'PATCH', value: 'PATCH', Icon: PatchIcon },
	{ label: 'DELETE', value: 'DELETE', Icon: DeleteIcon },
	{ label: 'HEAD', value: 'HEAD', Icon: HeadIcon },
	{ label: 'OPTIONS', value: 'OPTIONS', Icon: OptionsIcon },
];

export const API_KEY_OPTIONS: (Record<'value' | 'label', string> & {
	Icon?: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
})[] = [
	{ label: 'Header', value: 'header' },
	{ label: 'Query Params', value: 'query' },
];

export const AUTH_SECTION_OPTIONS: (Record<'value' | 'label', string> & {
	Icon?: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
})[] = [
	{ label: 'NONE', value: 'none' },
	{ label: 'BASIC', value: 'basic' },
	{ label: 'BEARER', value: 'bearer' },
	{ label: 'API KEY', value: 'apikey' },
	{ label: 'OAUTH 2.0', value: 'oauth2' },
	{ label: 'AWS SIGNATURE', value: 'aws' },
];

export const OAUTH2_GRANT_TYPE_OPTIONS: (Record<'value' | 'label', string> & {
	Icon?: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
})[] = [
	{ label: 'Client Credentials', value: 'client_credentials' },
	{ label: 'Password Credentials', value: 'password' },
];

export const OAUTH2_CLIENT_AUTH_OPTIONS: (Record<'value' | 'label', string> & {
	Icon?: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
})[] = [
	{ label: 'Send as Basic Auth Header', value: 'header' },
	{ label: 'Send client credentials in body', value: 'body' },
];

export const FORM_DATA_FIELD_TYPE_OPTIONS: (Record<'value' | 'label', string> & {
	Icon?: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
})[] = [
	{ label: 'Text', value: 'text' },
	{ label: 'File', value: 'file' },
];

export const BODY_TYPE_OPTIONS: (Record<'value' | 'label', string> & {
	Icon?: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
})[] = [
	{ value: 'json', label: 'JSON' },
	{ value: 'xml', label: 'XML' },
	{ value: 'html', label: 'HTML' },
	{ value: 'javascript', label: 'JavaScript' },
	{ value: 'css', label: 'CSS' },
	{ value: 'text', label: 'Text' },
];

export const RESPONSE_CONTENT_TYPE_OPTIONS: (Record<'value' | 'label', string> & {
	Icon?: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
} & { responseType?: string })[] = [
	{ label: 'JSON', value: 'json', Icon: FileJson, responseType: 'string' },
	{ label: 'XML', value: 'xml', Icon: CodeXml, responseType: 'string' },
	{ label: 'HTML', value: 'html', Icon: FileCode, responseType: 'string' },
	{ label: 'Text', value: 'plain', Icon: FileType2, responseType: 'string' },
	{ label: 'JavaScript', value: 'javascript', Icon: Scroll, responseType: 'string' },
	{ label: 'CSS', value: 'css', Icon: Braces, responseType: 'string' },
	{ label: 'HEX', value: 'hex', Icon: Binary, responseType: 'binary' },
	{ label: 'Raw', value: 'raw', Icon: Rows4, responseType: 'binary' },
	{ label: 'Base64', value: 'base64', Icon: ScanText, responseType: 'binary' },
];
