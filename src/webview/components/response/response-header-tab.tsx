import { recordToArray } from '@/shared/lib/utils';
import { Send } from 'lucide-react';
import { ApiClientTable } from '../custom/api-client-kvp';
import { EmptyState } from '../custom/states/empty-state';

interface ResponseHeaderTabProps {
	headers: Record<string, string>;
}

const ResponseHeaderTab: React.FC<ResponseHeaderTabProps> = ({ headers }) => {
	if (!headers) return <EmptyState icon={Send} title='No headers yet' description='Send a request to see the headers here' />;
	return (
		<div className='flex flex-col bg-transparent w-full h-full justify-center items-center overflow-auto'>
			<div className='flex-1 w-full min-h-0 overflow-y-auto [scrollbar-gutter:stable] pr-1 '>
				<ApiClientTable rows={recordToArray(headers).filter(header => header.key && header.value)} isReadOnly />
			</div>
		</div>
	);
};

export default ResponseHeaderTab;
