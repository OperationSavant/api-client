import { useCallback, useRef, useState } from 'react';

export function useContainerBreakpoint() {
	const observerRef = useRef<ResizeObserver | null>(null);
	const [width, setWidth] = useState(0);

	const ref = useCallback((node: HTMLElement | null) => {
		// cleanup old observer
		observerRef.current?.disconnect();

		if (!node || !('ResizeObserver' in window)) return;

		// initial measurement
		setWidth(node.getBoundingClientRect().width);

		const observer = new ResizeObserver(entries => {
			const entry = entries[0];
			if (entry) {
				setWidth(entry.contentRect.width);
			}
		});

		observer.observe(node);
		observerRef.current = observer;
	}, []);

	return {
		ref,
		isCompact: width < 300,
		isNormal: width >= 300 && width < 768,
		isWide: width >= 768,
	};
}
