// AWS Signature Version 4 implementation
// Based on AWS documentation: https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html

export async function hmacSha256(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
	const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

	const encoder = new TextEncoder();
	return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
}

export async function sha256(data: string): Promise<string> {
	const encoder = new TextEncoder();
	const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
	return Array.from(new Uint8Array(hashBuffer))
		.map(b => b.toString(16).padStart(2, '0'))
		.join('');
}

export function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Promise<ArrayBuffer> {
	const encoder = new TextEncoder();
	const initialKey = encoder.encode('AWS4' + key);
	return hmacSha256(initialKey.buffer, dateStamp)
		.then(kDate => hmacSha256(kDate, regionName))
		.then(kRegion => hmacSha256(kRegion, serviceName))
		.then(kService => hmacSha256(kService, 'aws4_request'));
}

export async function createAwsSignature(
	method: string,
	url: string,
	headers: Record<string, string>,
	body: string,
	accessKey: string,
	secretKey: string,
	sessionToken: string,
	region: string,
	service: string
): Promise<Record<string, string>> {
	const urlObj = new URL(url);
	const host = urlObj.hostname;
	const path = urlObj.pathname || '/';
	const queryString = urlObj.search.slice(1); // Remove the '?'

	// Create a date for headers and the credential string
	const t = new Date();
	const amzDate = t
		.toISOString()
		.replace(/[-:.]/g, '')
		.replace(/\d{3}Z$/, 'Z');
	const dateStamp = amzDate.slice(0, 8); // Date without time, used in credential scope

	// Step 1: Create canonical request
	const canonicalUri = path;
	const canonicalQuerystring = queryString;

	// Create canonical headers
	const canonicalHeaders = Object.entries(headers)
		.map(([key, value]) => `${key.toLowerCase()}:${value.trim()}\n`)
		.sort()
		.join('');

	const signedHeaders = Object.keys(headers)
		.map(key => key.toLowerCase())
		.sort()
		.join(';');

	const payloadHash = await sha256(body);

	const canonicalRequest = [method, canonicalUri, canonicalQuerystring, canonicalHeaders, signedHeaders, payloadHash].join('\n');

	// Step 2: Create the string to sign
	const algorithm = 'AWS4-HMAC-SHA256';
	const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
	const stringToSign = [algorithm, amzDate, credentialScope, await sha256(canonicalRequest)].join('\n');

	// Step 3: Calculate the signature
	const signingKey = await getSignatureKey(secretKey, dateStamp, region, service);
	const signature = Array.from(new Uint8Array(await hmacSha256(signingKey, stringToSign)))
		.map(b => b.toString(16).padStart(2, '0'))
		.join('');

	// Step 4: Add signing information to the request
	const authorization = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

	const authHeaders: Record<string, string> = {
		Authorization: authorization,
		'X-Amz-Date': amzDate,
		'X-Amz-Content-Sha256': payloadHash,
	};

	// Add session token if present
	if (sessionToken) {
		authHeaders['X-Amz-Security-Token'] = sessionToken;
	}

	return authHeaders;
}
