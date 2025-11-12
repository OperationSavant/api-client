export type PanelState = 'default' | 'maximized' | 'minimized';

export interface Response {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	body: string | null;
	isLargeBody?: boolean;
	bodyFilePath?: string;
	contentType: string;
	size: number;
	duration: number;
	isError: boolean;
	error?: string;
}
