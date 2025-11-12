import React from 'react';
import AuthSelector from '@/components/auth/AuthSelector';
import { AuthConfig, OAuth2Auth } from '@/shared/types/auth';
import ApiClientHeader from '../custom/api-client-header';

interface AuthTabProps {
	auth?: AuthConfig;
	onAuthChange: (auth: AuthConfig) => void;
	onGenerateOAuth2Token: (oauth2Config: OAuth2Auth) => Promise<void>;
}

const AuthTab: React.FC<AuthTabProps> = ({ auth = { type: 'none' }, onAuthChange, onGenerateOAuth2Token }) => {
	return (
		<div className='h-full gap-2 flex flex-col'>
			<ApiClientHeader headerText='Authorization' />
			<div className='flex-1 min-h-0'>
				<AuthSelector auth={auth} onChange={onAuthChange} onGenerateOAuth2Token={onGenerateOAuth2Token} />
			</div>
		</div>
	);
};

export default AuthTab;
