import { AuthConfig, OAuth2Auth } from './auth';

export interface TabConfig<T extends string = string> {
	id: T;
	label: string;
	icon?: React.ComponentType<{ className?: string }>;
	badge?: string | number;
	disabled?: boolean;
	component?: React.ComponentType<any>;
	render?: (props: any) => React.ReactNode;
	children?: React.ReactNode;
	props?: Record<string, any>;
	hidden?: boolean;
	testId?: string;
	selectMode?: {
		enabled: boolean;
		options: Array<{
			value: string;
			label: string;
			icon?: React.ComponentType<{ className?: string }>;
		}>;
		selectedValue?: string;
		onSelectChange?: (value: string) => void;
		placeholder?: string;
	};
}

export interface RequestTabContext {
	auth?: AuthConfig;
	onAuthChange: (auth: AuthConfig) => void;
	onGenerateOAuth2Token: (oauth2Config: OAuth2Auth) => Promise<void>;
	onSelectFile: (index: number) => void;
	onSelectBinaryFile: () => void;
}

export interface ResponseTabContext {
	responseBody?: string;
	contentType?: string;
	headers?: Record<string, string>;
	handleCopy: () => void;
}

export interface SidebarTabContext {
	sendToExtension: (message: any) => void;
}
