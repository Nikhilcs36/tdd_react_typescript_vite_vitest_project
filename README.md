# Front-End Development: Test-Driven Development (TDD) with React, TypeScript, Vite, and Vitest

### Status: Work in Progress

## Description

The objective of this project is to build a robust front-end application while strictly following TDD methodologies. The approach ensures high-quality code by writing tests before implementing features.

## Tech Stack

- **React**: Library for building user interfaces
- **TypeScript**: Enhances JavaScript with static typing
- **Vite**: Fast and lightweight build tool
- **Vitest**: Testing framework optimized for Vite

## Features

- 🧪 Test-first development process
- ⚡ Fast builds and hot module replacement with Vite
- 🔒 Type safety with TypeScript

## How to Run

1. Clone the repository:
   ```bash
   git clone https://github.com/Nikhilcs36/tdd_react_typescript_vite_vitest_project.git
   ```
2. Navigate to the project directory:
   ```bash
   cd tdd_react_typescript_vite_vitest_project
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Run tests:
   ```bash
   npm run test
   ```

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
## License

This project is licensed under the [MIT License](LICENSE).
