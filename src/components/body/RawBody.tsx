import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Code, Eye } from 'lucide-react';
import { RawBodyConfig } from '@/types/body';

interface RawBodyProps {
	rawConfig: RawBodyConfig;
	onChange: (config: RawBodyConfig) => void;
}

const RawBody: React.FC<RawBodyProps> = ({ rawConfig, onChange }) => {
	const [showPreview, setShowPreview] = useState(false);

	const updateContent = (content: string) => {
		onChange({ ...rawConfig, content });
	};

	const updateLanguage = (language: RawBodyConfig['language']) => {
		onChange({ ...rawConfig, language });
	};

	const updateAutoFormat = (autoFormat: boolean) => {
		onChange({ ...rawConfig, autoFormat });
	};

	const formatContent = () => {
		try {
			let formatted = rawConfig.content;

			switch (rawConfig.language) {
				case 'json':
					if (formatted.trim()) {
						formatted = JSON.stringify(JSON.parse(formatted), null, 2);
					}
					break;
				case 'xml':
					// Basic XML formatting (for demo purposes)
					if (formatted.trim()) {
						formatted = formatted.replace(/></g, '>\n<');
					}
					break;
				default:
					// For other types, just normalize whitespace
					formatted = formatted.trim();
			}

			updateContent(formatted);
		} catch (error) {
			console.error('Failed to format content:', error);
			// Don't update content if formatting fails
		}
	};

	const getPlaceholder = () => {
		switch (rawConfig.language) {
			case 'json':
				return 'Enter JSON data...\n{\n  "key": "value"\n}';
			case 'xml':
				return 'Enter XML data...\n<?xml version="1.0"?>\n<root>\n  <item>value</item>\n</root>';
			case 'html':
				return 'Enter HTML content...\n<!DOCTYPE html>\n<html>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>';
			case 'javascript':
				return 'Enter JavaScript code...\nfunction example() {\n  return "Hello World";\n}';
			case 'css':
				return 'Enter CSS styles...\nbody {\n  margin: 0;\n  padding: 0;\n}';
			case 'text':
			default:
				return 'Enter raw text content...';
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
			case 'text':
			default:
				return 'text/plain';
		}
	};

	const validateContent = () => {
		if (!rawConfig.content.trim()) return { valid: true, message: '' };

		try {
			switch (rawConfig.language) {
				case 'json':
					JSON.parse(rawConfig.content);
					return { valid: true, message: 'Valid JSON' };
				case 'xml':
					// Basic XML validation (check for matching tags)
					const xmlDoc = new DOMParser().parseFromString(rawConfig.content, 'text/xml');
					const parseError = xmlDoc.getElementsByTagName('parsererror');
					if (parseError.length > 0) {
						return { valid: false, message: 'Invalid XML syntax' };
					}
					return { valid: true, message: 'Valid XML' };
				default:
					return { valid: true, message: 'Content ready' };
			}
		} catch (error) {
			return { valid: false, message: `Invalid ${rawConfig.language.toUpperCase()}: ${error instanceof Error ? error.message : 'Syntax error'}` };
		}
	};

	const validation = validateContent();

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<Label className='text-sm font-medium'>Raw Data</Label>
				<div className='flex items-center gap-2'>
					<div className='flex items-center gap-2'>
						<Checkbox id='auto-format' checked={rawConfig.autoFormat} onCheckedChange={checked => updateAutoFormat(!!checked)} />
						<Label htmlFor='auto-format' className='text-sm'>
							Auto-format
						</Label>
					</div>

					<Button onClick={formatContent} size='sm' variant='outline' className='flex items-center gap-2' disabled={!rawConfig.content.trim()}>
						<Code className='w-4 h-4' />
						Format
					</Button>

					<Button onClick={() => setShowPreview(!showPreview)} size='sm' variant='outline' className='flex items-center gap-2'>
						<Eye className='w-4 h-4' />
						{showPreview ? 'Hide' : 'Preview'}
					</Button>
				</div>
			</div>

			<div className='space-y-2'>
				<div className='flex items-center gap-2'>
					<Label htmlFor='language' className='text-sm'>
						Language:
					</Label>
					<Select value={rawConfig.language} onValueChange={updateLanguage}>
						<SelectTrigger className='w-40'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='json'>JSON</SelectItem>
							<SelectItem value='xml'>XML</SelectItem>
							<SelectItem value='html'>HTML</SelectItem>
							<SelectItem value='javascript'>JavaScript</SelectItem>
							<SelectItem value='css'>CSS</SelectItem>
							<SelectItem value='text'>Text</SelectItem>
						</SelectContent>
					</Select>

					<div
						className={`text-sm px-2 py-1 rounded ${
							validation.valid ? 'text-foreground bg-muted border border-ring' : 'text-destructive bg-muted border border-destructive'
						}`}>
						{validation.message || 'Ready'}
					</div>
				</div>

				<Textarea
					value={rawConfig.content}
					onChange={e => updateContent(e.target.value)}
					placeholder={getPlaceholder()}
					className='font-mono text-sm min-h-[300px] resize-y'
					style={{
						fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", monospace',
					}}
				/>
			</div>

			{showPreview && rawConfig.content.trim() && (
				<div className='space-y-2'>
					<Label className='text-sm font-medium'>Preview:</Label>
					<div className='p-3 bg-muted/50 border rounded-lg'>
						<pre className='font-mono text-sm whitespace-pre-wrap break-all'>{rawConfig.content}</pre>
					</div>
				</div>
			)}

			<div className='text-xs text-muted-foreground space-y-1'>
				<p>• Content-Type: {getContentType()}</p>
				<p>• Use the Format button to beautify JSON/XML content</p>
				<p>• Auto-format will format content when the language changes</p>
				{rawConfig.language === 'json' && <p>• JSON content will be validated in real-time</p>}
			</div>
		</div>
	);
};

export default RawBody;
