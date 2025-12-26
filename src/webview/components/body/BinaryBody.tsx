import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload, File, X, FileImage, FileText, Music, Video } from 'lucide-react';
import { BinaryBody } from '@/shared/types/body';
import type { RootState } from '@/store/main-store';
import { useAppDispatch } from '@/store/main-store';
import { useSelector } from 'react-redux';
import { setBinaryBody } from '@/features/request/requestSlice';

interface BinaryBodyProps {
	onSelectFile: () => void;
}

const BinaryBody: React.FC<BinaryBodyProps> = ({ onSelectFile }) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [dragOver, setDragOver] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);

	const dispatch = useAppDispatch();
	const body = useSelector((state: RootState) => state.request.body);

	const binaryConfig = body.type === 'binary' ? body.binary : null;

	const updateBinaryConfig = (newValues: Partial<BinaryBody>) => {
		dispatch(setBinaryBody({ ...binaryConfig, ...newValues }));
	};

	useEffect(() => {
		if (!binaryConfig?.filePath) return;
		setUploadProgress(0);
		const interval = setInterval(() => {
			setUploadProgress(prev => {
				if (prev >= 100) {
					clearInterval(interval);
					return 100;
				}
				return prev + 10;
			});
		}, 100);

		return () => clearInterval(interval);
	}, [binaryConfig?.filePath]);

	if (body.type !== 'binary' || !binaryConfig) {
		return null;
	}

	const handleFileSelect = (file: File) => {
		updateBinaryConfig({
			fileName: file.name,
			contentType: file.type || 'application/octet-stream',
		});
		setUploadProgress(0);
		const interval = setInterval(() => {
			setUploadProgress(prev => {
				if (prev >= 100) {
					clearInterval(interval);
					return 100;
				}
				return prev + 10;
			});
		}, 100);
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			handleFileSelect(file);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);

		const files = Array.from(e.dataTransfer.files);
		if (files.length > 0) {
			handleFileSelect(files[0]);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);
	};

	const clearFile = () => {
		updateBinaryConfig({ filePath: undefined, fileName: undefined, contentType: undefined });
		setUploadProgress(0);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	const getFileIcon = (type: string) => {
		if (type.startsWith('image/')) return <FileImage className='w-5 h-5' />;
		if (type.startsWith('video/')) return <Video className='w-5 h-5' />;
		if (type.startsWith('audio/')) return <Music className='w-5 h-5' />;
		if (type.includes('text/') || type.includes('json') || type.includes('xml')) {
			return <FileText className='w-5 h-5' />;
		}
		return <File className='w-5 h-5' />;
	};

	const updateContentType = (contentType: string) => {
		updateBinaryConfig({ contentType });
	};

	const updateFileName = (fileName: string) => {
		updateBinaryConfig({ fileName });
	};

	return (
		<div className='space-y-4 h-full flex flex-col'>
			<Label className='text-sm font-medium'>Binary File</Label>

			{!binaryConfig.filePath ? (
				<div
					className={`border border-input rounded-lg p-8 text-center transition-colors ${
						dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
					}`}
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}>
					<Upload className='w-12 h-12 mx-auto mb-4 text-muted-foreground' />
					<h3 className='text-lg font-medium mb-2'>Upload a file</h3>
					<p className='text-sm text-muted-foreground mb-4'>Drag and drop a file here, or click to select</p>

					<Button onClick={onSelectFile} variant='outline' className='flex items-center gap-2'>
						<Upload className='w-4 h-4' />
						Choose File
					</Button>

					<input ref={fileInputRef} type='file' onChange={handleFileInputChange} className='hidden' />

					<p className='text-xs text-muted-foreground mt-4'>Maximum file size: 100MB • All file types supported</p>
				</div>
			) : (
				<div className='space-y-4'>
					<div className='flex items-start gap-3 p-4 border rounded-lg bg-muted/20'>
						<div className='text-muted-foreground mt-1'>{getFileIcon(binaryConfig.contentType || '')}</div>

						<div className='flex-1 min-w-0'>
							<div className='flex items-center justify-between'>
								<h4 className='font-medium truncate'>{binaryConfig.fileName}</h4>
								<Button onClick={clearFile} size='sm' variant='ghost' className='text-destructive hover:text-destructive hover:bg-destructive/10'>
									<X className='w-4 h-4' />
								</Button>
							</div>

							<p className='text-sm text-muted-foreground'>
								{binaryConfig.size ? formatFileSize(binaryConfig.size) : 'Unknown size'} • {binaryConfig.contentType || 'Unknown type'}
							</p>

							{uploadProgress > 0 && uploadProgress < 100 && (
								<div className='mt-2'>
									<Progress value={uploadProgress} className='h-2' />
									<p className='text-xs text-muted-foreground mt-1'>Preparing file... {uploadProgress}%</p>
								</div>
							)}
						</div>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='filename' className='text-sm'>
								File Name
							</Label>
							<Input id='filename' value={binaryConfig.fileName || ''} onChange={e => updateFileName(e.target.value)} placeholder='Enter file name...' />
						</div>

						<div className='space-y-2'>
							<Label htmlFor='content-type' className='text-sm'>
								Content-Type
							</Label>
							<Input
								id='content-type'
								value={binaryConfig.contentType || ''}
								onChange={e => updateContentType(e.target.value)}
								placeholder='application/octet-stream'
							/>
						</div>
					</div>

					<div className='flex gap-2'>
						<Button onClick={() => fileInputRef.current?.click()} variant='outline' size='sm' className='flex items-center gap-2'>
							<Upload className='w-4 h-4' />
							Replace File
						</Button>

						<input ref={fileInputRef} type='file' onChange={handleFileInputChange} className='hidden' />
					</div>
				</div>
			)}

			<div className='text-xs text-muted-foreground space-y-1'>
				<p>• Binary files will be sent as the request body</p>
				<p>• Content-Type header will be set automatically</p>
				<p>• Large files are supported for most APIs</p>
				<p>• File content is processed locally and securely</p>
			</div>
		</div>
	);
};

export default BinaryBody;
