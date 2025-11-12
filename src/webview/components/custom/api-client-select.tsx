import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/shared/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ApiClientSelectProps extends React.ComponentProps<typeof Select> {
	classNameTrigger?: string;
	classNameContent?: string;
	classNameDiv?: string;
	selectItemClassName?: string;
	placeholder?: string;
	options?: (Record<'label' | 'value', string> & { Icon?: LucideIcon })[];
}

export const ApiClientSelect = ({
	classNameTrigger,
	classNameContent,
	classNameDiv,
	selectItemClassName,
	placeholder,
	options,
	...props
}: ApiClientSelectProps) => {
	return (
		<Select {...props}>
			<SelectTrigger
				className={cn(
					`border-0 border-muted-foreground rounded-none focus:ring-0 focus:ring-offset-0 font-medium text-xs! text-center bg-transparent shadow-none`,
					classNameTrigger
				)}>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent className={cn(`bg-background text-center border-muted-foreground`, classNameContent)}>
				{options?.map(option => (
					<SelectItem
						key={option.value}
						value={option.value}
						className={cn(
							`justify-center! text-center! pl-0! hover:bg-muted-foreground/20 focus:bg-muted-foreground/20 hover:text-foreground focus:text-foreground`,
							selectItemClassName
						)}>
						<div className={cn(`http-${option.value.toLowerCase()} hover:http-${option.value.toLowerCase()} font-medium text-xs`, classNameDiv)}>
							{option.Icon && <option.Icon className='w-4 h-4 mr-2 inline-block' />}
							{option.label.toUpperCase()}
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};
