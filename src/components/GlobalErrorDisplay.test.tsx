import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import i18n from '../locale/i18n';
import GlobalErrorDisplay from './GlobalErrorDisplay';
import { clearGlobalError } from '../store/globalErrorSlice';

// Mock Redux store
const mockStore = configureStore([]);

describe('GlobalErrorDisplay', () => {
  it('renders nothing when there is no global error', () => {
    const store = mockStore({
      globalError: { error: null }
    });
    const { container } = render(
      <BrowserRouter>
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>
            <GlobalErrorDisplay />
          </I18nextProvider>
        </Provider>
      </BrowserRouter>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the error display when there is a global error', () => {
    const error = {
      message: 'Something went wrong on our end. Please try again later.',
      translationKey: 'errors.500.internal_server_error'
    };
    const store = mockStore({
      globalError: { error }
    });
    render(
      <BrowserRouter>
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>
            <GlobalErrorDisplay />
          </I18nextProvider>
        </Provider>
      </BrowserRouter>
    );
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong on our end. Please try again later.')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('dispatches clearGlobalError when "Try Again" is clicked', () => {
    const error = {
      message: 'Something went wrong on our end. Please try again later.',
      translationKey: 'errors.500.internal_server_error'
    };
    const store = mockStore({
      globalError: { error }
    });
    store.dispatch = vi.fn();

    render(
      <BrowserRouter>
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>
            <GlobalErrorDisplay />
          </I18nextProvider>
        </Provider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Try Again'));
    expect(store.dispatch).toHaveBeenCalledWith(clearGlobalError());
  });
});
