//@ts-check

'use strict';

const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

/**@type {import('webpack').Configuration}*/
const config = {
	target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
	mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

	entry: './src/extension/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
	output: {
		// the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
		path: path.resolve(__dirname, 'dist'),
		filename: 'extension.js',
		libraryTarget: 'commonjs2',
	},
	externals: {
		vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
		// modules added here also need to be added in the .vscodeignore file
		'@vscode/sqlite': 'commonjs2 @vscode/sqlite',
		'mime-types': 'commonjs2 mime-types',
		'mime-db': 'commonjs2 mime-db',
		path: 'commonjs path',
		fs: 'commonjs fs', //
		crypto: 'commonjs crypto', //
		util: 'commonjs util', //
		// os: 'commonjs os', // Prevention: if used
		// stream: 'commonjs stream', // Prevention: if used
		// events: 'commonjs events', // Prevention: if used
		// zlib: 'commonjs zlib',
	},
	resolve: {
		// support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
		extensions: ['.ts', '.js'],
		alias: [
			{ name: '@/shared', alias: path.resolve(__dirname, 'src/shared') },
			{ name: '@/domain', alias: path.resolve(__dirname, 'src/domain') },
			{ name: '@/extension', alias: path.resolve(__dirname, 'src/extension') },
		],
		fallback: {
			// Keep these FALSE for modules we don't want bundled
			path: false,
			fs: false,
			crypto: false,
			util: false,
		},
	},
	optimization: {
		concatenateModules: true,
		mergeDuplicateChunks: true,
		sideEffects: true,
		minimize: true,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					format: { comments: false },
				},
				extractComments: {
					condition: /^\**!|@preserve|@license|@cc_on/i,
					filename: 'LICENSES-extension.txt',
					banner: licenseFile => `License info: ${licenseFile}`,
				},
			}),
		],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
						options: {
							configFile: path.resolve(__dirname, 'tsconfig.json'),
						},
					},
				],
			},
			{
				test: /\.node$/,
				use: 'node-loader',
			},
		],
	},
	devtool: 'nosources-source-map',
	infrastructureLogging: {
		level: 'log', // enables logging required for problem matchers
	},
	plugins: [
		new CopyPlugin({
			patterns: [{ from: 'node_modules/@vscode/sqlite/build/Release', to: 'dist' }],
		}),
	],
};

/**@type {import('webpack').Configuration}*/
const mainWebviewConfig = {
	target: 'web',
	mode: 'none',
	entry: './src/webview/main/main.tsx',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'main.js',
		libraryTarget: 'module',
	},
	experiments: {
		outputModule: true,
	},
	resolve: {
		extensions: ['.ts', '.js', '.tsx', '.css'],
		alias: [
			{ name: '@/shared', alias: path.resolve(__dirname, 'src/shared') },
			{ name: '@', alias: path.resolve(__dirname, 'src/webview') },
		],
		fallback: {
			process: false,
			buffer: require.resolve('buffer/'),
		},
	},
	optimization: {
		concatenateModules: true,
		mergeDuplicateChunks: true,
		sideEffects: true,
		minimize: true,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					format: { comments: false },
				},
				extractComments: {
					condition: /^\**!|@preserve|@license|@cc_on/i,
					filename: fileData =>
						// The "fileData" argument contains object with "filename", "basename", "query" and "hash"
						`${fileData.filename}.LICENSE.txt${fileData.query}`,
					banner: licenseFile => `License information can be found in ${licenseFile}`,
				},
			}),
			new CssMinimizerPlugin(), // ✅ CSS minification
		],
	},
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
						options: {
							configFile: path.resolve(__dirname, 'tsconfig.webview.json'), // <– use webview tsconfig
						},
					},
				],
			},
			{
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader',
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								config: path.resolve(__dirname, 'postcss.config.mjs'),
							},
						},
					},
				],
			},
			{
				test: /\.s[ac]ss$/i,
				use: ['style-loader', 'css-loader', 'sass-loader'],
			},
			{
				test: /\.ttf$/,
				type: 'asset/resource',
			},
			{
				test: /\.svg$/,
				use: ['@svgr/webpack'],
			},
		],
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify('production'),
		}),
		new (require('webpack').ProvidePlugin)({
			process: 'process/browser',
			Buffer: ['buffer', 'Buffer'],
		}),
		new MiniCssExtractPlugin({
			filename: 'main.css',
		}),
		new MonacoWebpackPlugin({
			// languages: ['javascript', 'typescript', 'json', 'html', 'xml', 'css', 'yaml', 'graphql', 'markdown', 'shell'],
			// features: [
			// 	'bracketMatching',
			// 	'clipboard',
			// 	'codeEditor',
			// 	'comment',
			// 	'!contextmenu',
			// 	'documentSymbols',
			// 	'find',
			// 	'folding',
			// 	'format',
			// 	'gotoError',
			// 	'hover',
			// 	'links',
			// 	'multicursor',
			// 	'parameterHints',
			// 	'wordHighlighter',
			// 	'inPlaceReplace',
			// 	'smartSelect',
			// 	'lineSelection',
			// 	'linesOperations',
			// ],
			languages: ['json', 'xml', 'html', 'javascript', 'css', 'typescript'],
			features: ['bracketMatching', 'clipboard', 'find', 'folding', 'format', 'wordHighlighter'],
		}),
		new CopyPlugin({
			patterns: [
				{
					from: path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'build', 'pdf.worker.mjs'),
					to: 'build/pdf.worker.min.mjs',
				},
				{
					from: path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'cmaps'),
					to: 'cmaps/',
				},
				{
					from: path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'wasm'),
					to: 'wasm/',
				},
				{
					from: path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'standard_fonts'),
					to: 'standard_fonts/',
				},
			],
		}),
	],
};

/**@type {import('webpack').Configuration}*/
const sidebarWebviewConfig = {
	target: 'web',
	mode: 'none',
	entry: './src/webview/sidebar/main.tsx',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'sidebar.js',
		libraryTarget: 'module',
	},
	experiments: {
		outputModule: true,
	},
	resolve: {
		extensions: ['.ts', '.js', '.tsx', '.css'],
		alias: [
			{ name: '@/shared', alias: path.resolve(__dirname, 'src/shared') },
			{ name: '@', alias: path.resolve(__dirname, 'src/webview') },
		],
		fallback: {
			process: false,
			buffer: require.resolve('buffer/'),
		},
	},
	optimization: {
		concatenateModules: true,
		mergeDuplicateChunks: true,
		sideEffects: true,
		minimize: true,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					format: { comments: false },
				},
				extractComments: {
					condition: /^\**!|@preserve|@license|@cc_on/i,
					filename: fileData =>
						// The "fileData" argument contains object with "filename", "basename", "query" and "hash"
						`${fileData.filename}.LICENSE.txt${fileData.query}`,
					banner: licenseFile => `License information can be found in ${licenseFile}`,
				},
			}),
		],
	},
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
						options: {
							configFile: path.resolve(__dirname, 'tsconfig.webview.json'),
						},
					},
				],
			},
			{
				test: /\.svg$/,
				use: ['@svgr/webpack'],
			},
		],
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify('production'),
		}),
		new (require('webpack').ProvidePlugin)({
			process: 'process/browser',
			Buffer: ['buffer', 'Buffer'],
		}),
	],
};

/**@type {import('webpack').Configuration}*/
const secondaryWebviewConfig = {
	target: 'web',
	mode: 'none',
	entry: './src/webview/collections/main.tsx',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'secondary.js',
		libraryTarget: 'module',
	},
	experiments: {
		outputModule: true,
	},
	resolve: {
		extensions: ['.ts', '.js', '.tsx', '.css'],
		alias: [
			{ name: '@/shared', alias: path.resolve(__dirname, 'src/shared') },
			{ name: '@', alias: path.resolve(__dirname, 'src/webview') },
		],
		fallback: {
			process: false,
			buffer: require.resolve('buffer/'),
		},
	},
	optimization: {
		concatenateModules: true,
		mergeDuplicateChunks: true,
		sideEffects: true,
		minimize: true,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					format: { comments: false },
				},
				extractComments: {
					condition: /^\**!|@preserve|@license|@cc_on/i,
					filename: fileData =>
						// The "fileData" argument contains object with "filename", "basename", "query" and "hash"
						`${fileData.filename}.LICENSE.txt${fileData.query}`,
					banner: licenseFile => `License information can be found in ${licenseFile}`,
				},
			}),
		],
	},
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
						options: {
							configFile: path.resolve(__dirname, 'tsconfig.webview.json'),
						},
					},
				],
			},
			{
				test: /\.svg$/,
				use: ['@svgr/webpack'],
			},
		],
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify('production'),
		}),
		new (require('webpack').ProvidePlugin)({
			process: 'process/browser',
			Buffer: ['buffer', 'Buffer'],
		}),
	],
};

module.exports = [config, mainWebviewConfig, sidebarWebviewConfig, secondaryWebviewConfig];

