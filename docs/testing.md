# Testing Framework and History

This document outlines the testing infrastructure of the project and tracks the history of test implementations and significant changes.

## 1. Testing Framework Overview

We use a modern testing stack to ensure the stability of our React components and business logic, especially for critical flows like gasless staking and onboarding.

### Tech Stack
*   **Vitest**: A high-performance unit test framework powered by Vite.
*   **React Testing Library**: A set of helpers that let you test React components without relying on their implementation details.
*   **JSDOM**: A pure-JavaScript implementation of various web standards, used to simulate a browser environment.

### Core Mocking Strategies
-   **Authentication (Privy)**: We mock the `usePrivy` hook to simulate different login states (`authenticated`, `ready`) and verify UI reactions.
-   **Navigation (Next.js)**: The `useRouter` hook is mocked to track page transitions without actual navigation.
-   **Time-based Effects**: We use `vi.useFakeTimers()` to test typing animations and delayed UI updates in the `TokiChat` component.

---

## 2. Test Execution

To run the tests locally:
```bash
npx vitest
```

---

## 3. History of Test Changes

| Date | Commit | Area | Summary of Changes |
| :--- | :--- | :--- | :--- |
| 2026-02-28 | `62295a9c` | Framework, UI | **Initial Setup**: Added Vitest configuration and introduced regression tests for `TokiChat` and `OnboardingQuest`. |
---

## 4. Significant Testing Milestones

### Regression Testing for Biomejs Adoption (`62295a9c`)
As documented in the [Regression Test Report](../REGRESSION_TEST_REPORT.md), dedicated tests were implemented to verify that the global refactoring and React Hook order fixes (required by Biomejs) did not break existing functionality.

**Key validation items included:**
1.  **Hook Order Stability**: Moving `useCallback` and `useEffect` hooks in `TokiChat.tsx` to comply with the "Rules of Hooks" while maintaining the typewriter effect.
2.  **Memoization and Dependency Integrity**: Wrapping success handlers in `useCallback` within `OnboardingQuest.tsx` to prevent infinite re-renders.

The tests confirmed **100% functional parity** between the legacy code and the refactored Biome-compliant code.

### UI Test Language Unification
Originally, tests matched Korean UI strings (e.g., `안녕! 나는 토키야`). These were updated to match the English locale equivalents to ensure that the primary testing baseline remains consistent with the project's internationalization standards.
