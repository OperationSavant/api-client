import React, { useMemo } from 'react';
import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { LoadingFallback } from '../custom/states/loading-fallback';

pdfjs.GlobalWorkerOptions.workerSrc = './build/pdf.worker.min.mjs';

interface ResponsePDFViewerProps {
	pdfData: string;
}

const ResponsePDFViewer: React.FC<ResponsePDFViewerProps> = ({ pdfData }) => {
	const [numPages, setNumPages] = useState<number>();
	const [pageNumber, setPageNumber] = useState<number>(1);

	const fileObject = useMemo(() => {
		if (!pdfData) return null;
		return { data: pdfData };
	}, [pdfData]);

	const options = {
		cMapUrl: '/cmaps/',
		cMapPacked: true,
		wasmUrl: '/wasm/',
		standardFontDataUrl: '/standard_fonts/',
	};

	function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
		setNumPages(numPages);
	}

	if (!fileObject) {
		return <LoadingFallback />;
	}

	return (
		<div className='flex flex-col bg-transparent w-full h-full justify-center items-center overflow-auto'>
			<div className='flex-1 w-full min-h-0 overflow-y-auto [scrollbar-gutter:stable] pr-1 '>
				<Document options={options} onLoadSuccess={onDocumentLoadSuccess} file={fileObject?.data} scale={2} className={'mx-auto'}>
					{Array.from(new Array(numPages), (el, index) => (
						<Page key={`page_${index + 1}`} pageNumber={index + 1} renderAnnotationLayer={false} renderForms={false} />
					))}
				</Document>
				<p>
					Page {pageNumber} of {numPages}
				</p>
			</div>
		</div>
	);
};

export default ResponsePDFViewer;
