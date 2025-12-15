import { RESPONSE_CONTENT_TYPE_OPTIONS } from '@/shared/constants/select-options';
import { Send } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { EmptyState } from '../custom/states/empty-state';
import ResponseImageViewer from './response-image-viewer';
import ResponsePDFViewer from './response-pdf-viewer';
import ResponseStringViewer from './response-string-viewer';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '@/store/main-store';
import { cn } from '@/shared/lib/utils';
import ApiClientTabs from '../custom/api-client-tabs';
import { TabConfig } from '@/shared/types/tabs';
import ResponseSelectTab from './response-select-tab';
import ResponsePreviewTab from './response-preview-tab';
import { setActiveResponseBodyTab } from '@/features/editor/editorUISlice';

interface ResponseBodyTabProps {
	responseBody: string;
	contentType: string;
	handleCopy: () => void;
}

// const responseBodySelector = (responseBody: string, contentType: string, language: string) => {
// 	if (contentType.includes('json')) {
// 		return <ResponseStringViewer value={responseBody} language={language} wordWrap={true} copyButtonVisible={false} formatOnMount={true} />;
// 	} else if (contentType.includes('html')) {
// 		return <ResponseStringViewer value={responseBody} language={language} wordWrap={true} copyButtonVisible={false} formatOnMount={true} />;
// 	} else if (contentType.includes('image')) {
// 		return <ResponseImageViewer dataUri={responseBody!} altText={'response-image'} />;
// 	} else if (contentType.includes('pdf')) {
// 		return <ResponsePDFViewer pdfData={responseBody!} />;
// 	}
// };

const ResponseBodyTab: React.FC<ResponseBodyTabProps> = ({ responseBody, contentType, handleCopy }) => {
	const dispatch = useAppDispatch();
	const {
		ui: { isExecuting, activeResponseBodyTab },
	} = useSelector((state: RootState) => state);

	const getOptionsBasedOnresponseType = (contentType: string) => {
		if (contentType.includes('image') || contentType.includes('pdf')) {
			return RESPONSE_CONTENT_TYPE_OPTIONS.filter(option => option.responseType === 'binary');
		}
		return RESPONSE_CONTENT_TYPE_OPTIONS;
	};

	const getDefaultTabForContentType = (contentType: string): string => {
		if (contentType.includes('image') || contentType.includes('pdf')) {
			return 'preview';
		}
		return 'default';
	};

	const getDeafultLangugaeForContentType = (contentType: string): string => {
		if (contentType.includes('json')) {
			return 'json';
		} else if (contentType.includes('html')) {
			return 'html';
		} else if (contentType.includes('xml')) {
			return 'xml';
		} else if (contentType.includes('javascript')) {
			return 'javascript';
		} else if (contentType.includes('css')) {
			return 'css';
		}
		return 'hex';
	};

	const [language, setLanguage] = React.useState('json');
	const [options, setOptions] = useState(() => getOptionsBasedOnresponseType(contentType));

	useEffect(() => {
		setOptions(getOptionsBasedOnresponseType(contentType));
		const defaultTab = getDefaultTabForContentType(contentType);
		dispatch(setActiveResponseBodyTab(defaultTab));
		const defaultLanguage = getDeafultLangugaeForContentType(contentType);
		setLanguage(defaultLanguage);
	}, [contentType, dispatch]);

	if (!responseBody) {
		return (
			<div className='relative'>
				<EmptyState
					icon={Send}
					title='No response yet'
					description='Send a request to see the response here'
					className={cn(isExecuting ? 'opacity-50' : 'opacity-100')}
				/>
			</div>
		);
	}

	const tabContext = {
		responseBody,
		contentType,
		language,
		options,
	};

	const RESPONSE_BODY_TABS_CONFIG: TabConfig[] = [
		{
			id: 'default',
			label: '',
			component: ResponseSelectTab,
			selectMode: {
				options,
				enabled: true,
				selectedValue: language,
				onSelectChange: (value: string) => {
					setLanguage(value);
				},
			},
		},
		{ id: 'preview', label: 'Preview', component: ResponsePreviewTab },
	];

	return (
		<div className='relative h-full w-full border border-border rounded-none bg-secondary flex flex-col'>
			<ApiClientTabs
				tabs={RESPONSE_BODY_TABS_CONFIG}
				context={tabContext}
				value={activeResponseBodyTab}
				onChange={value => dispatch(setActiveResponseBodyTab(value))}
				className='flex-1 flex flex-col min-h-0'
				contentClassName='flex-1 min-h-0 h-full'
			/>
		</div>
	);
};

export default ResponseBodyTab;
