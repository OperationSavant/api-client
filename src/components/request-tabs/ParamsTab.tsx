import React from 'react';
import KeyValueInput from '@/components/key-value-input';

interface ParamsTabProps {
	params: Record<string, string>;
	onParamsChange: (params: Record<string, string>) => void;
}

const ParamsTab: React.FC<ParamsTabProps> = ({ params, onParamsChange }) => {
	return (
		<div className='flex-1 flex flex-col overflow-y-auto'>
			<KeyValueInput label='Parameters' value={params} onChange={onParamsChange} />
		</div>
	);
};

export default ParamsTab;

