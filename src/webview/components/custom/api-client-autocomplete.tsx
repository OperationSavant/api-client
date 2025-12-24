import * as React from 'react';
import { Check } from 'lucide-react';
import { useFloating, offset, flip, size, autoUpdate, FloatingPortal } from '@floating-ui/react';
import { cn } from '@/shared/lib/utils';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { ApiClientInput } from './api-client-input';

interface AutocompleteProps {
	options: Record<'value' | 'label', string>[];
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}

interface ScoredOption {
	value: string;
	label: string;
	score: number;
}

/**
 * Fuzzy matching algorithm
 * Returns score > 0 if pattern matches, 0 if no match
 * Higher score = better match (consecutive characters get bonus)
 */
const fuzzyMatch = (str: string, pattern: string): number => {
	if (!pattern) return 1;

	const patternLower = pattern.toLowerCase();
	const strLower = str.toLowerCase();

	let patternIdx = 0;
	let score = 0;
	let consecutiveBonus = 0;

	for (let i = 0; i < strLower.length; i++) {
		if (strLower[i] === patternLower[patternIdx]) {
			// Consecutive matches get higher score
			consecutiveBonus = i > 0 && strLower[i - 1] === patternLower[patternIdx - 1] ? consecutiveBonus + 1 : 0;

			score += 1 + consecutiveBonus;
			patternIdx++;

			if (patternIdx === patternLower.length) {
				// Bonus for earlier matches
				score += strLower.length - i;
				return score;
			}
		}
	}

	return patternIdx === patternLower.length ? score : 0;
};

export const Autocomplete = ({ options, value, onChange, placeholder, className }: AutocompleteProps) => {
	const [open, setOpen] = React.useState(false);
	const [highlightedIndex, setHighlightedIndex] = React.useState(0);
	const inputRef = React.useRef<HTMLInputElement>(null);
	const listRef = React.useRef<HTMLDivElement>(null);

	// Floating UI setup for positioning
	const { refs, floatingStyles } = useFloating({
		open,
		onOpenChange: setOpen,
		placement: 'bottom-start',
		strategy: 'fixed',
		middleware: [
			offset(4),
			flip({
				fallbackPlacements: ['bottom-start', 'top-start'], // ✅ Prefer bottom
				padding: 8,
			}),
			size({
				apply({ rects, elements, availableHeight }) {
					Object.assign(elements.floating.style, {
						width: `${rects.reference.width}px`,
						maxHeight: `${Math.min(300, availableHeight - 8)}px`, // ✅ Respect available space
					});
				},
				padding: 8,
			}),
		],
		whileElementsMounted: autoUpdate,
	});

	// Fuzzy filter and sort options
	const filteredOptions = React.useMemo<ScoredOption[]>(() => {
		if (!value) return options.map(opt => ({ ...opt, score: 1 }));

		return options
			.map(opt => ({ ...opt, score: fuzzyMatch(opt.label, value) }))
			.filter(opt => opt.score > 0)
			.sort((a, b) => b.score - a.score);
	}, [value, options]);

	// Reset highlighted index when filtered options change
	React.useEffect(() => {
		setHighlightedIndex(0);
	}, [filteredOptions]);

	// Scroll highlighted item into view
	React.useEffect(() => {
		if (open && listRef.current) {
			const highlightedElement = listRef.current.querySelector('[data-highlighted="true"]');
			if (highlightedElement) {
				highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			}
		}
	}, [highlightedIndex, open]);

	const handleSelect = React.useCallback(
		(selected: string) => {
			onChange(selected);
			setOpen(false);
			setTimeout(() => inputRef.current?.focus(), 0);
		},
		[onChange]
	);

	const handleInputChange = React.useCallback(
		(val: string) => {
			onChange(val);
			setOpen(true);
			setHighlightedIndex(0);
		},
		[onChange]
	);

	const handleKeyDown = React.useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			// Open dropdown on ArrowDown/ArrowUp if closed
			if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
				if (filteredOptions.length > 0) {
					setOpen(true);
					e.preventDefault();
				}
				return;
			}

			// Handle navigation when dropdown is open
			if (open && filteredOptions.length > 0) {
				switch (e.key) {
					case 'ArrowDown':
						setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
						e.preventDefault();
						break;

					case 'ArrowUp':
						setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
						e.preventDefault();
						break;

					case 'Enter':
						if (filteredOptions[highlightedIndex]) {
							handleSelect(filteredOptions[highlightedIndex].value);
						}
						e.preventDefault();
						break;

					case 'Escape':
						setOpen(false);
						e.preventDefault();
						break;

					case 'Tab':
						// Tab closes dropdown and moves focus naturally
						setOpen(false);
						break;
				}
			}
		},
		[open, filteredOptions, highlightedIndex, handleSelect]
	);

	const handleFocus = React.useCallback(() => {
		if (options.length > 0) {
			setOpen(true);
		}
	}, [options.length]);

	const handleBlur = React.useCallback(() => {
		// Delay closing to allow click events on options to fire
		setTimeout(() => setOpen(false), 150);
	}, []);

	return (
		<div className='w-full'>
			<ApiClientInput
				ref={node => {
					inputRef.current = node;
					refs.setReference(node);
				}}
				type='text'
				value={value}
				placeholder={placeholder}
				className={className}
				onChange={e => handleInputChange(e.target.value)}
				onFocus={handleFocus}
				onBlur={handleBlur}
				onKeyDown={handleKeyDown}
				autoComplete='off'
				role='combobox'
				aria-expanded={open}
				aria-controls='autocomplete-listbox'
				aria-activedescendant={open && filteredOptions[highlightedIndex] ? `option-${filteredOptions[highlightedIndex].value}` : undefined}
			/>
			{/* ✅ Portal dropdown outside parent */}
			<FloatingPortal>
				{open && filteredOptions.length > 0 && (
					<div
						ref={node => {
							listRef.current = node;
							refs.setFloating(node);
						}}
						style={floatingStyles}
						className='z-50 border border-panel-border bg-popover shadow-md rounded-md overflow-hidden'
						id='autocomplete-listbox'
						role='listbox'
						onMouseDown={e => {
							// Prevent input blur when clicking on dropdown
							e.preventDefault();
						}}>
						<Command shouldFilter={false} className='border-0'>
							<CommandList className='max-h-[300px] overflow-y-auto'>
								<CommandGroup>
									{filteredOptions.map((option, idx) => (
										<CommandItem
											key={option.value}
											id={`option-${option.value}`}
											value={option.value}
											data-highlighted={idx === highlightedIndex}
											className={cn('text-xs cursor-pointer', idx === highlightedIndex && 'bg-accent')}
											onMouseEnter={() => setHighlightedIndex(idx)}
											onMouseDown={() => handleSelect(option.value)}
											role='option'
											aria-selected={option.value === value}>
											{option.label}
											<Check className={cn('ml-auto h-4 w-4', option.value === value ? 'opacity-100' : 'opacity-0')} />
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</div>
				)}
			</FloatingPortal>
		</div>
	);
};
