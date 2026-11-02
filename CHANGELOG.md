# Changelog

## Unreleased

- Fix npm's dependency resolution without force flags: use TypeScript 6.0.3, supported by the current TypeScript ESLint parser, and ESLint 9.39.5, supported by eslint-plugin-react. Regenerate the lockfile.
- Repair the existing App smoke test's Landmark icon mock and query the brand's accessible name after its text was split across elements. Use the Vitest-specific jest-dom entry point so TypeScript sees the custom matchers. Existing assertions remain active.
- Verified locally: clean npm ci, lint, all 5 tests, and the production web build. Native packaging is not verified.
