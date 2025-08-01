import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import FormDataBody from '@/components/body/FormDataBody';
import UrlEncodedBody from '@/components/body/UrlEncodedBody';
import RawBody from '@/components/body/RawBody';
import BinaryBody from '@/components/body/BinaryBody';
import GraphQLBody from '@/components/body/GraphQLBody';
import { RequestBodyConfig, createDefaultRequestBody, generateRequestBody, BodyType } from '@/types/body';

interface BodyTabProps {
	requestBody: string;
	onRequestBodyChange: (body: string) => void;
	onContentTypeChange?: (contentType: string) => void;
}

const BodyTab: React.FC<BodyTabProps> = ({ requestBody, onRequestBodyChange, onContentTypeChange }) => {
	const [bodyConfig, setBodyConfig] = useState<RequestBodyConfig>(createDefaultRequestBody());
	const [activeTab, setActiveTab] = useState<BodyType>('none');

	// Initialize from existing request body (if it's raw text)
	useEffect(() => {
		if (requestBody && bodyConfig.type === 'none') {
			try {
				// Try to detect if it's JSON
				JSON.parse(requestBody);
				setBodyConfig(prev => ({
					...prev,
					type: 'raw',
					raw: { ...prev.raw, content: requestBody, language: 'json' },
				}));
				setActiveTab('raw');
			} catch {
				// If not JSON, treat as plain text
				setBodyConfig(prev => ({
					...prev,
					type: 'raw',
					raw: { ...prev.raw, content: requestBody, language: 'text' },
				}));
				setActiveTab('raw');
			}
		}
	}, []);

	const handleBodyConfigChange = (newConfig: RequestBodyConfig) => {
		setBodyConfig(newConfig);

		// Generate the actual request body
		const { body, contentType } = generateRequestBody(newConfig);

		// Update the parent component
		if (typeof body === 'string') {
			onRequestBodyChange(body);
		} else if (body instanceof FormData) {
			// For FormData, we'll need to handle this differently in the actual request
			onRequestBodyChange('[FormData]');
		} else if (body instanceof File) {
			// For binary files, we'll need to handle this differently in the actual request
			onRequestBodyChange('[Binary File]');
		} else {
			onRequestBodyChange('');
		}

		// Update content type if callback provided
		if (onContentTypeChange && contentType) {
			onContentTypeChange(contentType);
		}
	};

	const handleTabChange = (newType: BodyType) => {
		const newConfig = { ...bodyConfig, type: newType };
		setActiveTab(newType);
		handleBodyConfigChange(newConfig);
	};

	const getTabLabel = (type: BodyType) => {
		const labels = {
			none: 'None',
			'form-data': 'Form Data',
			'x-www-form-urlencoded': 'URL-Encoded',
			raw: 'Raw',
			binary: 'Binary',
			graphql: 'GraphQL',
		};
		return labels[type];
	};

	const getFieldCount = (type: BodyType) => {
		switch (type) {
			case 'form-data':
				return bodyConfig.formData.filter(f => f.enabled && f.key).length;
			case 'x-www-form-urlencoded':
				return bodyConfig.urlEncoded.filter(f => f.enabled && f.key).length;
			case 'raw':
				return bodyConfig.raw.content.trim() ? 1 : 0;
			case 'binary':
				return bodyConfig.binary.file ? 1 : 0;
			case 'graphql':
				return bodyConfig.graphql.query.trim() ? 1 : 0;
			default:
				return 0;
		}
	};

	return (
		<div className='flex flex-col flex-1'>
			<div className='p-4 space-y-4 flex-1 overflow-y-auto'>
				<div className='flex items-center justify-between'>
					<Label className='text-sm font-medium'>Request Body</Label>
					{activeTab !== 'none' && (
						<Badge variant='secondary' className='text-xs'>
							{getFieldCount(activeTab)} {getFieldCount(activeTab) === 1 ? 'item' : 'items'}
						</Badge>
					)}
				</div>

				<Tabs value={activeTab} onValueChange={value => handleTabChange(value as BodyType)}>
					<TabsList className='grid w-full grid-cols-6'>
						<TabsTrigger value='none' className='text-xs'>
							{getTabLabel('none')}
						</TabsTrigger>
						<TabsTrigger value='form-data' className='text-xs'>
							{getTabLabel('form-data')}
						</TabsTrigger>
						<TabsTrigger value='x-www-form-urlencoded' className='text-xs'>
							{getTabLabel('x-www-form-urlencoded')}
						</TabsTrigger>
						<TabsTrigger value='raw' className='text-xs'>
							{getTabLabel('raw')}
						</TabsTrigger>
						<TabsTrigger value='binary' className='text-xs'>
							{getTabLabel('binary')}
						</TabsTrigger>
						<TabsTrigger value='graphql' className='text-xs'>
							{getTabLabel('graphql')}
						</TabsTrigger>
					</TabsList>

					<TabsContent value='none' className='mt-4'>
						<div className='text-center py-8 text-muted-foreground'>
							<p>No request body will be sent.</p>
							<p className='text-sm'>Select a body type above to add content.</p>
						</div>
					</TabsContent>

					<TabsContent value='form-data' className='mt-4'>
						<FormDataBody formData={bodyConfig.formData} onChange={formData => handleBodyConfigChange({ ...bodyConfig, formData })} />
					</TabsContent>

					<TabsContent value='x-www-form-urlencoded' className='mt-4'>
						<UrlEncodedBody urlEncoded={bodyConfig.urlEncoded} onChange={urlEncoded => handleBodyConfigChange({ ...bodyConfig, urlEncoded })} />
					</TabsContent>

					<TabsContent value='raw' className='mt-4'>
						<RawBody rawConfig={bodyConfig.raw} onChange={raw => handleBodyConfigChange({ ...bodyConfig, raw })} />
					</TabsContent>

					<TabsContent value='binary' className='mt-4'>
						<BinaryBody binaryConfig={bodyConfig.binary} onChange={binary => handleBodyConfigChange({ ...bodyConfig, binary })} />
					</TabsContent>

					<TabsContent value='graphql' className='mt-4'>
						<GraphQLBody graphqlConfig={bodyConfig.graphql} onChange={graphql => handleBodyConfigChange({ ...bodyConfig, graphql })} />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
};

export default BodyTab;
