import React from 'react';
import ApiClientHeader from '../custom/api-client-header';
import { BodySelector } from '../body/BodySelector';

interface BodyTabProps {
	onSelectFile: (index: number) => void;
	onSelectBinaryFile: () => void;
}

const BodyTab: React.FC<BodyTabProps> = ({ onSelectFile, onSelectBinaryFile }) => {
	return (
		<div className='h-full gap-2 flex flex-col'>
			<ApiClientHeader headerText='Request Body' />
			<div className='flex-1 min-h-0'>
				<BodySelector onSelectFile={onSelectFile} onSelectBinaryFile={onSelectBinaryFile} />
			</div>
		</div>
	);
};

export default BodyTab;
