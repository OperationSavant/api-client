import { cn } from '@/shared/lib/utils';
import { Separator } from '../ui/separator';

const ApiClientHeader = ({
	headerText,
	className,
	needSeparator,
	children,
}: {
	headerText: string;
	className?: string;
	needSeparator?: boolean;
	children?: React.ReactNode;
}) => {
	return (
		<div className='flex flex-col gap-2'>
			<div className='flex justify-between items-center'>
				<h1 className={cn(`text-lg font-bold pb-2`, className)}>{headerText}</h1>
				{children}
			</div>
			{needSeparator && <Separator />}
		</div>
	);
};

export default ApiClientHeader;
