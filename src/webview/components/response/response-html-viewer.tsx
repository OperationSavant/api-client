/*
Please note that this is not for browser emulation of HTML responses. It is for securely rendering HTML content
inside an iframe within a VSCode webview, ensuring proper isolation and security.
EXPECTED CONSOLE ERRORS:
- "Blocked script execution in 'about:srcdoc'..." → Sandbox working
- CSP violations for external resources → Defense-in-depth working
These errors confirm that untrusted API response content is properly isolated.
Anything else would be a concern and needs investigation.
*/
import type { RootState } from '@/store/main-store';
import { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';

type HtmlPreviewProps = {
	html: string;
};

export const ResponseHtmlViewer = ({ html }: HtmlPreviewProps) => {
	const previewUrl = useSelector((state: RootState) => state.ui.previewUrl);

	const iframeRef = useRef<HTMLIFrameElement>(null);
	useEffect(() => {
		if (!previewUrl || !iframeRef.current) return;
		const handleIframeMessage = (event: MessageEvent) => {
			if (event.origin === 'null' && event?.data?.type === 'READY') {
				iframeRef.current?.contentWindow?.postMessage(
					{
						type: 'DATA',
						payload: {
							html,
						},
					},
					'*'
				);
			}
		};
		window.addEventListener('message', handleIframeMessage);
		return () => window.removeEventListener('message', handleIframeMessage);
	}, [html, previewUrl]);

	return (
		<iframe
			ref={iframeRef}
			title='HTML Preview'
			src={previewUrl}
			sandbox='allow-scripts'
			style={{
				width: '100%',
				height: '100%',
				border: 'none',
				background: 'transparent',
			}}
		/>
	);
};
