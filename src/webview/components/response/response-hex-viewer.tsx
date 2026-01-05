import type { HexViewModel } from '@/shared/types/response';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface ResponseHexViewerProps {
	model: HexViewModel;
}

export const ResponseHexViewer = ({ model }: ResponseHexViewerProps) => {
	const parentRef = useRef(null);
	const { rows, bytesPerRow } = model;
	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 30,
	});

	return (
		<div ref={parentRef} className='font-mono text-xs leading-5 text-foreground overflow-auto select-text w-full h-full'>
			<div className='relative w-full' style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
				{rowVirtualizer.getVirtualItems().map(virtualItem => (
					<div
						key={virtualItem.key}
						className='flex'
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							height: `${virtualItem.size}px`,
							transform: `translateY(${virtualItem.start}px)`,
						}}>
						{/* Offset */}
						<span className='w-18 pr-2 text-primary'>{rows[virtualItem.index].offset.toString(16).padStart(8, '0')}</span>
						{/* Hex bytes */}
						<span className='flex'>
							{rows[virtualItem.index].hex.map((b, i) => (
								<span key={i} className='w-5.5 text-center'>
									{b}
								</span>
							))}
							{/* pad short rows */}
							{rows[virtualItem.index].hex.length < bytesPerRow &&
								Array.from({
									length: bytesPerRow - rows[virtualItem.index].hex.length,
								}).map((_, i) => <span key={`pad-${i}`} className='w-5.5' />)}
						</span>
						{/* ASCII */}
						<span className='ml-4 text-foreground/50'>{rows[virtualItem.index].ascii}</span>
					</div>
				))}
			</div>
		</div>
	);
};
