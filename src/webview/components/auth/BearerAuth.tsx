import React from 'react';
import type { BearerAuth } from '@/shared/types/auth';
import { ApiClientInput } from '@/components/custom/api-client-input';
import { ApiClientTextarea } from '@/components/custom/api-client-textarea';
import ApiClientFieldRow from '@/components/custom/api-client-field-row';

interface BearerAuthProps {
	auth: BearerAuth;
	onChange: (auth: BearerAuth) => void;
}

const BearerAuthComponent: React.FC<BearerAuthProps> = ({ auth, onChange }) => {
	const handleTokenChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange({
			...auth,
			token: e.target.value,
		});
	};

	const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange({
			...auth,
			prefix: e.target.value,
		});
	};

	return (
		<div className='space-y-4'>
			<ApiClientFieldRow label='Token' htmlFor='bearer-token'>
				<ApiClientTextarea id='bearer-token' placeholder='Enter bearer token' value={auth.token} onChange={handleTokenChange} className='resize-none' />
			</ApiClientFieldRow>
			<ApiClientFieldRow label='Prefix' htmlFor='bearer-prefix'>
				<ApiClientInput id='bearer-prefix' type='text' placeholder='Bearer' value={auth.prefix} onChange={handlePrefixChange} />
			</ApiClientFieldRow>
			<div className='text-sm text-muted-foreground'>Bearer token will be added to the Authorization header with the specified prefix.</div>
		</div>
	);
};

export default BearerAuthComponent;
