/**
 * Cookie Management Types
 * Types and interfaces for cookie handling and storage
 */

export interface Cookie {
	name: string;
	value: string;
	domain: string;
	path: string;
	expires?: Date;
	maxAge?: number;
	secure: boolean;
	httpOnly: boolean;
	sameSite?: 'Strict' | 'Lax' | 'None';
	priority?: 'Low' | 'Medium' | 'High';
	partitioned?: boolean;
	created: Date;
	lastAccessed: Date;
	hostOnly: boolean;
	session: boolean;
}

export interface CookieJar {
	cookies: Cookie[];
	domains: string[];
	totalCount: number;
	sessionCount: number;
	persistentCount: number;
}

export interface CookieFilter {
	domain?: string;
	name?: string;
	value?: string;
	secure?: boolean;
	httpOnly?: boolean;
	session?: boolean;
	expired?: boolean;
}

export interface CookieStats {
	total: number;
	session: number;
	persistent: number;
	secure: number;
	httpOnly: number;
	sameSiteStrict: number;
	sameSiteLax: number;
	sameSiteNone: number;
	expired: number;
	domains: number;
}

export interface CookieImportExport {
	format: 'json' | 'netscape' | 'csv';
	includeExpired: boolean;
	includeSessions: boolean;
	domainFilter?: string;
}

export interface SetCookieHeader {
	name: string;
	value: string;
	attributes: Record<string, string | boolean>;
}

export interface CookieValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

export interface CookieManagerProps {
	cookies: Cookie[];
	onAddCookie: (cookie: Omit<Cookie, 'created' | 'lastAccessed'>) => void;
	onUpdateCookie: (id: string, cookie: Partial<Cookie>) => void;
	onDeleteCookie: (id: string) => void;
	onDeleteAll: () => void;
	onImport: (cookies: Cookie[]) => void;
	onExport: (format: CookieImportExport) => void;
	className?: string;
}

export interface CookieEditorProps {
	cookie?: Cookie;
	isOpen: boolean;
	onSave: (cookie: Omit<Cookie, 'created' | 'lastAccessed'>) => void;
	onCancel: () => void;
	onDelete?: () => void;
}

export interface CookieViewerProps {
	cookies: Cookie[];
	onEdit: (cookie: Cookie) => void;
	onDelete: (cookie: Cookie) => void;
	onCopy: (cookie: Cookie) => void;
	filter: CookieFilter;
	onFilterChange: (filter: CookieFilter) => void;
	className?: string;
}
