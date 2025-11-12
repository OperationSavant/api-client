import { useRef, useCallback, useEffect } from 'react';

export const useWebviewMessaging = () => {
	const messageHandlers = useRef<Record<string, (data: any) => void>>({});

	const registerHandler = useCallback((command: string, handler: (data: any) => void) => {
		messageHandlers.current[command] = handler;
	}, []);

	const unregisterHandler = useCallback((command: string) => {
		delete messageHandlers.current[command];
	}, []);

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const { command, data, ...rest } = event.data;
			const handler = messageHandlers.current[command];
			if (handler) {
				handler(data || rest);
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, []);

	return {
		registerHandler,
		unregisterHandler,
	};
};
