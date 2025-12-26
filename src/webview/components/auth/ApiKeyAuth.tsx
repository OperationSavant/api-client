import React from 'react';
import { Label } from '@/components/ui/label';
import type { ApiKeyAuth } from '@/shared/types/auth';
import { ApiClientInput } from '@/components/custom/api-client-input';
import { ApiClientSelect } from '@/components/custom/api-client-select';
import { API_KEY_OPTIONS } from '@/shared/constants/select-options';

interface ApiKeyAuthProps {
	auth: ApiKeyAuth;
	onChange: (auth: ApiKeyAuth) => void;
}

const ApiKeyAuthComponent: React.FC<ApiKeyAuthProps> = ({ auth, onChange }) => {
	const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange({
			...auth,
			key: e.target.value,
		});
	};

	const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange({
			...auth,
			value: e.target.value,
		});
	};

	const handleAddToChange = (value: 'header' | 'query') => {
		onChange({
			...auth,
			addTo: value,
		});
	};

	return (
		<div className='space-y-4'>
			<div className='flex flex-row items-center gap-4'>
				<Label htmlFor='apikey-key' className='min-w-[120px]'>
					Key
				</Label>
				<ApiClientInput id='apikey-key' type='text' placeholder='Enter API key name' value={auth.key} onChange={handleKeyChange} />
			</div>
			<div className='flex flex-row items-center gap-4'>
				<Label htmlFor='apikey-value' className='min-w-[120px]'>
					Value
				</Label>
				<ApiClientInput id='apikey-value' type='text' placeholder='Enter API key value' value={auth.value} onChange={handleValueChange} />
			</div>
			<div className='flex flex-row items-center gap-4'>
				<Label htmlFor='apikey-addto' className='min-w-[120px]'>
					Add to
				</Label>
				<ApiClientSelect
					onValueChange={handleAddToChange}
					placeholder='Select where to add the API key'
					options={API_KEY_OPTIONS}
					classNameTrigger={`w-full bg-muted-foreground/10 border rounded-md`}
					classNameContent={`w-full`}
				/>
			</div>
			<div className='text-sm text-muted-foreground'>API key will be added to {auth.addTo === 'header' ? 'request headers' : 'query parameters'}.</div>
		</div>
	);
};

export default ApiKeyAuthComponent;
