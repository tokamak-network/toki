# Biome.js Adoption and Coding Convention Guide

This project has adopted [Biome.js](https://biomejs.dev/) to ensure high code quality and maintain a consistent formatting style. Biome is a high-performance, all-in-one toolchain designed to replace ESLint and Prettier.

## 1. Background and Expected Benefits

*   **Performance Improvement:** Built with Rust, Biome offers significantly faster execution speeds compared to traditional tools like ESLint and Prettier. This shortens the feedback loop in both local development and CI pipelines.
*   **Simplified Configuration:** By integrating Linting, Formatting, and Import Sorting into a single configuration file (`biome.json`), we eliminate potential configuration conflicts between different tools.
*   **Developer Productivity:** Commands like `biome check --write` allow developers to fix code styles, remove unused code, and optimize imports in a single step.
*   **Consistent Codebase:** Enforcing the same rules across the entire project enhances code readability and reduces time spent on style-related discussions during code reviews.

## 2. Key Configurations and Conventions

The primary conventions defined in `biome.json` at the project root are as follows:

### Formatting
*   **Indentation:** Uses 2 spaces for indentation.
*   **Quotes:** Double quotes (`"`) are preferred for strings and properties.
*   **Line Length:** Line wrapping is handled automatically based on default settings to maintain optimal readability.

### Linting
*   **Recommended Rules:** Standard recommended rule sets from Biome are enabled.
*   **Exceptions:** Considering the project's specific technologies (Next.js, Tailwind CSS) and for a smooth transition, some strict rules (e.g., `a11y`, `suspicious`) are currently set to `off`. These may be progressively enabled in the future.

### Assist
*   **Import Sorting:** Imports are automatically sorted, and unused imports are cleaned up during checks or when saving.

## 3. How to Use

You can run Biome using the scripts registered in `package.json`.

```bash
# Check code style and lint errors (Dry run)
npm run biome:check

# Automatically fix errors and apply formatting
npm run biome:fix
```

## 4. Ignored Paths

The following paths are excluded from linting and formatting (Refer to `.biomeignore` and `biome.json` settings):

*   `node_modules/`, `.next/`, `dist/`, `out/` (Build artifacts and dependencies)
*   `lib/`, `paymaster/lib/`, `paymaster/broadcast/` (External libraries and vendor code)
*   `public/` (Static assets)

## 5. Future Roadmap

*   **CI Integration:** We plan to run `biome ci` via GitHub Actions on every commit or PR to automatically prevent rule violations.
*   **Rule Tightening:** As the codebase stabilizes, we will gradually enable stricter lint rules that are currently disabled.
*   **Full Transition:** We aim to eventually remove `.eslintrc` and related dependencies to fully transition to Biome for all code quality tasks.
