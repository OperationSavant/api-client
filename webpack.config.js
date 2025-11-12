//@ts-check

'use strict';

const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

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
	},
	resolve: {
		// support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
		extensions: ['.ts', '.js'],
		alias: [
			{ name: '@/shared', alias: path.resolve(__dirname, 'src/shared') },
			{ name: '@/domain', alias: path.resolve(__dirname, 'src/domain') },
			{ name: '@/extension', alias: path.resolve(__dirname, 'src/extension') },
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
					},
				],
			},
		],
	},
	devtool: 'nosources-source-map',
	infrastructureLogging: {
		level: 'log', // enables logging required for problem matchers
	},
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
				test: /\.ttf$/,
				type: 'asset/resource',
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
		new MonacoWebpackPlugin(),
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
		new MiniCssExtractPlugin(),
	],
};

module.exports = [config, mainWebviewConfig, sidebarWebviewConfig];

