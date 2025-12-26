import type { AppDispatch, RootState } from '@/store/main-store';
import { setAuth } from '@/features/request/requestSlice';

interface OAuth2HandlerDeps {
	dispatch: AppDispatch;
}

export function createOAuth2Handlers({ dispatch }: OAuth2HandlerDeps) {
	const handleOAuth2TokenResponse = (message: any, currentAuth: RootState['request']['auth']) => {
		const { token, error } = message;

		if (error) {
			console.error('OAuth2 token generation failed:', error);
			return;
		}

		if (token && currentAuth.type === 'oauth2' && currentAuth.oauth2) {
			dispatch(
				setAuth({
					...currentAuth,
					oauth2: {
						...currentAuth.oauth2,
						accessToken: token,
					},
				})
			);
		}
	};

	return { handleOAuth2TokenResponse };
}
