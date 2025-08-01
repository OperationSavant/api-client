import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OAuth2Auth } from '@/types/auth';
import { generateOAuth2Token } from '@/utils/auth';

interface OAuth2AuthProps {
	auth: OAuth2Auth;
	onChange: (auth: OAuth2Auth) => void;
}

const OAuth2AuthComponent: React.FC<OAuth2AuthProps> = ({ auth, onChange }) => {
	const [isGeneratingToken, setIsGeneratingToken] = useState(false);
	const [tokenError, setTokenError] = useState<string | null>(null);

	const handleFieldChange = (field: keyof OAuth2Auth) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		onChange({
			...auth,
			[field]: e.target.value,
		});
	};

	const handleGrantTypeChange = (value: 'client_credentials' | 'password') => {
		onChange({
			...auth,
			grantType: value,
		});
	};

	const handleClientAuthChange = (value: 'header' | 'body') => {
		onChange({
			...auth,
			clientAuth: value,
		});
	};

	const handleGetToken = async () => {
		setIsGeneratingToken(true);
		setTokenError(null);

		try {
			const token = await generateOAuth2Token({ type: 'oauth2', oauth2: auth });
			onChange({
				...auth,
				accessToken: token,
			});
		} catch (error) {
			setTokenError(error instanceof Error ? error.message : 'Failed to generate token');
		} finally {
			setIsGeneratingToken(false);
		}
	};

	return (
		<div className='space-y-4'>
			{/* Access Token Display */}
			<div className='space-y-2'>
				<Label htmlFor='oauth2-access-token'>Access Token</Label>
				<Textarea
					id='oauth2-access-token'
					placeholder='Token will appear here after generation'
					value={auth.accessToken || ''}
					readOnly
					className='min-h-[60px] resize-none bg-muted'
				/>
			</div>

			{/* Token Configuration */}
			<div className='border-t pt-4'>
				<h4 className='text-sm font-medium mb-3'>Configure New Token</h4>

				<div className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='oauth2-grant-type'>Grant Type</Label>
						<Select onValueChange={handleGrantTypeChange} defaultValue={auth.grantType}>
							<SelectTrigger>
								<SelectValue placeholder='Select grant type' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='client_credentials'>Client Credentials</SelectItem>
								<SelectItem value='password'>Password Credentials</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='oauth2-token-url'>Access Token URL</Label>
						<Input
							id='oauth2-token-url'
							type='text'
							placeholder='https://example.com/oauth/token'
							value={auth.tokenUrl}
							onChange={handleFieldChange('tokenUrl')}
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='oauth2-client-id'>Client ID</Label>
						<Input id='oauth2-client-id' type='text' placeholder='Enter client ID' value={auth.clientId} onChange={handleFieldChange('clientId')} />
					</div>

					<div className='space-y-2'>
						<Label htmlFor='oauth2-client-secret'>Client Secret</Label>
						<Input
							id='oauth2-client-secret'
							type='password'
							placeholder='Enter client secret'
							value={auth.clientSecret}
							onChange={handleFieldChange('clientSecret')}
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='oauth2-scope'>Scope</Label>
						<Input id='oauth2-scope' type='text' placeholder='Enter scope (optional)' value={auth.scope} onChange={handleFieldChange('scope')} />
					</div>

					{auth.grantType === 'password' && (
						<>
							<div className='space-y-2'>
								<Label htmlFor='oauth2-username'>Username</Label>
								<Input id='oauth2-username' type='text' placeholder='Enter username' value={auth.username || ''} onChange={handleFieldChange('username')} />
							</div>

							<div className='space-y-2'>
								<Label htmlFor='oauth2-password'>Password</Label>
								<Input id='oauth2-password' type='password' placeholder='Enter password' value={auth.password || ''} onChange={handleFieldChange('password')} />
							</div>
						</>
					)}

					<div className='space-y-2'>
						<Label htmlFor='oauth2-client-auth'>Client Authentication</Label>
						<Select onValueChange={handleClientAuthChange} defaultValue={auth.clientAuth}>
							<SelectTrigger>
								<SelectValue placeholder='Select client authentication method' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='header'>Send as Auth Header</SelectItem>
								<SelectItem value='body'>Send client credentials in body</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<Button onClick={handleGetToken} className='w-full' disabled={isGeneratingToken || !auth.tokenUrl || !auth.clientId || !auth.clientSecret}>
						{isGeneratingToken ? 'Generating Token...' : 'Get New Access Token'}
					</Button>

					{tokenError && <div className='text-sm text-red-500 mt-2'>{tokenError}</div>}
				</div>
			</div>
		</div>
	);
};

export default OAuth2AuthComponent;
