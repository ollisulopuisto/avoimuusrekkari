import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import react from '@eslint-react/eslint-plugin';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['dist', 'src-tauri', 'node_modules'] },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended, react.configs['recommended-typescript']],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            'react-hooks': reactHooks,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            '@eslint-react/dom-no-unknown-property': 'error',
            '@eslint-react/dom-no-unsafe-target-blank': 'error',
            '@eslint-react/no-duplicate-key': 'error',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
);
