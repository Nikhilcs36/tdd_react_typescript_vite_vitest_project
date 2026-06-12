import { describe, it, expect, afterEach } from 'vitest';
import { initializeTheme } from './main';

describe('Document Title', () => {
  it('should set the document title to "Login Tracking Dashboard"', () => {
    expect(document.title).toBe('Login Tracking Dashboard');
  });
});

describe('Theme Initialization', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('should add "dark" class to html element if theme is "dark" in localStorage', () => {
    localStorage.setItem('theme', 'dark');
    initializeTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should not add "dark" class to html element if theme is not "dark" in localStorage', () => {
    localStorage.setItem('theme', 'light');
    initializeTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should not add "dark" class to html element if theme is not in localStorage', () => {
    initializeTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
