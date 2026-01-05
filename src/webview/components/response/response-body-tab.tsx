import { RESPONSE_CONTENT_TYPE_OPTIONS } from '@/shared/constants/select-options';
import { CircleCheck, Copy, Download, Filter, Play, Search, Send, WrapText } from 'lucide-react';
import type { JSX } from 'react';
import React, { useEffect, useRef, useState } from 'react';
import { EmptyState } from '../custom/states/empty-state';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/main-store';
import { useAppDispatch } from '@/store/main-store';
import { cn } from '@/shared/lib/utils';
import { setActiveResponseBodyTab } from '@/features/editor/editorUISlice';
import { ApiClientSelect } from '../custom/api-client-select';
import ApiClientButton from '../custom/api-client-button';
import { Separator } from '../ui/separator';
import ResponseImageViewer from './response-image-viewer';
import ResponsePDFViewer from './response-pdf-viewer';
import ResponseStringViewer from './response-string-viewer';
import { ApiClientInput } from '../custom/api-client-input';
import type { MonacoEditorHandle } from '@/shared/types/monaco';
import type { Response } from '@/shared/types/response';
import { ResponseHexViewer } from './response-hex-viewer';
import { ResponseHtmlViewer } from './response-html-viewer';

interface ResponseBodyTabProps {
	response: Response;
}

const renderFormatter = (language: string, response: Response, wordWrap: boolean, editorRef: React.RefObject<MonacoEditorHandle | null>) => {
	switch (language) {
		case 'html':
			return <ResponseHtmlViewer html={response.body || ''} />;
		case 'hex':
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			return <ResponseHexViewer model={response.representations?.hex!} />;
		default:
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			return <ResponseStringViewer value={response.body!} language={language} wordWrap={wordWrap} formatOnMount={true} ref={editorRef} />;
	}
};

const responseBodySelector = (responseBody: string, contentType: string): JSX.Element | undefined => {
	if (contentType.includes('image')) {
		return <ResponseImageViewer dataUri={responseBody} altText={'response-image'} />;
	} else if (contentType.includes('pdf')) {
		return <ResponsePDFViewer pdfData={responseBody} />;
	}
};

const renderBody = (
	activeResponseBodyTab: string,
	response: Response,
	language: string,
	wordWrap: boolean,
	editorRef: React.RefObject<MonacoEditorHandle | null>
): JSX.Element | undefined => {
	if (activeResponseBodyTab === 'preview') {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return responseBodySelector(response.body!, response.contentType);
	}
	return renderFormatter(language, response, wordWrap, editorRef);
};

const ResponseBodyTab: React.FC<ResponseBodyTabProps> = ({ response }) => {
	const dispatch = useAppDispatch();
	const {
		ui: { isExecuting, activeResponseBodyTab },
	} = useSelector((state: RootState) => state);
	const editorRef = useRef<MonacoEditorHandle>(null);
	const [wordWrap, setWordWrap] = useState(false);
	const [showFilter, setShowFilter] = useState(false);
	const [copied, setCopied] = useState(false);

	const getOptionsBasedOnResponseType = (contentType: string) => {
		if (contentType?.includes('image') || contentType?.includes('pdf')) {
			return RESPONSE_CONTENT_TYPE_OPTIONS.filter(option => option.responseType === 'binary');
		}
		return RESPONSE_CONTENT_TYPE_OPTIONS;
	};

	const setVisualBasedOnContentType = (contentType: string): string => {
		if (contentType?.includes('image') || contentType?.includes('pdf')) {
			return 'preview';
		}
		return 'default';
	};

	const getDefaultFormatterForContentType = (contentType: string): string => {
		if (contentType?.includes('json')) {
			return 'json';
		} else if (contentType?.includes('html')) {
			return 'html';
		} else if (contentType?.includes('xml')) {
			return 'xml';
		} else if (contentType?.includes('javascript')) {
			return 'javascript';
		} else if (contentType?.includes('css')) {
			return 'css';
		}
		return 'hex';
	};

	const [formatter, setFormatter] = useState(() => getDefaultFormatterForContentType(response?.contentType));
	const [options, setOptions] = useState(() => getOptionsBasedOnResponseType(response?.contentType));

	const handleValueChange = (value: string) => {
		setFormatter(value);
		dispatch(setActiveResponseBodyTab('default'));
	};

	const handleSearch = async () => {
		await editorRef.current?.openSearch();
	};

	const handleCopy = async () => {
		setCopied(true);
		await editorRef.current?.copyToClipboard();
		setTimeout(() => {
			setCopied(false);
		}, 1000);
	};

	useEffect(() => {
		setOptions(getOptionsBasedOnResponseType(response?.contentType));
		const tab = setVisualBasedOnContentType(response?.contentType);
		dispatch(setActiveResponseBodyTab(tab));
		const defaultLanguage = getDefaultFormatterForContentType(response?.contentType);
		setFormatter(defaultLanguage);
	}, [response?.contentType, dispatch]);

	const currentOption = options.find(option => option.value === formatter);
	return (
		<div className='relative h-full w-full rounded-none flex flex-col gap-2'>
			{/* HEADER DIV */}
			<div className='flex justify-between items-center w-full'>
				{/* TABS */}
				<div className='flex flex-1 gap-2 h-9'>
					{activeResponseBodyTab !== 'default' ? (
						<ApiClientButton
							variant='outline'
							content={formatter.toUpperCase()}
							className='w-fit'
							onClick={() => dispatch(setActiveResponseBodyTab('default'))}>
							{currentOption?.Icon && <currentOption.Icon />}
						</ApiClientButton>
					) : (
						<ApiClientSelect
							classNameTrigger={cn(`w-fit`, `${activeResponseBodyTab === 'default' ? 'border border-primary' : ''}`)}
							classNameContent={`w-fit justify-start`}
							classNameDiv='flex justify-center items-center uppercase'
							options={options.map(option => ({ label: option.label, value: option.value, Icon: option.Icon }))}
							value={formatter}
							onValueChange={value => handleValueChange(value)}
						/>
					)}
					<Separator orientation='vertical' className='w-1 bg-primary' />
					<ApiClientButton
						variant={`${activeResponseBodyTab === 'preview' ? 'default' : 'outline'}`}
						content='Preview'
						onClick={() => dispatch(setActiveResponseBodyTab('preview'))}>
						<Play />
					</ApiClientButton>
				</div>
				{/* OPTIONS */}
				<div className='flex justify-between items-center gap-2 h-9'>
					<ApiClientButton variant={wordWrap ? 'default' : 'outline'} size='icon' data-testid='wrap-button' onClick={() => setWordWrap(!wordWrap)}>
						<WrapText />
					</ApiClientButton>
					<Separator orientation='vertical' className='w-1 bg-primary' />
					<ApiClientButton variant={showFilter ? 'default' : 'outline'} size='icon' data-testid='filter-button' onClick={() => setShowFilter(!showFilter)}>
						<Filter />
					</ApiClientButton>
					<ApiClientButton variant={'outline'} size='icon' data-testid='search-button' onClick={handleSearch}>
						<Search />
					</ApiClientButton>
					<Separator orientation='vertical' className='w-1 bg-primary' />
					<ApiClientButton variant='outline' size='icon' data-testid='copy-button' onClick={handleCopy}>
						{copied ? <CircleCheck className='bg-primary' /> : <Copy />}
					</ApiClientButton>
					<ApiClientButton variant='outline' size='icon' data-testid='download-button'>
						<Download />
					</ApiClientButton>
				</div>
			</div>
			{/* Filter */}
			{showFilter && activeResponseBodyTab === 'default' && (
				<div className='flex w-full h-9'>
					<ApiClientInput className='w-full' />
				</div>
			)}
			{renderBody(activeResponseBodyTab, response, formatter, wordWrap, editorRef)}
		</div>
	);
};

export default ResponseBodyTab;
