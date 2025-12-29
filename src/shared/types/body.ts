export interface UrlEncodedBody {
	key: string;
	value: string;
	checked: boolean;
}

export interface FormDataBody extends UrlEncodedBody {
	type: 'text' | 'file';
	file?: File;
	fileName?: string;
}

export interface RawBody {
	content?: string;
	language?: 'json' | 'xml' | 'html' | 'text' | 'javascript' | 'css';
	autoFormat?: boolean;
}

export interface BinaryBody {
	filePath?: string;
	fileName?: string;
	contentType?: string;
	size?: number;
}

export interface GraphQLBody {
	query?: string;
	variables?: string;
	operationName?: string;
}

export type RequestBody =
	| { type: 'none' }
	| { type: 'form-data'; formData: FormDataBody[] }
	| { type: 'x-www-form-urlencoded'; urlEncoded: UrlEncodedBody[] }
	| { type: 'raw'; raw: RawBody }
	| { type: 'binary'; binary: BinaryBody }
	| { type: 'graphql'; graphql: GraphQLBody };

export const createDefaultRequestBody = (): RequestBody => ({
	type: 'none',
});

export const isFormDataBody = (body: RequestBody): body is { type: 'form-data'; formData: FormDataBody[] } => {
	return body.type === 'form-data';
};

export const isRawBody = (body: RequestBody): body is { type: 'raw'; raw: RawBody } => {
	return body.type === 'raw';
};

export const isUrlEncodedBody = (body: RequestBody): body is { type: 'x-www-form-urlencoded'; urlEncoded: UrlEncodedBody[] } => {
	return body.type === 'x-www-form-urlencoded';
};

export const isBinaryBody = (body: RequestBody): body is { type: 'binary'; binary: BinaryBody } => {
	return body.type === 'binary';
};

export const isGraphQLBody = (body: RequestBody): body is { type: 'graphql'; graphql: GraphQLBody } => {
	return body.type === 'graphql';
};

export const isNoneBody = (body: RequestBody): body is { type: 'none' } => {
	return body.type === 'none';
};
