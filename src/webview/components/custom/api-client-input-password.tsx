import React from 'react';
import { Button } from '../ui/button';
import { ApiClientInput } from './api-client-input';
import { Eye, EyeOff } from 'lucide-react';

interface ApiClientInputPasswordProps extends React.ComponentProps<typeof ApiClientInput> {
	id?: string;
	placeholder?: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ApiClientInputPassword = ({ id, placeholder, value, onChange }: ApiClientInputPasswordProps) => {
	const [showPassword, setShowPassword] = React.useState(false);

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	return (
		<>
			<ApiClientInput id={id} type={showPassword ? 'text' : 'password'} placeholder={placeholder} value={value} onChange={onChange} className='pr-10' />
			<Button
				type='button'
				variant='ghost'
				size='sm'
				className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-muted-foreground/10 hover:text-foreground'
				onClick={togglePasswordVisibility}>
				{showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
			</Button>
		</>
	);
};

export default ApiClientInputPassword;
