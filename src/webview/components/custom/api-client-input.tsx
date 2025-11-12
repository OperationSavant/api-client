import React from 'react';
import { Input } from '../ui/input';
import { cn } from '@/shared/lib/utils';

interface ApiClientInputProps extends React.ComponentProps<typeof Input> {
	className?: string;
}

export const ApiClientInput: React.FC<ApiClientInputProps> = ({ className, ...props }) => {
	return <Input className={cn(`border-muted-foreground`, className)} {...props} />;
};
