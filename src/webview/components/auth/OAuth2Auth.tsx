import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { OAuth2Auth } from '@/shared/types/auth';
import { ApiClientTextarea } from '@/components/custom/api-client-textarea';
import { ApiClientInput } from '@/components/custom/api-client-input';
import { ApiClientSelect } from '@/components/custom/api-client-select';
import ApiClientFieldRow from '@/components/custom/api-client-field-row';
import { Separator } from '@/components/ui/separator';
import ApiClientHeader from '@/components/custom/api-client-header';
import ApiClientInputPassword from '@/components/custom/api-client-input-password';
import { OAUTH2_GRANT_TYPE_OPTIONS, OAUTH2_CLIENT_AUTH_OPTIONS } from '@/shared/constants/select-options';

interface OAuth2AuthProps {
	auth: OAuth2Auth;
	onChange: (auth: OAuth2Auth) => void;
	onGenerateToken: (oauth2Config: OAuth2Auth) => Promise<void>;
}

const OAuth2AuthComponent: React.FC<OAuth2AuthProps> = ({ auth, onChange, onGenerateToken }) => {
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
			const token = await onGenerateToken(auth);
		} catch (error) {
			setTokenError(error instanceof Error ? error.message : 'Failed to generate token');
		} finally {
			setIsGeneratingToken(false);
		}
	};

	return (
		<div className='space-y-4'>
			<ApiClientFieldRow label='Access Token' htmlFor='oauth2-access-token'>
				<ApiClientTextarea
					id='oauth2-access-token'
					placeholder='Token will appear here after generation'
					value={auth.accessToken || ''}
					readOnly
					className='min-h-[60px] resize-none bg-muted'
				/>
			</ApiClientFieldRow>
			<Separator orientation='horizontal' />
			<ApiClientHeader headerText='Configure New Token' needSeparator={false} className='text-sm font-medium' />
			<ApiClientFieldRow label='Grant Type' htmlFor='oauth2-grant-type'>
				<ApiClientSelect
					onValueChange={handleGrantTypeChange}
					placeholder='Select grant type'
					options={OAUTH2_GRANT_TYPE_OPTIONS}
					classNameTrigger={`w-full bg-muted-foreground/10 border rounded-md`}
					classNameContent={`w-full`}
				/>
			</ApiClientFieldRow>
			<ApiClientFieldRow label='Access Token URL' htmlFor='oauth2-token-url'>
				<ApiClientInput
					id='oauth2-token-url'
					type='text'
					placeholder='https://example.com/oauth/token'
					value={auth.tokenUrl}
					onChange={handleFieldChange('tokenUrl')}
				/>
			</ApiClientFieldRow>
			<ApiClientFieldRow label='Client ID' htmlFor='oauth2-client-id'>
				<ApiClientInput id='oauth2-client-id' type='text' placeholder='Enter client ID' value={auth.clientId} onChange={handleFieldChange('clientId')} />
			</ApiClientFieldRow>
			<ApiClientFieldRow label='Client Secret' htmlFor='oauth2-client-secret'>
				<ApiClientInputPassword
					id='oauth2-client-secret'
					placeholder='Enter client secret'
					value={auth.clientSecret}
					onChange={handleFieldChange('clientSecret')}
				/>
			</ApiClientFieldRow>
			<ApiClientFieldRow label='Token Scope' htmlFor='oauth2-scope'>
				<ApiClientInput id='oauth2-scope' type='text' placeholder='Enter scope (optional)' value={auth.scope} onChange={handleFieldChange('scope')} />
			</ApiClientFieldRow>
			{auth.grantType === 'password' && (
				<>
					<ApiClientFieldRow label='Username' htmlFor='oauth2-username'>
						<ApiClientInput
							id='oauth2-username'
							type='text'
							placeholder='Enter username'
							value={auth.username || ''}
							onChange={handleFieldChange('username')}
						/>
					</ApiClientFieldRow>
					<ApiClientFieldRow label='Password' htmlFor='oauth2-password'>
						<ApiClientInputPassword id='oauth2-password' placeholder='Enter password' value={auth.password || ''} onChange={handleFieldChange('password')} />
					</ApiClientFieldRow>
				</>
			)}
			<ApiClientFieldRow label='Client Authentication' htmlFor='oauth2-client-auth'>
				<ApiClientSelect
					onValueChange={handleClientAuthChange}
					placeholder='Select client authentication method'
					options={OAUTH2_CLIENT_AUTH_OPTIONS}
					classNameTrigger={`w-full bg-muted-foreground/10 border rounded-md`}
					classNameContent={`w-full`}
				/>
			</ApiClientFieldRow>
			<Button onClick={handleGetToken} className='w-full' disabled={isGeneratingToken || !auth.tokenUrl || !auth.clientId || !auth.clientSecret}>
				{isGeneratingToken ? 'Generating Token...' : 'Get New Access Token'}
			</Button>
			{tokenError && <div className='text-sm text-destructive mt-2'>{tokenError}</div>}
		</div>
	);
};

export default OAuth2AuthComponent;
