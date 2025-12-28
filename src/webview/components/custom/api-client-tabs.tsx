import React, { useCallback, useMemo } from 'react';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '../ui/tabs';
import { cn } from '@/shared/lib/utils';
import type { TabConfig } from '@/shared/types/tabs';
import { useContainerBreakpoint } from '@/hooks/use-container-breakpoint';

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

const TabTriggerWithIcon: React.FC<TabTriggerProps> = ({ value, icon: Icon, badge, disabled, children, className }) => {
	const { ref } = useContainerBreakpoint();
	return (
		<TabsTrigger
			ref={ref}
			value={value}
			disabled={disabled}
			className={cn(
				// VS Code compliant styles
				'relative border-0 justify-center items-center rounded-none p-2',
				'shadow-none ring-0 ring-offset-0',
				'bg-transparent text-tab-inactive-foreground',
				'data-[state=active]:text-tab-active-foreground',
				'data-[state=active]:bg-transparent',
				'data-[state=active]:shadow-none',
				// Active indicator (bottom border)
				'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5',
				'after:bg-transparent data-[state=active]:after:bg-tab-active-border',
				// Hover state
				'hover:text-foreground',
				// Focus state
				'focus-visible:ring-0 focus-visible:ring-offset-0',
				'focus-visible:outline',
				'focus-visible:-outline-offset-1 focus-visible:outline-focus-border',
				'transition-all duration-200',
				className
			)}>
			<div className='flex items-center gap-2'>
				{Icon && <Icon />}
				{<span>{children}</span>}
				{badge !== undefined && badge !== null && badge !== '' && (
					<span className='ml-1 px-1.5 py-0.5 text-xs rounded-[2px] bg-badge text-badge-foreground'>{badge}</span>
				)}
			</div>
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
			<TabsList className={cn('bg-transparent gap-0 p-0 border-panel-border rounded-none h-9', listClassName)}>
				{visibleTabs.map(tab => (
					<TabTriggerWithIcon key={tab.id} value={tab.id} icon={tab.icon} badge={tab.badge} disabled={tab.disabled} data-testid={tab.testId}>
						{tab.label}
					</TabTriggerWithIcon>
				))}
			</TabsList>

			{visibleTabs.map(renderTabContent)}
		</Tabs>
	);
};

export default ApiClientTabs;
