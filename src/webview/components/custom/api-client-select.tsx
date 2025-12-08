import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/shared/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ApiClientSelectProps extends React.ComponentProps<typeof Select> {
	options: (Record<'label' | 'value', string> & { Icon?: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>> })[];
	showIconOnly?: boolean;
	classNameTrigger?: string;
	classNameContent?: string;
	classNameDiv?: string;
	selectItemClassName?: string;
	placeholder?: string;
}

export const ApiClientSelect = ({
	options,
	showIconOnly = false,
	classNameTrigger,
	classNameContent,
	classNameDiv,
	selectItemClassName,
	placeholder,
	...props
}: ApiClientSelectProps) => {
	const selectedOption = options.find(option => option.value === props.value);
	const SelectedIcon = selectedOption?.Icon;
	return (
		<Select {...props}>
			<SelectTrigger
				className={cn(
					`border-0 border-muted-foreground rounded-none focus:ring-0 focus:ring-offset-0 font-medium text-xs! text-center bg-transparent shadow-none`,
					classNameTrigger
				)}>
				{showIconOnly && SelectedIcon ? <SelectedIcon className='w-4! h-4!' /> : <SelectValue placeholder={placeholder} />}
			</SelectTrigger>
			<SelectContent className={cn(`bg-background text-center border-muted-foreground`, classNameContent)}>
				{options?.map(option => (
					<SelectItem
						key={option.value}
						value={option.value}
						className={cn(`hover:bg-muted-foreground/20 focus:bg-muted-foreground/20 hover:text-foreground focus:text-foreground`, selectItemClassName)}>
						<div className={cn(`http-${option.value.toLowerCase()} hover:http-${option.value.toLowerCase()} font-medium text-xs`, classNameDiv)}>
							{option.Icon && <option.Icon className={`w-4! h-4! mr-2`} />}
							{option.label}
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};
