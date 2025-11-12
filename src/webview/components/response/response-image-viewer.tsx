import React from 'react';

interface ResponseImageViewerProps {
	dataUri: string;
	altText?: string;
}

const ResponseImageViewer: React.FC<ResponseImageViewerProps> = ({ dataUri, altText }) => {
	return (
		<div className='flex flex-col bg-transparent w-full h-full justify-center items-center overflow-auto'>
			<div className='flex-1 w-full min-h-0 overflow-y-auto [scrollbar-gutter:stable] pr-1'>
				<img src={dataUri} alt={altText || 'Response'} className='max-w-full max-h-none! mx-auto' />
			</div>
		</div>
	);
};

export default ResponseImageViewer;
