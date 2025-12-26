import { ApiClientTable } from '../custom/api-client-kvp';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store/main-store';
import { useKeyValueTable } from '@/hooks/useKeyValueTable';
import { setUrlEncoded } from '@/features/request/requestSlice';

const UrlEncodedBody: React.FC = () => {
	const dispatch = useDispatch();
	const body = useSelector((state: RootState) => state.request.body);
	const fields = body.type === 'x-www-form-urlencoded' ? body.urlEncoded : [];
	const { handleChange, handleCheck, handleDelete } = useKeyValueTable(fields, newFields => dispatch(setUrlEncoded(newFields)), {
		key: '',
		value: '',
		checked: false,
	});

	return <ApiClientTable rows={fields} handleChange={handleChange} handleCheck={handleCheck} handleDelete={handleDelete} />;
};

export default UrlEncodedBody;
