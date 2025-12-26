const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = [
	{
		ignores: ['dist/**', 'out/**', 'node_modules/**', '*.js', 'webpack.config.js'],
	},
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: 'module',
			parser: tsparser,
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
				project: './tsconfig.eslint.json',
				tsconfigRootDir: __dirname,
			},
			globals: {
				console: 'readonly',
				process: 'readonly',
				require: 'readonly',
				module: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				Buffer: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				setInterval: 'readonly',
				clearInterval: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': tseslint,
			'react-hooks': reactHooks,
		},
		rules: {
			'prefer-const': 'error',
			'no-var': 'error',
			'no-unused-vars': 'off',
			'no-undef': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			'@typescript-eslint/no-floating-promises': 'warn',
			'@typescript-eslint/no-misused-promises': ['warn', { checksVoidReturn: false }],
			'@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-var-requires': 'off',
			'no-console': 'off',
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
		},
	},
];
