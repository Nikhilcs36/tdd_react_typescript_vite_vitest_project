// Type declarations for ESLint packages that lack TypeScript definitions
// This eliminates the need for @ts-ignore comments in eslint.config.js

declare module '@eslint/js' {
  const js: {
    configs: {
      recommended: import('eslint').Linter.Config;
      all: import('eslint').Linter.Config;
    };
  };
  export default js;
}

declare module 'globals' {
  const globals: {
    browser: Record<string, boolean>;
    node: Record<string, boolean>;
    es2020: Record<string, boolean>;
    es2021: Record<string, boolean>;
    commonjs: Record<string, boolean>;
  };
  export default globals;
}

declare module 'eslint-plugin-react-hooks' {
  const reactHooks: {
    configs: {
      recommended: {
        rules: Record<string, unknown>;
      };
    };
    rules: Record<string, unknown>;
  };
  export default reactHooks;
}

declare module 'eslint-plugin-react-refresh' {
  const reactRefresh: {
    rules: Record<string, unknown>;
  };
  export default reactRefresh;
}

declare module 'typescript-eslint' {
  import type { Linter } from 'eslint';
  
  interface TSESLint {
    config(...configs: unknown[]): Linter.Config[];
    configs: {
      recommended: Linter.Config[];
      strict: Linter.Config[];
      stylistic: Linter.Config[];
    };
  }
  
  const tseslint: TSESLint;
  export default tseslint;
}
