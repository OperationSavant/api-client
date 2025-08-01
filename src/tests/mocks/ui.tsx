// Mock UI components for testing
import React from 'react';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => {
	return <input type={type} ref={ref} {...props} />;
});

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ className, children, ...props }, ref) => {
	return (
		<button ref={ref} {...props}>
			{children}
		</button>
	);
});

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(({ className, children, ...props }, ref) => {
	return (
		<label ref={ref} {...props}>
			{children}
		</label>
	);
});

export const Select = ({ children, onValueChange, value, defaultValue }: any) => {
	return (
		<select value={value || defaultValue} onChange={e => onValueChange?.(e.target.value)} role='combobox'>
			{children}
		</select>
	);
};

export const SelectContent = ({ children }: any) => <div>{children}</div>;
export const SelectItem = ({ value, children }: any) => <option value={value}>{children}</option>;
export const SelectTrigger = ({ children, className }: any) => <div>{children}</div>;
export const SelectValue = ({ placeholder }: any) => <span>{placeholder}</span>;
