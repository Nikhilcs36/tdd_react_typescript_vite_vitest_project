import "@testing-library/jest-dom/vitest"
import { afterEach} from 'vitest'
import { cleanup } from '@testing-library/react'
import "jest-styled-components";

// runs a clean after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
})