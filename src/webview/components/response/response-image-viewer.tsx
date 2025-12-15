import React from 'react';
import { ScrollArea } from '../ui/scroll-area';

interface ResponseImageViewerProps {
	dataUri: string;
	altText?: string;
}

const ResponseImageViewer: React.FC<ResponseImageViewerProps> = ({ dataUri, altText }) => {
	return (
		<ScrollArea className='w-full h-full'>
			<div className='w-full h-full flex items-center justify-center'>
				<img src={dataUri} alt={altText || 'Response'} className='max-w-full min-h-0! mx-auto' />
			</div>
		</ScrollArea>
	);
};

export default ResponseImageViewer;
