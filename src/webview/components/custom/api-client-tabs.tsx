import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '../ui/tabs';
import { cn } from '@/shared/lib/utils';
import { TabConfig } from '@/shared/types/tabs';
import { ChevronDown } from 'lucide-react'; // or your icon library

interface TabSelectOption {
	value: string;
	label: string;
	icon?: React.ComponentType<{ className?: string }>;
}

interface TabSelectTriggerProps {
	tabValue: string;
	tabLabel: string;
	icon?: React.ComponentType<{ className?: string }>;
	badge?: string | number;
	isActive: boolean;
	options: TabSelectOption[];
	selectedValue?: string;
	onSelectChange?: (value: string) => void;
	placeholder?: string;
	className?: string;
}

const TabSelectTrigger: React.FC<TabSelectTriggerProps> = ({
	tabValue,
	tabLabel,
	icon: Icon,
	badge,
	isActive,
	options,
	selectedValue,
	onSelectChange,
	placeholder = 'Select...',
	className,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [isOpen]);

	const handleSelectClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsOpen(!isOpen);
	};

	const handleOptionClick = (optionValue: string) => {
		onSelectChange?.(optionValue);
		setIsOpen(false);
	};

	const selectedOption = options.find(opt => opt.value === selectedValue);
	const displayLabel = selectedOption?.label || placeholder;
	const SelectedIcon = selectedOption?.icon;

	// When tab is not active, show as regular tab trigger
	if (!isActive) {
		return (
			<div className='flex items-center gap-2'>
				{Icon && <Icon className='w-4 h-4' />}
				<span>{tabLabel}</span>
				{badge !== undefined && badge !== null && badge !== '' && (
					<span className='ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary'>{badge}</span>
				)}
			</div>
		);
	}

	// When tab is active, show as select dropdown
	return (
		<div ref={dropdownRef} className='relative flex items-center gap-2'>
			{Icon && <Icon className='w-4 h-4' />}

			<button
				type='button'
				onClick={handleSelectClick}
				className={cn(
					'flex items-center gap-1.5 px-2 py-1 rounded',
					'bg-background border border-border',
					'hover:bg-muted transition-colors',
					'text-sm font-medium',
					className
				)}>
				{SelectedIcon && <SelectedIcon className='w-3.5 h-3.5' />}
				<span>{displayLabel}</span>
				<ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')} />
			</button>

			{badge !== undefined && badge !== null && badge !== '' && <span className='px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary'>{badge}</span>}

			{isOpen && (
				<div className={cn('absolute top-full left-0 mt-1 z-50', 'min-w-40 bg-popover border border-border rounded-md shadow-lg', 'overflow-hidden')}>
					<div className='py-1'>
						{options.map(option => {
							const OptionIcon = option.icon;
							const isSelected = option.value === selectedValue;

							return (
								<button
									key={option.value}
									type='button'
									onClick={() => handleOptionClick(option.value)}
									className={cn(
										'w-full px-3 py-2 text-left text-sm',
										'hover:bg-muted transition-colors',
										'flex items-center gap-2',
										isSelected && 'bg-primary/10 text-primary'
									)}>
									{OptionIcon && <OptionIcon className='w-4 h-4' />}
									<span>{option.label}</span>
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
};

interface ApiClientTabsProps<T extends string = string> {
	tabs: TabConfig<T>[];
	value?: T;
	onChange?: (value: T) => void;
	context?: Record<string, any>;
	orientation?: 'horizontal' | 'vertical';
	className?: string;
	listClassName?: string;
	contentClassName?: string;
	onTabActivate?: (tabId: T) => void;
}

interface TabTriggerProps {
	value: string;
	icon?: React.ComponentType<{ className?: string }>;
	badge?: string | number;
	disabled?: boolean;
	children: React.ReactNode;
	className?: string;
}

const TabTriggerWithIcon: React.FC<
	TabTriggerProps & {
		selectMode?: TabConfig['selectMode'];
		isActive?: boolean;
	}
> = ({ value, icon: Icon, badge, disabled, children, className, selectMode, isActive = false }) => {
	return (
		<TabsTrigger
			value={value}
			disabled={disabled}
			className={cn(
				'relative border-0 justify-center items-center rounded-none p-4',
				'data-[state=active]:bg-primary/20 data-[state=active]:border-primary data-[state=active]:border-b',
				'data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-b data-[state=inactive]:border-transparent',
				'hover:bg-muted',
				'data-[state=inactive]:hover:text-foreground',
				'transition-all duration-200',
				className
			)}>
			{/* <div className='flex items-center gap-2'>
				{Icon && <Icon />}
				<span>{children}</span>
				{badge !== undefined && badge !== null && badge !== '' && (
					<span className='ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary'>{badge}</span>
				)}
			</div> */}
			{selectMode?.enabled ? (
				<TabSelectTrigger
					tabValue={value}
					tabLabel={children as string}
					icon={Icon}
					badge={badge}
					isActive={isActive}
					options={selectMode.options}
					selectedValue={selectMode.selectedValue}
					onSelectChange={selectMode.onSelectChange}
					placeholder={selectMode.placeholder}
				/>
			) : (
				<div className='flex items-center gap-2'>
					{Icon && <Icon />}
					<span>{children}</span>
					{badge !== undefined && badge !== null && badge !== '' && (
						<span className='ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary'>{badge}</span>
					)}
				</div>
			)}
		</TabsTrigger>
	);
};

const ApiClientTabs = <T extends string = string>({
	tabs,
	value,
	onChange,
	context = {},
	orientation = 'horizontal',
	className,
	listClassName,
	contentClassName,
	onTabActivate,
}: ApiClientTabsProps<T>) => {
	const handleValueChange = useCallback(
		(newValue: string) => {
			const typedValue = newValue as T;
			onTabActivate?.(typedValue);
			onChange?.(typedValue);
		},
		[onChange, onTabActivate]
	);
	const visibleTabs = useMemo(() => tabs.filter(tab => !tab.hidden), [tabs]);

	const renderTabContent = (tab: TabConfig<T>) => {
		let content: React.ReactNode = null;
		if (tab.render) {
			content = tab.render({ ...context, ...tab.props });
		} else if (tab.component) {
			const Component = tab.component;
			// Wrap in Suspense to support lazy-loaded components
			content = (
				<React.Suspense fallback={<div className='flex items-center justify-center h-full'>Loading...</div>}>
					<Component {...context} {...tab.props} />
				</React.Suspense>
			);
		} else {
			content = tab.children;
		}
		return (
			<TabsContent key={tab.id} value={tab.id} className={contentClassName}>
				{content}
			</TabsContent>
		);
	};
	return (
		<Tabs value={value} onValueChange={handleValueChange} orientation={orientation} className={className}>
			<TabsList className={cn(`bg-transparent gap-2 p-1`, listClassName)}>
				{/* {visibleTabs.map(tab => (
					<TabTriggerWithIcon key={tab.id} value={tab.id} icon={tab.icon} badge={tab.badge} disabled={tab.disabled} data-testid={tab.testId}>
						{tab.label}
					</TabTriggerWithIcon>
				))} */}
				{visibleTabs.map(tab => (
					<TabTriggerWithIcon
						key={tab.id}
						value={tab.id}
						icon={tab.icon}
						badge={tab.badge}
						disabled={tab.disabled}
						data-testid={tab.testId}
						selectMode={tab.selectMode} // NEW PROP
						isActive={value === tab.id} // NEW PROP
					>
						{tab.label}
					</TabTriggerWithIcon>
				))}
			</TabsList>

			{visibleTabs.map(renderTabContent)}
		</Tabs>
	);
};

export default ApiClientTabs;
