import { AppDispatch, RootState } from '@/store/main-store';
import { setAuth } from '@/features/request/requestSlice';
import { useSelector } from 'react-redux';

interface OAuth2HandlerDeps {
	dispatch: AppDispatch;
}

export function createOAuth2Handlers({ dispatch }: OAuth2HandlerDeps) {
	const handleOAuth2TokenResponse = (message: any) => {
		const { token, error } = message;

		if (error) {
			console.error('OAuth2 token generation failed:', error);
			// TODO: add UI notification here with toast system
			return;
		}

		if (token) {
			const currentAuth = useSelector((state: RootState) => state.request.auth);

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
