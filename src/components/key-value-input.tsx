import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';

interface KeyValuePair {
	id: number;
	key: string;
	value: string;
}

interface KeyValueInputProps {
	label: string;
	value?: Record<string, string>;
	onChange: (data: Record<string, string>) => void;
}

let nextId = 0;

const KeyValueInput: React.FC<KeyValueInputProps> = ({ label, value, onChange }) => {
	const [pairs, setPairs] = useState<KeyValuePair[]>(() => {
		if (value) {
			return Object.entries(value).map(([key, val]) => ({ id: nextId++, key, value: val }));
		}
		return [];
	});

	React.useEffect(() => {
		if (value) {
			const pairsAsRecord = pairs.reduce((acc, pair) => {
				if (pair.key) {
					acc[pair.key] = pair.value;
				}
				return acc;
			}, {} as Record<string, string>);

			if (JSON.stringify(value) === JSON.stringify(pairsAsRecord)) {
				return;
			}

			const newPairs = Object.entries(value).map(([key, val]) => {
				const existingPair = pairs.find(p => p.key === key);
				return { id: existingPair ? existingPair.id : nextId++, key, value: val };
			});
			setPairs(newPairs);
		}
	}, [value]);

	const handleAddPair = () => {
		const newPair = { id: nextId++, key: '', value: '' };
		setPairs([...pairs, newPair]);

		// Auto-scroll to show the new pair after a short delay
		setTimeout(() => {
			const scrollContainer = document.querySelector(`[data-scroll-container="${label}"]`);
			if (scrollContainer) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight;
			}
		}, 50);
	};

	const handleRemovePair = (id: number) => {
		const newPairs = pairs.filter(pair => pair.id !== id);
		setPairs(newPairs);
		updateParent(newPairs);
	};

	const handleKeyChange = (id: number, newKey: string) => {
		const newPairs = pairs.map(pair => (pair.id === id ? { ...pair, key: newKey } : pair));
		setPairs(newPairs);
	};

	const handleValueChange = (id: number, newValue: string) => {
		const newPairs = pairs.map(pair => (pair.id === id ? { ...pair, value: newValue } : pair));
		setPairs(newPairs);
	};

	const handleBlur = () => {
		updateParent(pairs);
	};

	const updateParent = (currentPairs: KeyValuePair[]) => {
		const data: Record<string, string> = {};
		currentPairs.forEach(pair => {
			if (pair.key) {
				data[pair.key] = pair.value;
			}
		});
		onChange(data);
	};

	return (
		<div className='flex flex-col h-full'>
			{/* Header */}
			<div className='flex-shrink-0 p-4 pb-2'>
				<Label>{label}</Label>
			</div>

			{/* Scrollable content area with stable scrollbar */}
			<div className='flex-1 overflow-y-auto px-4 stable-scrollbar' data-scroll-container={label} style={{ scrollbarGutter: 'stable' }}>
				<div className='space-y-2 pb-4'>
					{pairs.map(pair => (
						<div key={pair.id} className='flex space-x-2 items-center'>
							<Input placeholder='Key' value={pair.key} onChange={e => handleKeyChange(pair.id, e.target.value)} onBlur={handleBlur} className='flex-1' />
							<Input placeholder='Value' value={pair.value} onChange={e => handleValueChange(pair.id, e.target.value)} onBlur={handleBlur} className='flex-1' />
							<Button variant='ghost' size='icon' onClick={() => handleRemovePair(pair.id)}>
								<Trash2 className='h-4 w-4' />
							</Button>
						</div>
					))}
				</div>
			</div>

			{/* Sticky Add button at bottom with stable width */}
			<div className='flex-shrink-0 p-4 pt-2 border-t bg-background' style={{ scrollbarGutter: 'stable' }}>
				<Button
					variant='outline'
					onClick={handleAddPair}
					className='w-full'
					onFocus={e => e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}>
					Add {label.slice(0, -1)}
				</Button>
			</div>
		</div>
	);
};

export default KeyValueInput;

