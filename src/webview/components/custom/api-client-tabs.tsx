import React, { useCallback, useMemo } from 'react';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '../ui/tabs';
import { cn } from '@/shared/lib/utils';
import { TabConfig } from '@/shared/types/tabs';

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
	return (
		<TabsTrigger value={value} disabled={disabled} className={cn('relative', className)}>
			<div className='flex items-center gap-2'>
				{Icon && <Icon className='w-4 h-4' />}
				<span>{children}</span>
				{badge !== undefined && badge !== null && badge !== '' && (
					<span className='ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary'>{badge}</span>
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
			content = <Component {...context} {...tab.props} />;
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
			<TabsList className={listClassName}>
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
