import type { AwsAuth as AwsAuthType } from '@/shared/types/auth';
import { ApiClientInput } from '@/components/custom/api-client-input';
import { ApiClientSelect } from '@/components/custom/api-client-select';
import ApiClientFieldRow from '@/components/custom/api-client-field-row';
import { AWS_REGIONS, AWS_SERVICES } from '@/shared/constants/aws';
import ApiClientInputPassword from '@/components/custom/api-client-input-password';

interface AwsAuthProps {
	auth: AwsAuthType;
	onChange: (auth: AwsAuthType) => void;
}

export function AwsAuth({ auth, onChange }: AwsAuthProps) {
	const handleChange = (field: keyof AwsAuthType, value: string) => {
		onChange({ ...auth, [field]: value });
	};

	return (
		<div className='space-y-4'>
			<ApiClientFieldRow label='Access Key ID' htmlFor='access-key'>
				<ApiClientInput
					id='access-key'
					type='text'
					placeholder='AKIAIOSFODNN7EXAMPLE'
					value={auth.accessKey}
					onChange={e => handleChange('accessKey', e.target.value)}
				/>
			</ApiClientFieldRow>
			<ApiClientFieldRow label='Secret Access Key' htmlFor='secret-key'>
				<ApiClientInputPassword
					id='secret-key'
					placeholder='wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
					value={auth.secretKey}
					onChange={e => handleChange('secretKey', e.target.value)}
				/>
			</ApiClientFieldRow>
			<ApiClientFieldRow label='Session Token' htmlFor='session-token' optional optionalText='(Optional)'>
				<ApiClientInputPassword
					id='session-token'
					placeholder='Session token for temporary credentials'
					value={auth.sessionToken || ''}
					onChange={e => handleChange('sessionToken', e.target.value)}
				/>
			</ApiClientFieldRow>
			<ApiClientFieldRow label='Region' htmlFor='aws-region'>
				<ApiClientSelect
					onValueChange={value => handleChange('region', value)}
					placeholder='Select region'
					options={AWS_REGIONS.map(region => ({ label: region, value: region }))}
					classNameTrigger={`w-full bg-muted-foreground/10 border rounded-md`}
					classNameContent={`w-full`}
				/>
			</ApiClientFieldRow>
			<ApiClientFieldRow label='Service' htmlFor='aws-service'>
				<ApiClientSelect
					onValueChange={value => handleChange('service', value)}
					placeholder='Select service'
					options={AWS_SERVICES.map(service => ({ label: service, value: service }))}
					classNameTrigger={`w-full bg-muted-foreground/10 border rounded-md`}
					classNameContent={`w-full`}
				/>
			</ApiClientFieldRow>
			<div className='text-sm text-muted-foreground'>
				AWS Signature Version 4 will be automatically applied to requests. Ensure your credentials have appropriate permissions for the target service.
			</div>
		</div>
	);
}
