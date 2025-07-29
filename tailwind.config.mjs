/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{ts,tsx}'],
	theme: {
		extend: {
			colors: {
				background: 'var(--vscode-editor-background)',
				foreground: 'var(--vscode-editor-foreground)',
				primary: 'var(--vscode-button-background)',
				'primary-foreground': 'var(--vscode-button-foreground)',
				input: 'var(--vscode-input-background)',
				'input-foreground': 'var(--vscode-input-foreground)',
				'input-border': 'var(--vscode-input-border)',
				card: 'var(--vscode-sideBar-background)',
				'card-foreground': 'var(--vscode-sideBar-foreground)',
				'card-title': 'var(--vscode-sideBarTitle-foreground)',
				'select-background': 'var(--vscode-settings-dropdownBackground)',
				'select-foreground': 'var(--vscode-settings-dropdownForeground)',
				'select-border': 'var(--vscode-settings-dropdownBorder)',
				'select-list-border': 'var(--vscode-settings-dropdownListBorder)',
				'button-secondary-background': 'var(--vscode-button-secondaryBackground)',
				'button-secondary-foreground': 'var(--vscode-button-secondaryForeground)',
				'textarea-background': 'var(--vscode-input-background)',
				'textarea-foreground': 'var(--vscode-input-foreground)',
				'textarea-border': 'var(--vscode-input-border)',
			},
		},
	},
};

