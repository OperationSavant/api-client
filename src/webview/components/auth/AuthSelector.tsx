import React from 'react';
import { Label } from '@/components/ui/label';
import { AuthConfig, AuthType, OAuth2Auth } from '@/shared/types/auth';
import BasicAuthComponent from '@/components/auth/BasicAuth';
import BearerAuthComponent from '@/components/auth/BearerAuth';
import ApiKeyAuthComponent from '@/components/auth/ApiKeyAuth';
import OAuth2AuthComponent from '@/components/auth/OAuth2Auth';
import { AwsAuth } from '@/components/auth/AwsAuth';
import { ApiClientSelect } from '@/components/custom/api-client-select';
import { Separator } from '@/components/ui/separator';
import { AUTH_SECTION_OPTIONS } from '@/shared/constants/select-options';

interface AuthSelectorProps {
	auth: AuthConfig;
	onChange: (auth: AuthConfig) => void;
	onGenerateOAuth2Token: (oauth2Config: OAuth2Auth) => Promise<void>;
}

const AuthSelector: React.FC<AuthSelectorProps> = ({ auth, onChange, onGenerateOAuth2Token }) => {
	const handleAuthTypeChange = (type: AuthType) => {
		const newAuth: AuthConfig = { type };

		switch (type) {
			case 'basic':
				newAuth.basic = { username: '', password: '', showPassword: false };
				break;
			case 'bearer':
				newAuth.bearer = { token: '', prefix: 'Bearer' };
				break;
			case 'apikey':
				newAuth.apikey = { key: '', value: '', addTo: 'header' };
				break;
			case 'oauth2':
				newAuth.oauth2 = {
					grantType: 'client_credentials',
					clientId: '',
					clientSecret: '',
					tokenUrl: '',
					scope: '',
					clientAuth: 'header',
				};
				break;
			case 'aws':
				newAuth.aws = {
					accessKey: '',
					secretKey: '',
					sessionToken: '',
					service: 's3',
					region: 'us-east-1',
				};
				break;
		}

		onChange(newAuth);
	};

	const handleAuthConfigChange = (authType: AuthType) => (config: any) => {
		onChange({
			...auth,
			[authType]: config,
		});
	};

	const renderAuthComponent = () => {
		switch (auth.type) {
			case 'basic':
				return auth.basic ? <BasicAuthComponent auth={auth.basic} onChange={handleAuthConfigChange('basic')} /> : null;

			case 'bearer':
				return auth.bearer ? <BearerAuthComponent auth={auth.bearer} onChange={handleAuthConfigChange('bearer')} /> : null;

			case 'apikey':
				return auth.apikey ? <ApiKeyAuthComponent auth={auth.apikey} onChange={handleAuthConfigChange('apikey')} /> : null;

			case 'oauth2':
				return auth.oauth2 ? (
					<OAuth2AuthComponent auth={auth.oauth2} onChange={handleAuthConfigChange('oauth2')} onGenerateToken={onGenerateOAuth2Token} />
				) : null;

			case 'aws':
				return auth.aws ? <AwsAuth auth={auth.aws} onChange={handleAuthConfigChange('aws')} /> : null;

			default:
				return <div className='h-full flex text-sm text-muted-foreground justify-center items-center'>This request does not use any authorization.</div>;
		}
	};

	return (
		<div className='flex w-full gap-4 h-full'>
			<div className='flex flex-row gap-4 basis-2/4 h-fit justify-between'>
				<Label htmlFor='auth-type' className='font-medium text-xs'>
					Authorization Type
				</Label>
				<ApiClientSelect
					options={AUTH_SECTION_OPTIONS}
					classNameTrigger={`w-[250px] bg-muted-foreground/10 border rounded-md`}
					classNameContent={`w-[250px]`}
					placeholder='Select authorization type'
					onValueChange={handleAuthTypeChange}
				/>
			</div>
			<Separator orientation='vertical' />
			<div className='flex-1 basis-2/4 flex flex-col min-h-0 overflow-y-auto [scrollbar-gutter:stable] pr-1'>{renderAuthComponent()}</div>
		</div>
	);
};

export default AuthSelector;
