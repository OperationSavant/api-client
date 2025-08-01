import React from 'react';
import AuthSelector from '@/components/auth/AuthSelector';
import { AuthConfig } from '@/types/auth';

interface AuthTabProps {
	auth?: AuthConfig;
	onAuthChange?: (auth: AuthConfig) => void;
}

const AuthTab: React.FC<AuthTabProps> = ({ auth = { type: 'none' }, onAuthChange = () => {} }) => {
	return (
		<div className='flex-1 flex flex-col'>
			<div className='p-4 overflow-y-auto flex-1'>
				<AuthSelector auth={auth} onChange={onAuthChange} />
			</div>
		</div>
	);
};

export default AuthTab;
