import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint();
async function rules(code: string) {
    const [result] = await eslint.lintText(code, { filePath: 'src/lint-fixture.tsx' });
    return result.messages.map(message => message.ruleId);
}

describe('ESLint 10 React coverage', () => {
    it('rejects missing list keys and unknown DOM properties', async () => {
        const found = await rules('export const Bad = () => <div class="bad">{[1].map(n => <span>{n}</span>)}</div>;');
        expect(found).toContain('@eslint-react/no-missing-key');
        expect(found).toContain('@eslint-react/dom-no-unknown-property');
    });

    it('keeps Rules of Hooks and dependency checks enabled', async () => {
        const found = await rules(`import { useState, useEffect } from 'react';
            export function Bad({ enabled }: { enabled: boolean }) {
                if (enabled) useState(0);
                useEffect(() => { console.log(enabled); }, []);
                return null;
            }`);
        expect(found).toContain('react-hooks/rules-of-hooks');
        expect(found).toContain('react-hooks/exhaustive-deps');
    });
});
