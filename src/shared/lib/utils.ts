import type { Param } from '@/shared/types/request';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function arrayToRecord(params: Param[]): Record<string, string> {
	const result: Record<string, string> = {};
	params.forEach(p => {
		if (p.checked && p.key !== '') {
			result[p.key] = p.value;
		}
	});
	return result;
}

export function recordToArray(record: Record<string, string>): Param[] {
	const params: Param[] = [];
	Object.entries(record).forEach(([key, value]) => {
		params.push({
			key,
			value,
			checked: value !== '' && key !== '',
		});
	});
	// Optionally, add one empty row at the end
	params.push({ key: '', value: '', checked: false });
	return params;
}
