import { KeyValueEntry } from '@/shared/types/request';

export const useKeyValueTable = <T extends KeyValueEntry>(rows: T[], setRows: (newRows: T[]) => void, defaultRow: T) => {
	const keepOnlyOneEmptyRow = (arr: T[]): T[] => {
		const nonEmpty = arr.filter(p => p.key !== '' || p.value !== '');
		return [...nonEmpty, defaultRow];
	};

	const updateRow = (index: number, updates: Partial<T>) => {
		let updated = rows.map((row, i) => (i === index ? { ...row, ...updates } : row));
		const field = updated[index];

		if ((updates.key || updates.value) && (field.key !== '' || field.value !== '')) {
			updated[index].checked = true;
		}

		updated = updated.filter((p, i, arr) => i < arr.length - 1 || p.key !== '' || p.value !== '');
		setRows(keepOnlyOneEmptyRow(updated));
	};

	const handleChange = (idx: number, field: keyof T, val: string) => {
		let updated = rows.map((p, i) => {
			if (i !== idx) return p;
			if ((field === 'key' || field === 'value') && val !== '') {
				return { ...p, [field]: val, checked: true };
			}
			if ((field === 'key' || field === 'value') && val === '' && (field === 'key' ? p.value === '' : p.key === '')) {
				return { ...p, [field]: val, checked: false };
			}
			return { ...p, [field]: val };
		});
		updated = updated.filter((p, i, arr) => i < arr.length - 1 || p.key !== '' || p.value !== '');
		setRows(keepOnlyOneEmptyRow(updated));
	};

	const handleCheck = (idx: number, checked: boolean) => {
		const updated = rows.map((p, i) => (i === idx ? { ...p, checked } : p));
		setRows(keepOnlyOneEmptyRow(updated));
	};

	const handleDelete = (idx: number) => {
		const filtered = rows.filter((_, i) => i !== idx);
		setRows(keepOnlyOneEmptyRow(filtered));
	};

	return {
		rows,
		updateRow,
		handleChange,
		handleCheck,
		handleDelete,
	};
};
