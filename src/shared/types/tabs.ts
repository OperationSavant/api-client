import { AuthConfig, OAuth2Auth } from './auth';
import { Cookie, CookieImportExport } from './cookie';

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
}

export interface RequestTabContext {
	auth: AuthConfig;
	onAuthChange: (auth: AuthConfig) => void;
	onGenerateOAuth2Token: (oauth2Config: OAuth2Auth) => Promise<void>;
	onSelectFile: (index: number) => void;
	onSelectBinaryFile: () => void;
	cookies?: Cookie[];
	onAddCookie?: (cookie: Omit<Cookie, 'created' | 'lastAccessed'>) => void;
	onUpdateCookie?: (name: string, domain: string, path: string, updates: Partial<Cookie>) => void;
	onDeleteCookie?: (name: string, domain: string, path: string) => void;
	onDeleteAllCookies?: () => void;
	onImportCookies?: (cookies: Cookie[]) => void;
	onExportCookies?: (exportConfig: CookieImportExport) => void;
}
