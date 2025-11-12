import React from 'react';
import { Button } from '@/components/ui/button';
import { Code } from 'lucide-react';
import { RawBodyConfig } from '@/shared/types/body';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '@/store';
import { setRawBody } from '@/features/requestBody/requestBodySlice';
import MonacoEditor from '@/components/editor/monaco-editor';
import { ApiClientSelect } from '@/components/custom/api-client-select';
import ApiClientFieldRow from '@/components/custom/api-client-field-row';
import { BODY_TYPE_OPTIONS } from '@/shared/constants/select-options';
import { MonacoEditorHandle } from '@/shared/types/monaco';

const RawBody: React.FC = () => {
	const editorRef = React.useRef<MonacoEditorHandle>(null);

	const dispatch = useAppDispatch();
	const bodyConfig = useSelector((state: RootState) => state.requestBody.config);

	if (bodyConfig.type !== 'raw' || !bodyConfig.raw) {
		return null;
	}
	const rawConfig = bodyConfig.raw;

	const updateRawConfig = (newValues: Partial<RawBodyConfig>) => {
		dispatch(setRawBody({ ...rawConfig, ...newValues }));
	};

	const formatContent = async () => {
		try {
			if (editorRef.current) {
				const formatted = await editorRef.current.format();
				if (formatted) {
					updateRawConfig({ content: formatted });
				}
			}
		} catch (error) {
			console.error('Failed to format content:', error);
		}
	};

	const getContentType = () => {
		switch (rawConfig.language) {
			case 'json':
				return 'application/json';
			case 'xml':
				return 'application/xml';
			case 'html':
				return 'text/html';
			case 'javascript':
				return 'application/javascript';
			case 'css':
				return 'text/css';
			default:
				return 'text/plain';
		}
	};

	return (
		<div className='space-y-4 h-full flex flex-col'>
			<div className='flex items-center justify-between'>
				<ApiClientFieldRow label='Language' htmlFor='language'>
					<ApiClientSelect
						value={rawConfig.language || 'json'}
						onValueChange={value => updateRawConfig({ language: value as RawBodyConfig['language'] })}
						placeholder='Select Body Type'
						options={BODY_TYPE_OPTIONS}
						classNameTrigger={`w-[230px] bg-muted-foreground/10 border rounded-md`}
						classNameContent={`w-[230px]`}
					/>
				</ApiClientFieldRow>
				<div className='flex items-center gap-4'>
					<Button onClick={formatContent} size='sm' variant='outline' className='flex items-center gap-2' disabled={!rawConfig.content?.trim()}>
						<Code className='w-4 h-4' />
						Format
					</Button>
				</div>
			</div>

			<div className='flex-1 relative border border-input rounded-md'>
				<MonacoEditor
					ref={editorRef}
					value={rawConfig.content || ''}
					language={rawConfig.language ?? ''}
					onContentChange={value => updateRawConfig({ content: value })}
					height='100%'
				/>
			</div>

			<div className='text-xs text-muted-foreground shrink-0'>
				<p>Content-Type will be set to: {getContentType()}</p>
			</div>
		</div>
	);
};

export default RawBody;
