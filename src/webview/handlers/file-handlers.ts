import { setBinaryBody, updateFormDataWithFiles } from '@/features/request/requestSlice';
import type { AppDispatch } from '@/store/main-store';

interface FileHandlerDependencies {
	dispatch: AppDispatch;
}

export function createFileHandlers(deps: FileHandlerDependencies) {
	const handleFormDataFileResponse = (message: { paths: string[]; index: number }) => {
		const { paths, index } = message;
		if (paths && paths.length > 0) {
			deps.dispatch(updateFormDataWithFiles({ paths, index }));
		}
	};

	const handleBinaryFileResponse = (message: { path: string; size: number; contentType: string }) => {
		const { path, size, contentType } = message;
		if (path) {
			const fileName = path.split('\\').pop()?.split('/').pop();
			deps.dispatch(setBinaryBody({ filePath: path, fileName, size, contentType }));
		}
	};

	return {
		handleFormDataFileResponse,
		handleBinaryFileResponse,
	};
}
