import React from 'react';
import ResponseStringViewer from './response-string-viewer';

interface ResponseSelectTabProps {
	responseBody: string;
	contentType: string;
	language: string;
}

const getViewrBasedOnContentType = (responseBody: string, contentType: string, language: string) => {
	if (contentType.includes('json')) {
		return <ResponseStringViewer value={responseBody} language={language} wordWrap={true} copyButtonVisible={false} formatOnMount={true} />;
	} else if (contentType.includes('html')) {
		return <ResponseStringViewer value={responseBody} language={language} wordWrap={true} copyButtonVisible={false} formatOnMount={true} />;
	}
};

const ResponseSelectTab: React.FC<ResponseSelectTabProps> = ({ responseBody, contentType, language }) => {
	return <>{getViewrBasedOnContentType(responseBody, contentType, language)}</>;
};

export default ResponseSelectTab;
