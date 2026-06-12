import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import GlobalStyles from './styles/GlobalStyles.tsx'

// Initialize theme before React hydration
export const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

initializeTheme();

document.title = 'Login Tracking Dashboard';

// Set favicon for browser tab
const faviconLink = document.createElement('link');
faviconLink.rel = 'icon';
faviconLink.type = 'image/svg+xml';
faviconLink.href = '/favicon.svg';
document.head.appendChild(faviconLink);

export const renderApp = () => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <GlobalStyles />
      <App />
    </StrictMode>,
  );
};

if (import.meta.env.MODE !== 'test') {
  renderApp();
}
