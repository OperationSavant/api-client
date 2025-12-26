import { useState, useCallback } from 'react';

export const useWebviewInitialization = () => {
	const [isReady, setIsReady] = useState(false);
	const [isInitialized, setIsInitialized] = useState(false);

	const markReady = useCallback(() => {
		setIsReady(true);
	}, []);

	const markInitialized = useCallback(() => {
		setIsInitialized(true);
	}, []);

	return {
		isReady,
		isInitialized,
		markReady,
		markInitialized,
	};
};
