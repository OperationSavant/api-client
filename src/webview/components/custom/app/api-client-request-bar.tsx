import { Input } from '@/components/ui/input';
import { cn } from '@/shared/lib/utils';
import { ApiClientButtonGroup } from '../api-client-button-group';
import { ApiClientSelect } from '../api-client-select';
import ApiClientButton from '../api-client-button';
import { ApiClientInput } from '../api-client-input';
import { HTTP_VERBS_OPTIONS } from '@/shared/constants/select-options';

interface ApiClientRequestBarProps {
	method: string;
	url: string;
	onMethodChange: (method: string) => void;
	onUrlChange: (url: string) => void;
	onSend: () => void;
	onSaveClick: () => void;
	loading?: boolean;
	placeholder?: string;
	onDownloadClick?: (format: string) => void;
}

export function ApiClientRequestBar({
	method,
	url,
	onMethodChange,
	onUrlChange,
	onSend,
	onSaveClick,
	loading = false,
	placeholder = 'Enter URL or paste text',
	onDownloadClick,
}: ApiClientRequestBarProps) {
	const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && !loading) {
			onSend();
		}
	};

	const handleUrlChange = (newUrl: string) => {
		onUrlChange(newUrl);
	};

	return (
		<div className='flex items-center gap-2 w-full'>
			<div className={`flex items-center bg-background border border-muted-foreground overflow-hidden flex-1 rounded-md`}>
				<div className='shrink-0'>
					<ApiClientSelect
						options={HTTP_VERBS_OPTIONS}
						classNameTrigger={`w-[120px] border-r !h-4`}
						classNameContent={`w-[120px]`}
						value={method}
						onValueChange={onMethodChange}
						disabled={loading}
					/>
				</div>
				<div className='flex-1'>
					<ApiClientInput
						type='text'
						value={url}
						onChange={e => handleUrlChange(e.target.value)}
						onKeyDown={handleUrlKeyDown}
						placeholder={placeholder}
						className={cn(
							`border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 h-10 bg-transparent! px-2 disabled:cursor-not-allowed text-xs!`,
							loading ? 'cursor-not-allowed' : ''
						)}
						disabled={loading}
					/>
				</div>
			</div>
			<div className={cn(`flex items-center gap-2 shrink-0`)}>
				<ApiClientButton onClick={onSaveClick} disabled={loading} size={'lg'} variant={'outline'}>
					Save
				</ApiClientButton>
				<ApiClientButtonGroup onClick={onSend} disabled={loading} size={'lg'} downloadClick={undefined} loading={loading} />
			</div>
		</div>
	);
}
