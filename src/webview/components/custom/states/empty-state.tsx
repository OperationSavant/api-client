import React from 'react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
}

/**
 * Reusable empty state component
 * Use this for "no data" scenarios throughout the application
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action, className }) => {
	return (
		<Empty className={cn('border-none', className)}>
			<EmptyHeader>
				{Icon && (
					<EmptyMedia variant='icon'>
						<Icon className='size-6' />
					</EmptyMedia>
				)}
				<EmptyTitle>{title}</EmptyTitle>
				{description && <EmptyDescription>{description}</EmptyDescription>}
			</EmptyHeader>

			{action && <EmptyContent>{action}</EmptyContent>}
		</Empty>
	);
};
