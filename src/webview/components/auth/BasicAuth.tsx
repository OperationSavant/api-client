import React from 'react';
import { BasicAuth } from '@/shared/types/auth';
import { ApiClientInput } from '@/components/custom/api-client-input';
import ApiClientInputPassword from '@/components/custom/api-client-input-password';
import ApiClientFieldRow from '@/components/custom/api-client-field-row';

interface BasicAuthProps {
	auth: BasicAuth;
	onChange: (auth: BasicAuth) => void;
}

const BasicAuthComponent: React.FC<BasicAuthProps> = ({ auth, onChange }) => {
	const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange({
			...auth,
			username: e.target.value,
		});
	};

	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange({
			...auth,
			password: e.target.value,
		});
	};

	return (
		<div className='space-y-4'>
			<ApiClientFieldRow label='Username' htmlFor='basic-username'>
				<ApiClientInput id='basic-username' type='text' placeholder='Enter username' value={auth.username} onChange={handleUsernameChange} />
			</ApiClientFieldRow>
			<ApiClientFieldRow label='Password' htmlFor='basic-password'>
				<ApiClientInputPassword id='basic-password' placeholder='Enter new password' value={auth.password} onChange={handlePasswordChange} />
			</ApiClientFieldRow>
			<div className='text-sm text-muted-foreground'>Basic authentication will add an Authorization header with Base64 encoded credentials.</div>
		</div>
	);
};

export default BasicAuthComponent;
