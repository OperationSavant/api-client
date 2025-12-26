import type { WebviewPanel} from 'vscode';
import { window, Uri, env } from 'vscode';
import axios from 'axios';
import * as crypto from 'crypto';

export class OAuth2Handler {
	/**
	 * Main entry point - Called by MessageRouter
	 * Routes to appropriate OAuth2 flow based on command
	 */
	async handle(message: any, panel: WebviewPanel): Promise<void> {
		const { command, oauth2Config } = message;

		try {
			switch (command) {
				case 'startOAuth2Authorization':
					// Browser-based flows: authorization_code, PKCE, implicit
					return await this.handleAuthorizationFlow(oauth2Config, panel);

				case 'exchangeOAuth2Code':
					// Exchange authorization code for token (after browser callback)
					return await this.handleCodeExchange(oauth2Config, panel);

				case 'generateOAuth2Token':
					// Direct token flows: password, client_credentials, refresh, device
					return await this.handleDirectTokenFlow(oauth2Config, panel);

				case 'requestDeviceCode':
					// Device code flow - step 1: get device code
					return await this.handleDeviceCodeRequest(oauth2Config, panel);

				default:
					throw new Error(`Unknown OAuth2 command: ${command}`);
			}
		} catch (error) {
			this.sendErrorResponse(panel, error instanceof Error ? error.message : 'OAuth2 flow failed');
		}
	}

	// ========================================
	// AUTHORIZATION FLOWS (Browser-based)
	// ========================================

	/**
	 * Handle browser-based authorization flows
	 * These require opening a browser to the authorization endpoint
	 */
	private async handleAuthorizationFlow(config: any, panel: WebviewPanel): Promise<void> {
		const { grantType } = config;

		switch (grantType) {
			case 'authorization_code':
				return this.startAuthorizationCode(config, panel);

			case 'authorization_code_pkce':
				return this.startAuthorizationCodePKCE(config, panel);

			case 'implicit':
				return this.startImplicitFlow(config, panel);

			default:
				throw new Error(`Unsupported authorization grant type: ${grantType}`);
		}
	}

	/**
	 * Authorization Code Flow (Standard)
	 * Config: authUrl, callbackUrl, clientId, clientSecret, scope, state
	 */
	private startAuthorizationCode(config: any, panel: WebviewPanel): void {
		// Build authorization URL
		const authUrl = this.buildAuthorizationUrl({
			authUrl: config.authUrl,
			clientId: config.clientId,
			redirectUri: config.callbackUrl,
			scope: config.scope,
			state: config.state, // CSRF protection
			responseType: 'code',
		});

		// Send URL to webview to open in browser
		panel.webview.postMessage({
			command: 'openAuthorizationUrl',
			url: authUrl,
			state: config.state, // Store for validation later
		});

		// Show message to user
		window.showInformationMessage('Opening browser for authorization. Please complete the login process.');
	}

	/**
	 * Authorization Code with PKCE Flow
	 * Config: authUrl, callbackUrl, clientId, clientSecret, scope, state, codeChallengeMethod
	 */
	private startAuthorizationCodePKCE(config: any, panel: WebviewPanel): void {
		// Generate PKCE values
		const codeVerifier = this.generateCodeVerifier();
		const codeChallengeMethod = config.codeChallengeMethod || 'S256';
		const codeChallenge = this.generateCodeChallenge(codeVerifier, codeChallengeMethod);

		// Build authorization URL with PKCE parameters
		const authUrl = this.buildAuthorizationUrl({
			authUrl: config.authUrl,
			clientId: config.clientId,
			redirectUri: config.callbackUrl,
			scope: config.scope,
			state: config.state,
			responseType: 'code',
			codeChallenge: codeChallenge,
			codeChallengeMethod: codeChallengeMethod,
		});

		// Send URL and code_verifier to webview
		// Webview must store code_verifier for token exchange
		panel.webview.postMessage({
			command: 'openAuthorizationUrl',
			url: authUrl,
			state: config.state,
			codeVerifier: codeVerifier, // Store this for later
		});

		window.showInformationMessage('Opening browser for authorization (PKCE). Please complete the login process.');
	}

	/**
	 * Implicit Flow (Legacy - Not Recommended)
	 * Config: authUrl, callbackUrl, clientId, scope, state
	 * Note: Token returned in URL fragment, no backend exchange needed
	 */
	private startImplicitFlow(config: any, panel: WebviewPanel): void {
		// Build authorization URL with response_type=token
		const authUrl = this.buildAuthorizationUrl({
			authUrl: config.authUrl,
			clientId: config.clientId,
			redirectUri: config.callbackUrl,
			scope: config.scope,
			state: config.state,
			responseType: 'token', // Returns token directly in URL fragment
		});

		// Send URL to webview
		panel.webview.postMessage({
			command: 'openAuthorizationUrl',
			url: authUrl,
			state: config.state,
			isImplicit: true, // Webview handles token from URL fragment
		});

		window.showInformationMessage('Opening browser for authorization (Implicit flow).');
	}

	// ========================================
	// CODE EXCHANGE (After browser callback)
	// ========================================

	/**
	 * Exchange authorization code for access token
	 * Called after user completes browser authorization
	 * Config: accessTokenUrl, code, callbackUrl, clientId, clientSecret, clientAuth, state, codeVerifier (PKCE)
	 */
	private async handleCodeExchange(config: any, panel: WebviewPanel): Promise<void> {
		// Validate state parameter (CSRF protection)
		if (config.receivedState && config.expectedState) {
			if (!this.validateState(config.receivedState, config.expectedState)) {
				throw new Error('State validation failed - possible CSRF attack');
			}
		}

		// Build token request body
		const body = new URLSearchParams();
		body.append('grant_type', 'authorization_code');
		body.append('code', config.code); // Authorization code from callback
		body.append('redirect_uri', config.callbackUrl);

		// PKCE: Add code_verifier if provided
		if (config.codeVerifier) {
			body.append('code_verifier', config.codeVerifier);
		}

		// Client authentication
		const headers = this.buildClientAuthHeaders(config);
		if (config.clientAuth === 'body') {
			body.append('client_id', config.clientId);
			body.append('client_secret', config.clientSecret);
		}

		// POST to token endpoint
		const response = await this.makeTokenRequest(config.accessTokenUrl, body, headers);

		// Send token response to webview
		this.sendTokenResponse(panel, response);
	}

	// ========================================
	// DIRECT TOKEN FLOWS (No browser)
	// ========================================

	/**
	 * Handle direct token request flows
	 * These POST directly to token endpoint without browser interaction
	 */
	private async handleDirectTokenFlow(config: any, panel: WebviewPanel): Promise<void> {
		const { grantType } = config;

		switch (grantType) {
			case 'password':
				return this.handlePasswordFlow(config, panel);

			case 'client_credentials':
				return this.handleClientCredentialsFlow(config, panel);

			case 'refresh_token':
				return this.handleRefreshTokenFlow(config, panel);

			case 'urn:ietf:params:oauth:grant-type:device_code':
				return this.handleDeviceCodeTokenFlow(config, panel);

			default:
				// Support custom grant types
				return this.handleCustomGrantType(config, panel);
		}
	}

	/**
	 * Password Credentials Grant (Legacy)
	 * Config: accessTokenUrl, clientId, clientSecret, clientAuth, username, password, scope
	 */
	private async handlePasswordFlow(config: any, panel: WebviewPanel): Promise<void> {
		const body = new URLSearchParams();
		body.append('grant_type', 'password');
		body.append('username', config.username);
		body.append('password', config.password);

		if (config.scope) {
			body.append('scope', config.scope);
		}

		// Client authentication
		const headers = this.buildClientAuthHeaders(config);
		if (config.clientAuth === 'body') {
			body.append('client_id', config.clientId);
			body.append('client_secret', config.clientSecret);
		}

		// POST to token endpoint
		const response = await this.makeTokenRequest(config.accessTokenUrl, body, headers);

		this.sendTokenResponse(panel, response);
	}

	/**
	 * Client Credentials Grant
	 * Config: accessTokenUrl, clientId, clientSecret, clientAuth, scope
	 */
	private async handleClientCredentialsFlow(config: any, panel: WebviewPanel): Promise<void> {
		const body = new URLSearchParams();
		body.append('grant_type', 'client_credentials');

		if (config.scope) {
			body.append('scope', config.scope);
		}

		// Client authentication (required for this grant type)
		const headers = this.buildClientAuthHeaders(config);
		if (config.clientAuth === 'body') {
			body.append('client_id', config.clientId);
			body.append('client_secret', config.clientSecret);
		}

		// POST to token endpoint
		const response = await this.makeTokenRequest(config.accessTokenUrl, body, headers);

		this.sendTokenResponse(panel, response);
	}

	/**
	 * Refresh Token Grant
	 * Config: accessTokenUrl, clientId, clientSecret, clientAuth, refreshToken, scope
	 */
	private async handleRefreshTokenFlow(config: any, panel: WebviewPanel): Promise<void> {
		const body = new URLSearchParams();
		body.append('grant_type', 'refresh_token');
		body.append('refresh_token', config.refreshToken);

		// Optional: request reduced scope
		if (config.scope) {
			body.append('scope', config.scope);
		}

		// Client authentication
		const headers = this.buildClientAuthHeaders(config);
		if (config.clientAuth === 'body') {
			body.append('client_id', config.clientId);
			body.append('client_secret', config.clientSecret);
		}

		// POST to token endpoint
		const response = await this.makeTokenRequest(config.accessTokenUrl, body, headers);

		this.sendTokenResponse(panel, response);
	}

	/**
	 * Device Code Grant - Token Exchange (Step 2)
	 * Config: accessTokenUrl, clientId, deviceCode
	 */
	private async handleDeviceCodeTokenFlow(config: any, panel: WebviewPanel): Promise<void> {
		const body = new URLSearchParams();
		body.append('grant_type', 'urn:ietf:params:oauth:grant-type:device_code');
		body.append('device_code', config.deviceCode);
		body.append('client_id', config.clientId);

		// Note: Client secret typically not required for device flow
		const headers: Record<string, string> = {
			'Content-Type': 'application/x-www-form-urlencoded',
		};

		// POST to token endpoint
		const response = await this.makeTokenRequest(config.accessTokenUrl, body, headers);

		// Handle pending/slow_down responses
		if (response.status === 400 && response.data.error === 'authorization_pending') {
			panel.webview.postMessage({
				command: 'oauth2TokenResponse',
				pending: true,
				message: 'Authorization pending. User has not completed authorization yet.',
			});
			return;
		}

		if (response.status === 400 && response.data.error === 'slow_down') {
			panel.webview.postMessage({
				command: 'oauth2TokenResponse',
				slowDown: true,
				message: 'Polling too fast. Reduce polling frequency.',
			});
			return;
		}

		this.sendTokenResponse(panel, response);
	}

	/**
	 * Custom Grant Type Handler
	 * Allows support for non-standard grant types
	 * Config: accessTokenUrl, grantType, clientId, clientSecret, clientAuth, additionalParams
	 */
	private async handleCustomGrantType(config: any, panel: WebviewPanel): Promise<void> {
		const body = new URLSearchParams();
		body.append('grant_type', config.grantType);

		// Add all additional parameters
		if (config.additionalParams) {
			Object.entries(config.additionalParams).forEach(([key, value]) => {
				body.append(key, value as string);
			});
		}

		// Client authentication
		const headers = this.buildClientAuthHeaders(config);
		if (config.clientAuth === 'body') {
			body.append('client_id', config.clientId);
			body.append('client_secret', config.clientSecret);
		}

		// POST to token endpoint
		const response = await this.makeTokenRequest(config.accessTokenUrl, body, headers);

		this.sendTokenResponse(panel, response);
	}

	// ========================================
	// DEVICE CODE FLOW (Two-step process)
	// ========================================

	/**
	 * Device Code Grant - Request Device Code (Step 1)
	 * Config: deviceAuthorizationUrl, clientId, scope
	 */
	private async handleDeviceCodeRequest(config: any, panel: WebviewPanel): Promise<void> {
		try {
			const body = new URLSearchParams();
			body.append('client_id', config.clientId);

			if (config.scope) {
				body.append('scope', config.scope);
			}

			// POST to device authorization endpoint
			const response = await axios.post(config.deviceAuthorizationUrl, body.toString(), {
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				validateStatus: () => true,
			});

			if (response.status >= 200 && response.status < 300) {
				const data = response.data;

				// Send device code data back to webview
				panel.webview.postMessage({
					command: 'oauth2DeviceCodeResponse',
					success: true,
					deviceCode: data.device_code,
					userCode: data.user_code,
					verificationUri: data.verification_uri,
					verificationUriComplete: data.verification_uri_complete,
					expiresIn: data.expires_in,
					interval: data.interval || 5, // Default polling interval in seconds
				});

				// Show user code to user with option to open browser
				const selection = await window.showInformationMessage(
					`Device Code: ${data.user_code}\nGo to ${data.verification_uri} to authorize.`,
					'Open Browser',
					'Copy URL'
				);

				if (selection === 'Open Browser') {
					// Open verification URI in browser
					env.openExternal(Uri.parse(data.verification_uri));
				} else if (selection === 'Copy URL') {
					// Copy URL to clipboard
					env.clipboard.writeText(data.verification_uri);
					window.showInformationMessage('URL copied to clipboard');
				}
			} else {
				this.sendErrorResponse(panel, response.data.error || 'Failed to get device code', response.data.error_description);
			}
		} catch (error) {
			this.sendErrorResponse(panel, error instanceof Error ? error.message : 'Device code request failed');
		}
	}

	// ========================================
	// HELPER METHODS
	// ========================================

	/**
	 * Build authorization URL for browser redirect
	 */
	private buildAuthorizationUrl(params: {
		authUrl: string;
		clientId: string;
		redirectUri: string;
		scope: string;
		state: string;
		responseType: 'code' | 'token';
		codeChallenge?: string;
		codeChallengeMethod?: string;
	}): string {
		const url = new URL(params.authUrl);

		// Required parameters
		url.searchParams.append('response_type', params.responseType);
		url.searchParams.append('client_id', params.clientId);
		url.searchParams.append('redirect_uri', params.redirectUri);
		url.searchParams.append('scope', params.scope);
		url.searchParams.append('state', params.state);

		// PKCE parameters (if provided)
		if (params.codeChallenge) {
			url.searchParams.append('code_challenge', params.codeChallenge);
			url.searchParams.append('code_challenge_method', params.codeChallengeMethod!);
		}

		return url.toString();
	}

	/**
	 * Generate PKCE code_verifier
	 * Returns base64url-encoded random string (43-128 characters)
	 */
	private generateCodeVerifier(): string {
		// Generate 32 random bytes -> 43 chars when base64url encoded
		return crypto.randomBytes(32).toString('base64url');
	}

	/**
	 * Generate PKCE code_challenge from code_verifier
	 */
	private generateCodeChallenge(verifier: string, method: 'S256' | 'plain'): string {
		if (method === 'plain') {
			return verifier;
		}

		// S256: SHA256 hash of verifier, base64url encoded
		const hash = crypto.createHash('sha256').update(verifier).digest('base64url');
		return hash;
	}

	/**
	 * Validate state parameter (CSRF protection)
	 * Uses constant-time comparison to prevent timing attacks
	 */
	private validateState(received: string, expected: string): boolean {
		try {
			return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
		} catch {
			// Buffer lengths differ
			return false;
		}
	}

	/**
	 * Build client authentication headers
	 */
	private buildClientAuthHeaders(config: any): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/x-www-form-urlencoded',
		};

		if (config.clientAuth === 'header') {
			// Basic Authentication in header
			const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
			headers['Authorization'] = `Basic ${credentials}`;
		}

		return headers;
	}

	/**
	 * Make token request to OAuth2 server
	 */
	private async makeTokenRequest(url: string, body: URLSearchParams, headers: Record<string, string>): Promise<any> {
		return await axios.post(url, body.toString(), {
			headers,
			validateStatus: () => true, // Accept all status codes to handle errors
		});
	}

	/**
	 * Send successful token response to webview
	 */
	private sendTokenResponse(panel: WebviewPanel, response: any): void {
		if (response.status >= 200 && response.status < 300) {
			const data = response.data;

			if (!data.access_token) {
				this.sendErrorResponse(panel, 'No access token in response', 'Token endpoint returned success but no access_token field');
				return;
			}

			// Send successful token response
			panel.webview.postMessage({
				command: 'oauth2TokenResponse',
				success: true,
				token: data.access_token,
				tokenType: data.token_type || 'Bearer',
				expiresIn: data.expires_in,
				refreshToken: data.refresh_token,
				scope: data.scope,
				idToken: data.id_token, // OpenID Connect
				// Include raw data for custom fields
				rawData: data,
			});

			window.showInformationMessage('OAuth2 token generated successfully');
		} else {
			// Error response from token endpoint
			const errorData = response.data || {};
			this.sendErrorResponse(panel, errorData.error || `HTTP ${response.status}`, errorData.error_description || response.statusText);
		}
	}

	/**
	 * Send error response to webview
	 */
	private sendErrorResponse(panel: WebviewPanel, error: string, description?: string): void {
		panel.webview.postMessage({
			command: 'oauth2TokenResponse',
			success: false,
			error: error,
			errorDescription: description,
		});

		const errorMsg = description ? `${error}: ${description}` : error;
		window.showErrorMessage(`OAuth2 error: ${errorMsg}`);
	}
}
