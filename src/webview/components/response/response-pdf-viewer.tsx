import React, { useMemo } from 'react';
import { useState } from 'react';
import { Document, Page } from 'react-pdf';
import { LoadingFallback } from '../custom/states/loading-fallback';
import { ScrollArea } from '../ui/scroll-area';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface ResponsePDFViewerProps {
	pdfData: string;
}

const options = {
	cMapUrl: '/cmaps/',
	standardFontDataUrl: '/standard_fonts/',
	wasmUrl: '/wasm/',
};

const ResponsePDFViewer: React.FC<ResponsePDFViewerProps> = ({ pdfData }) => {
	const [numPages, setNumPages] = useState<number>();

	const fileObject = useMemo(() => {
		if (!pdfData) return null;
		return { data: pdfData };
	}, [pdfData]);

	function onDocumentLoadSuccess({ numPages: nextNumPages }: PDFDocumentProxy): void {
		setNumPages(nextNumPages);
	}

	if (!fileObject) {
		return <LoadingFallback />;
	}

	return (
		<ScrollArea className='flex-1 w-full min-h-0 overflow-y-auto'>
			<Document options={options} onLoadSuccess={onDocumentLoadSuccess} file={fileObject?.data} className='mx-auto flex flex-col items-center'>
				{Array.from(new Array(numPages), (_el, index) => (
					<Page key={`page_${index + 1}`} pageNumber={index + 1} renderAnnotationLayer={false} renderForms={false} renderTextLayer={false} scale={2} />
				))}
			</Document>
		</ScrollArea>
	);
};

export default ResponsePDFViewer;
