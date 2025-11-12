import React from 'react';
import { Button } from '../ui/button';

interface ApiClientButtonProps extends React.ComponentProps<typeof Button> {
	className?: string;
}

const ApiClientButton = ({ className, ...props }: ApiClientButtonProps) => {
	return (
		<Button onClick={props.onClick} size={props.size} variant={props.variant} {...props} className={className}>
			{props.children ? props.children : ''}
			{props.content}
		</Button>
	);
};

export default ApiClientButton;
