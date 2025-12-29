export type PanelState = 'default' | 'maximized' | 'minimized';

export interface Response {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	body: string | null;
	representations?: BodyRepresentation;
	contentType: string;
	size: number;
	duration: number;
	isError?: boolean;
	error?: string;
	isLargeBody?: boolean;
	bodyFilePath?: string;
	analysis?: ResponseAnalysis;
}

export interface ResponseAnalysis {
	nature: 'text' | 'binary';
	format: 'json' | 'html' | 'xml' | 'text' | 'binary';
	confidence: 'high' | 'low';
	reason: string[];
}

export interface BodyRepresentation {
	raw: string;
	base64: string;
	hex: HexViewModel;
}

export interface HexRow {
	offset: number;
	hex: string[];
	ascii: string;
}

export interface HexViewModel {
	bytesPerRow: number;
	rows: HexRow[];
}
