import React from 'react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import FormDataBody from './FormDataBody';
import UrlEncodedBody from './UrlEncodedBody';
import RawBody from './RawBody';
import BinaryBody from './BinaryBody';
import GraphQLBody from './GraphQLBody';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setBodyType } from '@/features/requestBody/requestBodySlice';
import { BodyType } from '@/shared/types';

interface BodySelectorProps {
	onSelectFile: (index: number) => void;
	onSelectBinaryFile: () => void;
}

export const BodySelector: React.FC<BodySelectorProps> = ({ onSelectFile, onSelectBinaryFile }) => {
	const dispatch = useDispatch();
	const bodyConfig = useSelector((state: RootState) => state.requestBody.config);
	const onSelectionChanged = (type: BodyType) => {
		dispatch(setBodyType(type));
	};

	const renderBodyComponent = () => {
		switch (bodyConfig.type) {
			case 'form-data':
				return <FormDataBody onSelectFile={onSelectFile} />;
			case 'x-www-form-urlencoded':
				return <UrlEncodedBody />;
			case 'raw':
				return <RawBody />;
			case 'binary':
				return <BinaryBody onSelectFile={onSelectBinaryFile} />;
			case 'graphql':
				return <GraphQLBody />;
			case 'none':
			default:
				return (
					<div className='text-center py-8 text-muted-foreground'>
						<p>No request body will be sent.</p>
						<p className='text-sm'>Select a body type above to add content.</p>
					</div>
				);
		}
	};

	return (
		<div className='flex flex-col w-full gap-4 h-full'>
			<div className='flex h-6 items-center'>
				<RadioGroup value={bodyConfig.type} onValueChange={onSelectionChanged} orientation='horizontal' className='flex items-center gap-4'>
					<div className='flex items-center gap-3'>
						<RadioGroupItem value='none' id='r1' onChange={() => onSelectionChanged('none')} />
						<Label className='leading-normal' htmlFor='r1'>
							None
						</Label>
					</div>
					<div className='flex items-center gap-3'>
						<RadioGroupItem value='form-data' id='r2' onChange={() => onSelectionChanged('form-data')} />
						<Label className='leading-normal' htmlFor='r2'>
							Form Data
						</Label>
					</div>
					<div className='flex items-center gap-3'>
						<RadioGroupItem value='x-www-form-urlencoded' id='r3' onChange={() => onSelectionChanged('x-www-form-urlencoded')} />
						<Label className='leading-normal' htmlFor='r3'>
							URL Encoded
						</Label>
					</div>
					<div className='flex items-center gap-3'>
						<RadioGroupItem value='raw' id='r4' onChange={() => onSelectionChanged('raw')} />
						<Label className='leading-normal' htmlFor='r4'>
							Raw
						</Label>
					</div>
					<div className='flex items-center gap-3'>
						<RadioGroupItem value='binary' id='r5' onChange={() => onSelectionChanged('binary')} />
						<Label className='leading-normal' htmlFor='r5'>
							Binary
						</Label>
					</div>
					<div className='flex items-center gap-3'>
						<RadioGroupItem value='graphql' id='r6' onChange={() => onSelectionChanged('graphql')} />
						<Label className='leading-normal' htmlFor='r6'>
							GraphQL
						</Label>
					</div>
				</RadioGroup>
			</div>
			<Separator orientation='horizontal' />
			<div className='flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable] pr-1 pb-2'>{renderBodyComponent()}</div>
		</div>
	);
};
