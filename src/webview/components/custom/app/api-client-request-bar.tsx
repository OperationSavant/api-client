import { cn } from '@/shared/lib/utils';
import { ApiClientButtonGroup } from '../api-client-button-group';
import { ApiClientSelect } from '../api-client-select';
import ApiClientButton from '../api-client-button';
import { ApiClientInput } from '../api-client-input';
import { HTTP_VERBS_OPTIONS } from '@/shared/constants/select-options';
import type { LucideIcon} from 'lucide-react';
import { Download, Save, Send } from 'lucide-react';
import { HttpIcon, GraphQLIcon, GrpcIcon, SocketIOIcon, WebSocketIcon } from '../../../assets';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface ApiClientRequestBarProps {
	method: string;
	url: string;
	onMethodChange: (method: string) => void;
	onUrlChange: (url: string) => void;
	onSend: () => void;
	onSaveClick: () => void;
	loading?: boolean;
	placeholder?: string;
	onDownloadClick?: () => void;
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
	const [requestType, setRequestType] = useState<string>('http');
	const [showInput, setShowInput] = useState(false);
	const [requestName, setRequestName] = useState<string>(''); // New state for region 1 input

	const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && !loading) {
			onSend();
		}
	};

	const handleUrlChange = (newUrl: string) => {
		onUrlChange(newUrl);
	};

	const handleRegion1Click = () => {
		if (!requestName) {
			setRequestName(url || 'New Request');
		}
		setShowInput(true);
	};

	const handleRegion1InputBlur = () => {
		setShowInput(false);
	};

	const handleRegion1InputChange = (value: string) => {
		setRequestName(value);
	};

	const saveRequestOptions: (Record<'value' | 'label', string> & {
		Icon?: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
	})[] = [
		{ value: 'http', label: 'HTTP', Icon: HttpIcon },
		{ value: 'graphQL', label: 'GRAPHQL', Icon: GraphQLIcon },
		{ value: 'gPRC', label: 'gRPC', Icon: GrpcIcon },
		{ value: 'webSocket', label: 'Web Socket', Icon: WebSocketIcon },
		{ value: 'socketIO', label: 'Socket.IO', Icon: SocketIOIcon },
	];

	return (
		<div className='flex flex-col gap-2'>
			<div className='flex items-center w-full justify-between'>
				<div className={`flex items-center gap-2 overflow-hidden rounded-[1px]`}>
					<div className='shrink-0'>
						<ApiClientSelect
							options={saveRequestOptions}
							showIconOnly={true}
							classNameDiv='flex justify-center items-center uppercase'
							classNameTrigger={`w-[60px] h-4 bg-transparent`}
							classNameContent={`w-[160px] justify-start`}
							value={requestType}
							onValueChange={requestType => setRequestType(requestType)}
							disabled={loading}
						/>
					</div>
					<div className='flex h-9'>
						{/** Region 1 */}
						{!showInput && (
							<Label className='h-9 flex items-center px-2 cursor-pointer w-fit' onClick={handleRegion1Click}>
								{requestName || url || 'New Request'}
							</Label>
						)}
						{showInput && (
							<ApiClientInput
								value={requestName}
								onChange={e => handleRegion1InputChange(e.target.value)}
								onBlur={handleRegion1InputBlur}
								placeholder='Enter request name'
								className={cn(loading ? 'cursor-not-allowed' : '')}
								disabled={loading}
								autoFocus
							/>
						)}
						{/** End Region 1 */}
					</div>
				</div>
				<div className={cn(`flex items-center gap-2`)}>
					<ApiClientButton onClick={onSaveClick} disabled={loading} size={'lg'} variant={'default'} content='Save'>
						<Save className='w-4 h-4' />
					</ApiClientButton>
				</div>
			</div>
			<Separator className='bg-primary h-2' />
			<div className='flex items-center gap-2 w-full '>
				<div className={`flex items-center border border-primary overflow-hidden flex-1 rounded-[1px]`}>
					<div className='shrink-0'>
						<ApiClientSelect
							options={HTTP_VERBS_OPTIONS}
							classNameTrigger={`w-[130px] h-4`}
							classNameContent={`w-[130px] justify-start`}
							classNameDiv='flex justify-center items-center uppercase'
							value={method}
							onValueChange={onMethodChange}
							disabled={loading}
						/>
					</div>
					<div className='flex-1'>
						{/** Region 2 */}
						<ApiClientInput
							value={url}
							onChange={e => handleUrlChange(e.target.value)}
							onKeyDown={handleUrlKeyDown}
							placeholder={placeholder}
							className={cn(loading ? 'cursor-not-allowed' : '')}
							disabled={loading}
						/>
						{/** End Region 2 */}
					</div>
				</div>
				<div className={cn(`flex items-center gap-2 shrink-0`)}>
					<ApiClientButtonGroup
						onClick={onSend}
						disabled={loading}
						size={'lg'}
						icon={Send}
						loading={loading}
						label='Send'
						actions={[{ label: 'Send & Download', icon: Download, onClick: onDownloadClick }]}
					/>
				</div>
			</div>
		</div>
	);
}
