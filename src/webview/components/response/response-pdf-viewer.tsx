import React, { useEffect, useMemo, useRef } from 'react';
import { useState } from 'react';
import { Document, Page } from 'react-pdf';
import { LoadingFallback } from '../custom/states/loading-fallback';
import { ScrollArea } from '../ui/scroll-area';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { EmptyState } from '../custom/states/empty-state';
import { ChevronLeft, ChevronRight, Eraser } from 'lucide-react';
import ApiClientButton from '../custom/api-client-button';

interface ResponsePDFViewerProps {
	pdfData: string;
}

const options = {
	cMapUrl: '/cmaps/',
	standardFontDataUrl: '/standard_fonts/',
	wasmUrl: '/wasm/',
};

const ResponsePDFViewer: React.FC<ResponsePDFViewerProps> = ({ pdfData }) => {
	const [numPages, setNumPages] = useState<number>(1);
	const [pageNumber, setPageNumber] = useState(1);
	const [scale, setScale] = useState(1);

	const fileObject = useMemo(() => {
		if (!pdfData) return null;
		return { data: pdfData };
	}, [pdfData]);

	const onDocumentLoadSuccess = ({ numPages: nextNumPages }: PDFDocumentProxy): void => {
		setNumPages(nextNumPages);
		setPageNumber(1);
	};

	const changePage = (offset: number) => {
		setPageNumber(prevPageNumber => prevPageNumber + offset);
	};

	const previousPage = () => {
		changePage(-1);
	};

	const nextPage = () => {
		changePage(1);
	};

	return (
		<ScrollArea className='relative flex-1 w-full min-h-0 overflow-y-auto group'>
			<Document
				options={options}
				loading={<LoadingFallback message='Loading document...' description='Preparing PDF document for viewing...' />}
				noData={<EmptyState icon={Eraser} title='No document to display' description='The PDF document is empty or could not be loaded.' />}
				onLoadSuccess={onDocumentLoadSuccess}
				file={fileObject?.data}
				className='flex flex-col items-center mx-auto w-full'>
				<Page pageNumber={pageNumber} renderAnnotationLayer={false} renderForms={false} renderTextLayer={false} scale={scale} />
				<div className='flex items-center page-controls bg-background text-foreground border border-border gap-2'>
					<ApiClientButton size={'icon'} disabled={pageNumber <= 1} onClick={previousPage}>
						<ChevronLeft />
					</ApiClientButton>
					<span>
						{pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
					</span>
					<ApiClientButton size={'icon'} disabled={pageNumber >= numPages} onClick={nextPage}>
						<ChevronRight />
					</ApiClientButton>
				</div>
				<div className='flex items-center zoom-controls bg-background text-foreground border border-border gap-2'>
					<ApiClientButton size={'icon'} onClick={() => setScale(prevScale => Math.max(0.5, prevScale - 0.1))}>
						-
					</ApiClientButton>
					<span>Zoom: {(scale * 100).toFixed(0)}%</span>
					<ApiClientButton size={'icon'} onClick={() => setScale(prevScale => Math.min(3, prevScale + 0.1))}>
						+
					</ApiClientButton>
				</div>
			</Document>
		</ScrollArea>
	);
};

export default ResponsePDFViewer;
