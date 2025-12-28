import React from 'react';
import ResponseStringViewer from './response-string-viewer';

interface ResponseSelectTabProps {
	responseBody: string;
	contentType: string;
	language: string;
}

const getViewerBasedOnContentType = (responseBody: string, contentType: string, language: string) => {
	if (contentType.includes('json')) {
		return <ResponseStringViewer value={responseBody} language={language} wordWrap={true} formatOnMount={true} />;
	} else if (contentType.includes('html')) {
		return <ResponseStringViewer value={responseBody} language={language} wordWrap={true} formatOnMount={true} />;
	}
};

const ResponseSelectTab: React.FC<ResponseSelectTabProps> = ({ responseBody, contentType, language }) => {
	return <>{getViewerBasedOnContentType(responseBody, contentType, language)}</>;
};

export default ResponseSelectTab;
