import { ApiClientTable } from '@/components/custom/api-client-kvp';
import ApiClientHeader from '../custom/api-client-header';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setParams } from '@/features/requestParams/requestParamsSlice';
import { useKeyValueTable } from '@/hooks/useKeyValueTable';

const ParamsTab: React.FC = () => {
	const dispatch = useDispatch();
	const params = useSelector((state: RootState) => state.requestParams.params);

	const { handleChange, handleCheck, handleDelete } = useKeyValueTable(params, newParams => dispatch(setParams(newParams)), {
		key: '',
		value: '',
		checked: false,
	});
	return (
		<div className='h-full gap-2 flex flex-col'>
			<ApiClientHeader headerText='Params' />
			<div className='flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable] pr-1'>
				<ApiClientTable rows={params} handleChange={handleChange} handleCheck={handleCheck} handleDelete={handleDelete} />
			</div>
		</div>
	);
};

export default ParamsTab;
