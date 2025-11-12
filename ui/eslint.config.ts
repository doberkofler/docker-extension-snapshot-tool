import eslint from '@eslint/js';
import {defineConfig} from 'eslint/config';
import tseslint from 'typescript-eslint';
import pluginRegExp from 'eslint-plugin-regexp';
import pluginImportX from 'eslint-plugin-import-x';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default defineConfig(
	{
		ignores: [
			'**/.*', // ignore all dotfiles
			'node_modules/**',
			'dist/**',
			'coverage/**',
			'public/**',
			'./*.{ts,js}',
		],
	},
	{
		linterOptions: {
			reportUnusedDisableDirectives: 'warn',
			reportUnusedInlineConfigs: 'warn',
		},
	},
	eslint.configs.recommended,
	...tseslint.configs.strictTypeChecked,
	...tseslint.configs.stylisticTypeChecked,
	pluginRegExp.configs['flat/recommended'],
	{
		plugins: {
			// @ts-expect-error ts(2322) FIXME: workaround
			'import-x': pluginImportX,
		},
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'preserve-caught-error': [
				'warn',
				{
					requireCatchParameter: true,
				},
			],
			'@typescript-eslint/consistent-type-definitions': 'off',
			'@typescript-eslint/no-confusing-void-expression': 'off',
			'@typescript-eslint/no-deprecated': 'warn',
			'@typescript-eslint/no-inferrable-types': 'off',
			'@typescript-eslint/no-unnecessary-condition': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					caughtErrors: 'none',
					argsIgnorePattern: '^_',
				},
			],
			'@typescript-eslint/restrict-template-expressions': 'off',
		},
	},
	{
		files: ['**/*.{jsx,mjsx,tsx,mtsx}'],
		plugins: {
			react: pluginReact,
			'react-hooks': pluginReactHooks,
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		languageOptions: {
			globals: {
				...globals.browser,
			},
		},
		rules: {
			...pluginReact.configs.flat.all?.rules,
			...pluginReact.configs.flat['jsx-runtime']?.rules, // Add this if you are using React 17+
			'react/jsx-filename-extension': ['warn', {extensions: ['.jsx', '.tsx']}],
			'react/function-component-definition': 'off',
			'react/forbid-component-props': 'off',
			'react/jsx-indent': 'off',
			'react/jsx-indent-props': 'off',
			'react/jsx-max-depth': 'off',
			'react/jsx-max-props-per-line': 'off',
			'react/jsx-newline': 'off',
			'react/jsx-no-bind': ['warn', {allowArrowFunctions: true}],
			'react/jsx-no-literals': 'off',
			'react/jsx-props-no-spreading': 'off',
			'react/no-multi-comp': ['warn', {ignoreStateless: true}],
			'react/jsx-one-expression-per-line': 'off',
			'react/jsx-sort-props': 'off',
			'react/require-default-props': 'off',
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
		},
	},
);
