import React from 'react';
import KeyValueInput from '@/components/key-value-input';

interface HeadersTabProps {
	headers: Record<string, string>;
	onHeadersChange: (headers: Record<string, string>) => void;
}

const HeadersTab: React.FC<HeadersTabProps> = ({ headers, onHeadersChange }) => {
	return (
		<div className='h-full'>
			<KeyValueInput label='Headers' value={headers} onChange={onHeadersChange} />
		</div>
	);
};

export default HeadersTab;
