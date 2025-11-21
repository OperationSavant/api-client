import { updateFormDataWithFiles, setBinaryBody } from '@/features/requestBody/requestBodySlice';
import { AppDispatch } from '@/store';

interface FileHandlerDependencies {
	dispatch: AppDispatch;
}

export function createFileHandlers(deps: FileHandlerDependencies) {
	const handleFormDataFileResponse = (message: any) => {
		const { paths, index } = message;
		if (paths || paths.length > 0) {
			deps.dispatch(updateFormDataWithFiles({ paths, index }));
		}
	};

	const handleBinaryFileResponse = (message: any) => {
		const { path, size, contentType } = message;
		if (path) {
			const fileName = path.split('\\').pop()!.split('/').pop()!;
			deps.dispatch(setBinaryBody({ filePath: path, fileName, size, contentType }));
		}
	};

	return {
		handleFormDataFileResponse,
		handleBinaryFileResponse,
	};
}
