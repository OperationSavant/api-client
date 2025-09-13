import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface KeyValuePair {
	id: number;
	key: string;
	value: string;
}

interface KeyValueInputProps {
	value?: Record<string, string>;
	onChange: (data: Record<string, string>) => void;
}

let nextId = 0;

const KeyValueInput: React.FC<KeyValueInputProps> = ({ value, onChange }) => {
	const [pairs, setPairs] = useState<KeyValuePair[]>(() => {
		if (value && Object.keys(value).length > 0) {
			return Object.entries(value).map(([key, val]) => ({ id: nextId++, key, value: val }));
		}
		return [{ id: nextId++, key: '', value: '' }];
	});

	useEffect(() => {
		const data: Record<string, string> = {};
		let hasEmptyPair = false;
		pairs.forEach(pair => {
			if (pair.key) {
				data[pair.key] = pair.value;
			}
			if (!pair.key && !pair.value) {
				hasEmptyPair = true;
			}
		});
		onChange(data);

		// If the last pair is filled, add a new empty one
		if (!hasEmptyPair) {
			setPairs(prevPairs => [...prevPairs, { id: nextId++, key: '', value: '' }]);
		}
	}, [pairs, onChange]);

	const handleRemovePair = (id: number) => {
		setPairs(pairs.filter(pair => pair.id !== id));
	};

	const handleChange = (id: number, field: 'key' | 'value', val: string) => {
		setPairs(prevPairs => {
			const newPairs = prevPairs.map(pair => (pair.id === id ? { ...pair, [field]: val } : pair));
			const lastPair = newPairs[newPairs.length - 1];
			if (lastPair && (lastPair.key || lastPair.value)) {
				return [...newPairs, { id: nextId++, key: '', value: '' }];
			}
			return newPairs;
		});
	};

	return (
		<div className='space-y-2'>
			{pairs.map(pair => (
				<div key={pair.id} className='flex space-x-2 items-center'>
					<Input placeholder='Key' value={pair.key} onChange={e => handleChange(pair.id, 'key', e.target.value)} className='flex-1' />
					<Input placeholder='Value' value={pair.value} onChange={e => handleChange(pair.id, 'value', e.target.value)} className='flex-1' />
					<Button
						variant='ghost'
						size='icon'
						onClick={() => handleRemovePair(pair.id)}
						// Disable removing the last empty row
						disabled={pairs.length === 1 && !pair.key && !pair.value}>
						<Trash2 className='h-4 w-4' />
					</Button>
				</div>
			))}
		</div>
	);
};

export default KeyValueInput;

