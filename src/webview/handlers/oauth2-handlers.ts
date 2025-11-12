import { AppDispatch, RootState } from '@/store';
import { setAuth } from '@/features/request/requestSlice';

interface OAuth2HandlerDeps {
	dispatch: AppDispatch;
	getState: () => RootState;
}

export function createOAuth2Handlers({ dispatch, getState }: OAuth2HandlerDeps) {
	const handleOAuth2TokenResponse = (message: any) => {
		const { token, error } = message;

		if (error) {
			console.error('OAuth2 token generation failed:', error);
			// TODO: add UI notification here with toast system
			return;
		}

		if (token) {
			const currentState = getState();
			const currentAuth = currentState.request.auth;

			if (currentAuth.type === 'oauth2' && currentAuth.oauth2) {
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
		}
	};

	return {
		handleOAuth2TokenResponse,
	};
}
