import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/shared/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface ApiClientSelectProps extends React.ComponentProps<typeof Select> {
	options: (Record<'label' | 'value', string> & { Icon?: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>> })[];
	showIconOnly?: boolean;
	classNameTrigger?: string;
	classNameContent?: string;
	classNameDiv?: string;
	selectItemClassName?: string;
	placeholder?: string;
	defaultOption?: boolean;
}

// VS Code compliant base styles
const vscodeSelectTriggerStyles = [
	'rounded-[1px]',
	'shadow-none',
	'ring-0',
	'ring-offset-0',
	'focus:ring-0',
	'focus:ring-offset-0',
	'focus:outline',
	'focus:outline-offset-0',
	'focus:outline-focus-border',
].join(' ');

const vscodeSelectContentStyles = ['rounded-[1px]', 'shadow-none', 'border', 'border-menu-border', 'bg-menu', 'text-menu-foreground'].join(' ');

const vscodeSelectItemStyles = ['rounded-[1px]', 'cursor-pointer'].join(' ');

export const ApiClientSelect = ({
	options,
	showIconOnly = false,
	classNameTrigger,
	classNameContent,
	classNameDiv,
	selectItemClassName,
	placeholder,
	defaultOption,
	...props
}: ApiClientSelectProps) => {
	const selectedOption = options.find(option => option.value === props.value);
	const SelectedIcon = selectedOption?.Icon;
	return (
		<Select {...props}>
			<SelectTrigger
				className={cn(vscodeSelectTriggerStyles, 'border-0 border-muted-foreground font-medium text-xs! text-center bg-transparent', classNameTrigger)}>
				{showIconOnly && SelectedIcon ? <SelectedIcon className='w-4! h-4!' /> : <SelectValue placeholder={placeholder} />}
			</SelectTrigger>
			<SelectContent className={cn(vscodeSelectContentStyles, 'text-center', classNameContent)}>
				{options?.map(option => (
					<SelectItem
						key={option.value}
						value={option.value}
						className={cn(
							vscodeSelectItemStyles,
							`data-highlighted:http-${option.value.toLowerCase()}-bg`,
							`data-[state=checked]:http-${option.value.toLowerCase()}-bg-selected!`,
							`http-${option.value.toLowerCase()}-bg-hover`,
							selectItemClassName
						)}>
						<div className={cn(`http-${option.value.toLowerCase()}`, `font-medium text-xs text-current`, classNameDiv)}>
							{option.Icon && <option.Icon className={`mr-2 h-4 w-4 text-current`} />}
							{option.label}
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};
