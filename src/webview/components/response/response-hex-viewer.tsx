import type { HexViewModel } from '@/shared/types/response';

interface ResponseHexViewerProps {
	model: HexViewModel;
}

export const ResponseHexViewer = ({ model }: ResponseHexViewerProps) => {
	const { rows, bytesPerRow } = model;

	return (
		<div className='font-mono text-xs leading-5 text-foreground overflow-auto select-text'>
			{rows.map(row => (
				<div key={row.offset} className='flex'>
					{/* Offset */}
					<span className='w-18 pr-2 text-line-number'>{row.offset.toString(16).padStart(8, '0')}</span>
					{/* Hex bytes */}
					<span className='flex'>
						{row.hex.map((b, i) => (
							<span key={i} className='w-5.5 text-center'>
								{b}
							</span>
						))}
						{/* pad short rows */}
						{row.hex.length < bytesPerRow &&
							Array.from({
								length: bytesPerRow - row.hex.length,
							}).map((_, i) => <span key={`pad-${i}`} className='w-5.5' />)}
					</span>
					{/* ASCII */}
					<span className='ml-4 text-foreground opacity-80'>{row.ascii}</span>
				</div>
			))}
		</div>
	);
};
