import { LucideIcon } from 'lucide-react';
import React from 'react';
import ResponseImageViewer from './response-image-viewer';
import ResponsePDFViewer from './response-pdf-viewer';

interface ResponsePreviewTabProps {
	responseBody: string;
	contentType: string;
	language: string;
}

const getViewrBasedOnContentType = (responseBody: string, contentType: string, language: string) => {
	if (contentType.includes('image')) {
		return <ResponseImageViewer dataUri={responseBody!} altText={'response-image'} />;
	} else if (contentType.includes('pdf')) {
		return <ResponsePDFViewer pdfData={responseBody!} />;
	}
};

const ResponsePreviewTab: React.FC<ResponsePreviewTabProps> = ({ responseBody, contentType, language }) => {
	return <div className='h-full w-full flex flex-col'>{getViewrBasedOnContentType(responseBody, contentType, language)}</div>;
};

export default ResponsePreviewTab;
