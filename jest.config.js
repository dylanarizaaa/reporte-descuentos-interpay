// @ts-check
const { createCjsPreset } = require('jest-preset-angular/presets');

/**
 * Pruebas unitarias con Jest + jest-preset-angular (Angular sin zone.js).
 * Las pruebas están en `src/`. La cobertura mide `src/app` y también los componentes de spartan.ng
 * de `libs/ui` (el pipeline los cuenta): se cubren con las pruebas de las pantallas que los usan,
 * así que en `libs/ui` solo deben quedar los componentes que la app usa.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  ...createCjsPreset({ testEnvironment: 'jest-preset-angular/environments/jest-jsdom-env' }),
  // `libs` también es raíz para que la cobertura incluya sus archivos aunque ninguna prueba los importe.
  roots: ['<rootDir>/src', '<rootDir>/libs'],
  // Además de los `.mjs` del preset, TanStack publica ESM en `.js` (sirve para npm y pnpm).
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@angular/common/locales/.*\\.js$|.*@tanstack/.*\\.js$))',
  ],
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/libs/', '<rootDir>/dist/'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    // Mismos alias que `tsconfig.json` (componentes de spartan.ng en `libs/ui`).
    '^@spartan-ng/helm/(.*)$': '<rootDir>/libs/ui/$1/src/index.ts',
  },
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.spec.ts',
    '!src/app/**/*.routes.ts',
    '!src/app/app.config.ts',
    'libs/ui/**/*.ts',
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageDirectory: '<rootDir>/coverage',
};
