import { ApiClientTable } from '@/components/custom/api-client-kvp';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/main-store';
import ApiClientHeader from '../custom/api-client-header';
import { useKeyValueTable } from '@/hooks/useKeyValueTable';
import { setHeaders } from '@/features/request/requestSlice';

const HeadersTab: React.FC = () => {
	const dispatch = useDispatch();
	const headers = useSelector((state: RootState) => state.request.headers);

	const { handleChange, handleCheck, handleDelete } = useKeyValueTable(headers, newHeaders => dispatch(setHeaders(newHeaders)), {
		key: '',
		value: '',
		checked: false,
	});

	return (
		<div className='h-full gap-2 flex flex-col'>
			<ApiClientHeader headerText='Headers' />
			<div className='flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable] pr-1'>
				<ApiClientTable rows={headers} handleChange={handleChange} handleCheck={handleCheck} handleDelete={handleDelete} isHeaderTable />
			</div>
		</div>
	);
};

export default HeadersTab;
