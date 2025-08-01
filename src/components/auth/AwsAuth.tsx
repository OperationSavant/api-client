import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AwsAuth as AwsAuthType } from '@/types/auth';

interface AwsAuthProps {
	auth: AwsAuthType;
	onChange: (auth: AwsAuthType) => void;
}

const AWS_REGIONS = [
	'us-east-1',
	'us-east-2',
	'us-west-1',
	'us-west-2',
	'eu-west-1',
	'eu-west-2',
	'eu-west-3',
	'eu-central-1',
	'ap-southeast-1',
	'ap-southeast-2',
	'ap-northeast-1',
	'ap-northeast-2',
	'ap-south-1',
	'sa-east-1',
	'ca-central-1',
];

const AWS_SERVICES = ['s3', 'ec2', 'lambda', 'dynamodb', 'rds', 'sns', 'sqs', 'apigateway', 'execute-api', 'cloudfront', 'route53'];

export function AwsAuth({ auth, onChange }: AwsAuthProps) {
	const handleChange = (field: keyof AwsAuthType, value: string) => {
		onChange({ ...auth, [field]: value });
	};

	return (
		<div className='space-y-4'>
			<div className='grid grid-cols-2 gap-4'>
				<div className='space-y-2'>
					<Label htmlFor='access-key'>Access Key ID</Label>
					<Input
						id='access-key'
						type='text'
						placeholder='AKIAIOSFODNN7EXAMPLE'
						value={auth.accessKey}
						onChange={e => handleChange('accessKey', e.target.value)}
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='secret-key'>Secret Access Key</Label>
					<Input
						id='secret-key'
						type='password'
						placeholder='wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
						value={auth.secretKey}
						onChange={e => handleChange('secretKey', e.target.value)}
					/>
				</div>
			</div>

			<div className='space-y-2'>
				<Label htmlFor='session-token'>Session Token (Optional)</Label>
				<Input
					id='session-token'
					type='password'
					placeholder='Session token for temporary credentials'
					value={auth.sessionToken || ''}
					onChange={e => handleChange('sessionToken', e.target.value)}
				/>
			</div>

			<div className='grid grid-cols-2 gap-4'>
				<div className='space-y-2'>
					<Label htmlFor='aws-region'>Region</Label>
					<Select value={auth.region} onValueChange={value => handleChange('region', value)}>
						<SelectTrigger id='aws-region'>
							<SelectValue placeholder='Select region' />
						</SelectTrigger>
						<SelectContent>
							{AWS_REGIONS.map(region => (
								<SelectItem key={region} value={region}>
									{region}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='aws-service'>Service</Label>
					<Select value={auth.service} onValueChange={value => handleChange('service', value)}>
						<SelectTrigger id='aws-service'>
							<SelectValue placeholder='Select service' />
						</SelectTrigger>
						<SelectContent>
							{AWS_SERVICES.map(service => (
								<SelectItem key={service} value={service}>
									{service}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className='text-sm text-muted-foreground'>
				AWS Signature Version 4 will be automatically applied to requests. Ensure your credentials have appropriate permissions for the target service.
			</div>
		</div>
	);
}
