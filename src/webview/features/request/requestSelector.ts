import type { RootState } from '@/store/main-store';
import type {
	FormDataBody,
	KeyValuePair,
	RawBody,
	BinaryBody,
	GraphQLBody} from '@/shared/types/body';
import {
	isFormDataBody,
	isRawBody,
	isUrlEncodedBody,
	isBinaryBody,
	isGraphQLBody,
	isNoneBody
} from '@/shared/types/body';

// ============================================================================
// BASE SELECTORS
// ============================================================================

export const selectRequestEditor = (state: RootState) => state.request;
export const selectBody = (state: RootState) => state.request.body;
export const selectBodyType = (state: RootState) => state.request.body.type;

// ============================================================================
// ✅ VARIANT-SAFE SELECTORS - Using Type Guards
// ============================================================================

/**
 * Get form-data entries (empty array if not form-data body)
 */
export const selectFormDataEntries = (state: RootState): FormDataBody[] => {
	const body = selectBody(state);
	return isFormDataBody(body) ? body.formData : [];
};

/**
 * Get URL-encoded pairs (empty array if not urlencoded body)
 */
export const selectUrlEncodedPairs = (state: RootState): KeyValuePair[] => {
	const body = selectBody(state);
	return isUrlEncodedBody(body) ? body.urlEncoded : [];
};

/**
 * Get raw body config (undefined if not raw body)
 */
export const selectRawBodyConfig = (state: RootState): RawBody | undefined => {
	const body = selectBody(state);
	return isRawBody(body) ? body.raw : undefined;
};

/**
 * Get raw body content (empty string if not raw body)
 */
export const selectRawBodyContent = (state: RootState): string => {
	const body = selectBody(state);
	return isRawBody(body) ? body.raw.content || '' : '';
};

/**
 * Get raw body language (undefined if not raw body)
 */
export const selectRawBodyLanguage = (state: RootState): string | undefined => {
	const body = selectBody(state);
	return isRawBody(body) ? body.raw.language : undefined;
};

/**
 * Get binary body config (undefined if not binary body)
 */
export const selectBinaryBody = (state: RootState): BinaryBody | undefined => {
	const body = selectBody(state);
	return isBinaryBody(body) ? body.binary : undefined;
};

/**
 * Get GraphQL body config (undefined if not graphql body)
 */
export const selectGraphQLBody = (state: RootState): GraphQLBody | undefined => {
	const body = selectBody(state);
	return isGraphQLBody(body) ? body.graphql : undefined;
};

/**
 * Get GraphQL query (empty string if not graphql body)
 */
export const selectGraphQLQuery = (state: RootState): string => {
	const body = selectBody(state);
	return isGraphQLBody(body) ? body.graphql.query || '' : '';
};

/**
 * Get GraphQL variables (empty string if not graphql body)
 */
export const selectGraphQLVariables = (state: RootState): string => {
	const body = selectBody(state);
	return isGraphQLBody(body) ? body.graphql.variables || '' : '';
};

/**
 * Check if body is empty
 */
export const selectIsEmptyBody = (state: RootState): boolean => {
	return isNoneBody(selectBody(state));
};
