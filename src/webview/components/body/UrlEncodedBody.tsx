import { ApiClientTable } from '../custom/api-client-kvp';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { useKeyValueTable } from '@/hooks/useKeyValueTable';
import { setUrlEncoded } from '@/features/requestBody/requestBodySlice';

const UrlEncodedBody: React.FC = () => {
	const dispatch = useDispatch();
	const fields = useSelector((state: RootState) => state.requestBody.config.urlEncoded);

	const { handleChange, handleCheck, handleDelete } = useKeyValueTable(fields, newFields => dispatch(setUrlEncoded(newFields)), {
		key: '',
		value: '',
		checked: false,
	});

	return <ApiClientTable rows={fields} handleChange={handleChange} handleCheck={handleCheck} handleDelete={handleDelete} />;
};

export default UrlEncodedBody;
