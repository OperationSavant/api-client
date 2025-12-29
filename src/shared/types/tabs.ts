import type { AuthConfig, OAuth2Auth } from '@/shared/types/auth';
import type { Response } from '@/shared/types/response';
import type { MessageEnvelope } from './webview-messages';
/**
 * NOTE:
 * Tabs are a heterogeneous, runtime-composed registry.
 * Prop types cannot be known statically at this boundary.
 * Type safety is enforced inside individual tab components.
 */
export interface TabConfig<T extends string = string> {
	id: T;
	label: string;
	icon?: React.ComponentType<{ className?: string }>;
	badge?: string | number;
	disabled?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	component?: React.ComponentType<any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	render?: (props: any) => React.ReactNode;
	children?: React.ReactNode;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	props?: Record<string, any>;
	hidden?: boolean;
	testId?: string;
}

export interface RequestTabContext {
	auth?: AuthConfig;
	onAuthChange: (auth: AuthConfig) => void;
	onGenerateOAuth2Token: (oauth2Config: OAuth2Auth) => Promise<void>;
	onSelectFile: (index: number) => void;
	onSelectBinaryFile: () => void;
}

export interface ResponseTabContext {
	response: Response | null;
}

export interface SidebarTabContext {
	sendToExtension: (message: MessageEnvelope) => void;
}
