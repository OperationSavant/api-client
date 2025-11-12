export type AuthType = 'none' | 'basic' | 'bearer' | 'apikey' | 'oauth2' | 'aws';

export interface BasicAuth {
	username: string;
	password: string;
	showPassword: boolean;
}

export interface BearerAuth {
	token: string;
	prefix: string;
}

export interface ApiKeyAuth {
	key: string;
	value: string;
	addTo: 'header' | 'query';
}

export interface OAuth2Auth {
	grantType: 'client_credentials' | 'password';
	clientId: string;
	clientSecret: string;
	tokenUrl: string;
	scope: string;
	username?: string;
	password?: string;
	clientAuth: 'header' | 'body';
	accessToken?: string;
}

export interface AwsAuth {
	accessKey: string;
	secretKey: string;
	sessionToken: string;
	service: string;
	region: string;
}

export interface AuthConfig {
	type: AuthType;
	basic?: BasicAuth;
	bearer?: BearerAuth;
	apikey?: ApiKeyAuth;
	oauth2?: OAuth2Auth;
	aws?: AwsAuth;
}
