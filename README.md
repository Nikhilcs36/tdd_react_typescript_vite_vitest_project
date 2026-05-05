# TDD React TypeScript Vite Vitest Frontend - Login Tracking Dashboard

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Description

This repository contains the frontend code for a comprehensive **Login Tracking Dashboard** built using React 18, TypeScript, Vite, and Vitest. The project is developed using **Test-Driven Development (TDD)** methodology and provides an interactive, responsive user interface for monitoring user login activities, viewing analytics dashboards, and managing authentication flows. This frontend seamlessly integrates with the [backend REST API](https://github.com/Nikhilcs36/tdd_backend_python_django_project) to deliver real-time login tracking and dashboard functionality.

The primary focus of this project is the **Login Tracking Dashboard**, which offers real-time analytics and statistics about user login behavior, trends, and patterns through interactive charts, data tables, and comprehensive filtering capabilities. The system includes secure JWT authentication, role-based access control, internationalization, dark mode support, and comprehensive error handling.

## Development Methodology: Test-Driven Development (TDD)

This project was built using **Test-Driven Development (TDD)**, a software development approach where tests are written before the actual implementation code. The TDD process follows a simple cycle:

1. **Write a failing test** that defines the desired functionality
2. **Write the minimum code** necessary to make the test pass
3. **Refactor the code** to improve design while keeping tests passing

### TDD Benefits in This Project:
- **High Code Quality**: Comprehensive test coverage ensures reliable functionality across all components, pages, services, and state management
- **Better Design**: Tests drive clean, modular architecture with well-defined interfaces
- **Regression Prevention**: Changes can be made confidently without breaking existing features
- **Documentation**: Tests serve as living documentation of system behavior
- **API Mocking**: MSW (Mock Service Worker) enables testing without a live backend

The TDD approach was particularly valuable for building the Login Tracking Dashboard, ensuring that all analytics features, chart rendering, data filtering, and API integrations work correctly and can be extended safely.

## Primary Feature: Login Tracking Dashboard

The **Login Tracking Dashboard** is the core feature of this application, providing:

- **Real-time Login Statistics**: Display user login counts, success/failure rates, and login frequency
- **Interactive Charts**: Visual charts using Chart.js showing login trends, comparisons, and distribution over time
- **Weekly/Monthly Analytics**: Detailed breakdown of login patterns by week and month with date range filters
- **User-specific Dashboard**: Individual users can view their own login activity and statistics
- **Admin Dashboard**: Comprehensive admin interface with user selection dropdown for viewing any user's analytics
- **Login Activity Table**: Detailed table of login events with status badges, timestamps, and IP addresses
- **Chart Mode Toggle**: Switch between different chart visualization modes
- **Custom Date Range Filters**: Flexible date range selection for targeted analysis
- **User Selection**: Admin users can select specific users to view their login analytics

## Features

### Login Tracking & Analytics
- **Real-time Login Statistics**: Track total logins, login frequency, success and failed attempts
- **Weekly/Monthly Analytics**: Detailed breakdown of login patterns by week and month
- **Login Trends**: Interactive Chart.js charts showing login trends over time including success rates
- **User-specific Dashboard**: Individual users can view their own login activity including success/failure rates
- **Admin Dashboard**: Comprehensive admin interface with user management capabilities
- **Login Comparison**: Compare login activities across different time periods
- **Distribution Analysis**: Analyze login distribution by time of day, day of week, etc.
- **Login Attempt Analytics**: Monitor login success and failure rates, including attempt patterns
- **Custom Date Range Filters**: Filter dashboard data by specific date ranges for flexible analysis
- **User Selector Dropdown**: Admin users can switch between different users' dashboards
- **Chart Mode Toggle**: Toggle between different chart visualization modes

### User Management
- **User Registration**: Secure sign-up form with client-side validation
- **User Login**: JWT-based authentication with token management
- **Profile Management**: View and edit user profiles with image upload support
- **User List**: Admin-only user list with pagination and user details
- **User Details**: Individual user page with profile information
- **Account Activation**: Email-based account activation flow
- **Email Verification**: Token-based email verification
- **Password Reset**: Secure password reset with token validation

### User Access Levels Comparison

| Feature | Regular User | Admin User |
|---------|-------------|------------|
| View own login statistics | ✅ | ✅ |
| View own login activity | ✅ | ✅ |
| View own dashboard charts | ✅ | ✅ |
| Access personal dashboard | ✅ | ✅ |
| Edit own profile | ✅ | ✅ |
| View all users' statistics | ❌ | ✅ |
| View all login activities | ❌ | ✅ |
| Access admin dashboard | ❌ | ✅ |
| View user-specific analytics | ❌ | ✅ |
| View other user profiles | ❌ | ✅ |
| Access user list | ❌ | ✅ |
| View any user's dashboard | ❌ | ✅ |
| Use user selector dropdown | ❌ | ✅ |

### Authentication & Security
- **JWT Token Authentication**: Secure token-based authentication with access and refresh tokens
- **Protected Routes**: Route guards that redirect unauthenticated users to the home page
- **Role-based Access**: Admin-only routes protected with `ProtectedRoute` component
- **Token Management**: Automatic token refresh via axios interceptors on 401 responses
- **Secure Token Storage**: Tokens stored in Redux state (in-memory) with encrypted localStorage backup via Secure-LS
- **Session Persistence**: Auth state persisted across page refreshes using sessionStorage
- **Automatic Token Invalidation**: Tokens cleared on logout with Redux state cleanup
- **Axios Interceptors**: Language-aware API headers (Accept-Language) and authorization header management

### Internationalization (i18n)
- **Multi-language Support**: Complete translations for English (EN), Malayalam (ML), and Arabic (AR)
- **Language Switcher**: Navbar language toggle with active language highlighting
- **RTL Support**: Right-to-left direction support for Arabic language
- **Translation Coverage**: All UI text including navigation, forms, dashboards, charts, error messages, and footer
- **Dynamic Language Switching**: Instant language change without page reload
- **Extensible Translation System**: Easy to add new languages via i18n configuration

### Dark Mode
- **Theme Switcher**: Toggle between light and dark themes
- **Persistent Theme**: Theme preference saved to localStorage
- **Tailwind CSS Dark Mode**: Implemented using Tailwind's `class` strategy with custom dark color palette
- **Global Theme Initialization**: Theme applied before React hydration to prevent flash
- **Consistent Styling**: All components support dark mode with appropriate color schemes

### Error Handling
- **React Error Boundary**: Catches rendering errors and displays a fallback UI with retry capability
- **Global Error Display**: Centralized error display component for API errors
- **Django Error Parsing**: Specialized error handler for Django REST Framework error responses
- **API Error Interceptors**: Global axios interceptor for handling API errors
- **User-friendly Messages**: All errors translated into user-friendly messages in the active language
- **Logging Service**: Centralized error logging for debugging and monitoring
- **Error States**: Components handle loading, error, and empty states gracefully

### State Management
- **Redux Toolkit**: Centralized state management with slices
- **Auth Slice**: Manages authentication state, tokens, and user session
- **Dashboard Slice**: Manages dashboard filters, chart modes, and UI state
- **User Slice**: Manages user profile data and updates
- **Global Error Slice**: Manages global application errors
- **Redux DevTools**: Support for debugging state changes
- **State Persistence**: Auth state persisted with validation and security checks

### API Service Layer — Dual Implementation (Axios + Fetch)
- **Axios (Production)**: Configured HTTP client with interceptors for auth headers, language headers, and error handling. Used in development and production for all API calls against the live Django backend
- **Fetch (Testing)**: Native `fetch()` implementation of every service for MSW compatibility. MSW's Node.js server (`setupServer`) intercepts `fetch()` but not `axios` in the Vitest environment, so parallel fetch-based implementations exist to enable wire-level API mocking without `vi.mock()` hacks
- **Environment-aware Switching**: The service layer detects the test environment via `import.meta.env.VITEST`. When running under Vitest, the fetch implementation is used; otherwise, the Axios implementation is active. Calling code remains identical in both environments
- **Service Functions**: Modular API service functions for each backend endpoint (18+ axios/fetch pairs)
- **Django Pagination Support**: API services handle Django-style paginated responses with `count`, `next`, `previous`, and `results` fields
- **Login Tracking Service**: Specialized service for dashboard analytics endpoints with date range filtering and user selection
- **Token Service**: Token refresh and management utilities using Axios interceptors for automatic 401 recovery
- **Test Services**: Axios instance without global interceptors for testing component-level error handling in isolation
- **Shared Error Handling**: Both implementations route through the same `handleApiError()` utility, ensuring consistent error processing regardless of HTTP client

### Testing
- **Comprehensive Test Suite**: Unit tests, component tests, and integration tests
- **Vitest**: Fast test runner integrated with Vite
- **React Testing Library**: Component testing with user-centric queries
- **MSW (Mock Service Worker)**: API mocking for testing without a live backend
- **Redux Store Tests**: Test slices, reducers, and state persistence
- **Service Layer Tests**: Test API services, error handling, and token management
- **i18n Tests**: Language switching and translation coverage
- **Routing Tests**: Route protection and navigation behavior
- **Pagination Tests**: User list pagination functionality
- **Dashboard Tests**: Chart data, filters, and login activity tables

### Docker Support
- **Containerized Development**: Docker and Docker Compose setup for consistent development environment
- **Hot Reload**: Source code mounted for live updates inside the container
- **Shared Network**: External network configuration for connecting with backend container
- **Node Volume**: Named volume for `node_modules` to prevent host/container conflicts

### Development Tooling
- **TypeScript**: Strict type checking with full type safety
- **ESLint**: TypeScript-aware linting with React hooks rules
- **Twin Macro**: CSS-in-JS with Tailwind CSS utility classes
- **Styled Components**: Component-scoped styling
- **PostCSS**: CSS transformation and optimization
- **Vite HMR**: Blazing-fast hot module replacement during development

## Tech Stack

### Core Technologies
- **React 18** - Modern UI library with hooks and functional components
- **TypeScript 5** - Type-safe JavaScript for robust development
- **Vite 6** - Next-generation build tool with HMR (Hot Module Replacement)
- **Vitest 2** - Blazing-fast unit test framework with Vite integration

### State Management & Data Fetching
- **Redux Toolkit 2** - Centralized state management with slices and reducers
- **React Redux 9** - React bindings for Redux
- **Axios** - Promise-based HTTP client with interceptors (production API calls)
- **Native `fetch()`** - Browser Fetch API (MSW-compatible test implementation)

### Routing
- **React Router v7** - Client-side routing with nested routes, route guards, and navigation

### Styling & UI
- **Tailwind CSS 3** - Utility-first CSS framework
- **Twin Macro** - CSS-in-JS with Tailwind integration
- **Styled Components 6** - Component-scoped CSS-in-JS
- **Chart.js 4** - Interactive chart visualizations
- **react-chartjs-2** - React components for Chart.js

### Internationalization
- **i18next** - Internationalization framework
- **react-i18next** - React bindings for i18next

### Testing
- **Vitest 2** - Test runner
- **@testing-library/react** - React component testing
- **@testing-library/dom** - DOM testing utilities
- **@testing-library/user-event** - User event simulation
- **MSW 2** - API mocking
- **jsdom** - DOM environment for tests
- **jest-styled-components** - Styled component testing utilities

### Development & Quality
- **ESLint** - Code linting with TypeScript support
- **TypeScript ESLint** - TypeScript-aware linting rules
- **PostCSS** - CSS transformation tooling
- **Autoprefixer** - CSS vendor prefixing
- **Babel Macros** - Macro support for styled-components and twin.macro

### Security
- **Secure-LS** - Encrypted localStorage for sensitive data

### Deployment & Infrastructure
- **Docker** - Containerized development environment
- **Docker Compose** - Multi-container orchestration

## Installation

### Recommended Approach: Docker Deployment

**Docker is the recommended approach** for running this application as it provides consistent environments and easier setup. Docker ensures that all dependencies are properly managed and the application runs reliably across different systems.

#### Prerequisites
- Docker and Docker Compose
- Shared Docker network (for connecting with backend)

#### Docker Setup

**Create the shared network (one-time setup)**:
```bash
docker network create tdd-network
```

**Build and run the frontend container**:
```bash
docker-compose up --build
```

**Access the application**: [http://localhost:5173](http://localhost:5173)

#### Docker Commands

| Command | Action |
|---------|--------|
| `docker compose up` | Start container |
| `docker compose down` | Stop container |
| `docker compose up --build` | Rebuild after package.json changes |
| `docker compose run --rm frontend npm run test -- --run` | Run tests in container |
| `docker compose run --rm frontend npm run lint` | Run linter in container |

### Alternative: Local Development Setup

This setup is optional and can be used if you prefer running the application directly on your system.

#### Prerequisites
- Node.js 18+
- npm or yarn

1. **Clone the repository**:
```bash
git clone https://github.com/Nikhilcs36/tdd_react_typescript_vite_vitest_project.git
cd tdd_react_typescript_vite_vitest_project
```

2. **Install dependencies**:
```bash
npm install
```

3. **Start the development server**:
```bash
npm run dev
```

4. **Access the application**: [http://localhost:5173](http://localhost:5173)

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server with HMR |
| `npm run build` | TypeScript check and production build |
| `npm run test` | Run Vitest test suite |
| `npm run lint` | ESLint code analysis |
| `npm run preview` | Preview production build locally |

## Project Structure

```
├── src/
│   ├── assets/                    # Static assets (images, icons)
│   │   ├── TDD-Development-Cycle.png
│   │   ├── User-Authentication-Flow.png
│   │   ├── Application-Data-Flow.png
│   │   └── profile.png
│   ├── components/                # Reusable React components
│   │   ├── common/                # Shared components
│   │   │   ├── Layout.tsx         # Standardized layout components
│   │   │   └── Loading.tsx        # Loading spinner component
│   │   ├── dashboard/             # Dashboard-specific components
│   │   │   ├── ChartModeToggle.tsx       # Chart visualization mode toggle
│   │   │   ├── DashboardContainer.tsx    # Main dashboard container
│   │   │   ├── DashboardFilters.tsx      # Dashboard filter controls
│   │   │   ├── DashboardUserList.tsx     # User list selector for admin
│   │   │   ├── DateRangePicker.tsx       # Date range selection
│   │   │   ├── LoginActivityTable.tsx    # Login events data table
│   │   │   ├── LoginTrendsChart.tsx      # Login trends chart
│   │   │   ├── UserDashboardCard.tsx     # User stats summary card
│   │   │   └── UserSelectorDropdown.tsx  # User selection dropdown
│   │   ├── logout/                # Logout components
│   │   │   ├── LogoutMessage.tsx  # Logout confirmation message
│   │   │   └── useLogout.ts       # Logout hook with API integration
│   │   ├── navbar/                # Navigation components
│   │   ├── ErrorBoundary.tsx      # React error boundary
│   │   ├── ErrorBoundaryDisplay.tsx      # Error fallback UI
│   │   ├── GlobalErrorDisplay.tsx        # Global error notifications
│   │   ├── Pagination.tsx                 # Reusable pagination component
│   │   ├── ThemeSwitcher.tsx              # Dark/light theme toggle
│   │   ├── UserList.tsx                   # User list with pagination
│   │   └── UserListItem.tsx               # Individual user list item
│   ├── locale/                    # Internationalization files
│   │   └── i18n.ts                # i18n configuration
│   ├── page/                      # Page-level components
│   │   ├── HomePage.tsx           # Landing/home page
│   │   ├── LoginPage.tsx          # Login page with form validation
│   │   ├── SignUpPage.tsx         # Registration page
│   │   ├── ProfilePage.tsx        # User profile view/edit page
│   │   ├── UserPage.tsx           # Individual user detail page
│   │   ├── UserListPage.tsx       # Admin user list page
│   │   ├── accountActivationPage.tsx     # Account activation
│   │   ├── VerifyEmailPage.tsx           # Email verification
│   │   └── ResetPasswordPage.tsx         # Password reset
│   ├── services/                  # API service layer
│   │   ├── apiService.ts          # API service implementations (Axios + Fetch)
│   │   ├── apiEndpoints.ts        # API endpoint constants
│   │   ├── loginTrackingService.ts       # Dashboard analytics service
│   │   ├── tokenService.ts        # Token management and refresh
│   │   ├── errorService.ts        # Error handling and mapping
│   │   ├── loggingService.ts      # Error logging utility
│   │   ├── defaultService.ts      # Default mock service for testing
│   │   └── testApiService.ts      # Test Axios instance
│   ├── store/                     # Redux state management
│   │   ├── index.ts               # Store configuration with persistence
│   │   ├── rootReducer.ts         # Combined reducer
│   │   ├── actions.ts             # Action creators
│   │   ├── types.ts               # Action type constants
│   │   ├── authSlice.ts           # Authentication state slice
│   │   ├── dashboardSlice.ts      # Dashboard UI state slice
│   │   ├── globalErrorSlice.ts    # Global error state slice
│   │   └── userSlice.ts           # User profile state slice
│   ├── styles/                    # Global styles and theme
│   │   └── GlobalStyles.tsx       # Global CSS-in-JS styles
│   ├── tests/                     # Test infrastructure
│   │   ├── setup.ts               # Vitest setup and configuration
│   │   ├── testUtils.ts           # Shared test utilities
│   │   └── mocks/                 # MSW handlers and mocks
│   │       ├── handlers.ts        # MSW request handlers
│   │       ├── server.ts          # MSW server configuration
│   │       ├── secureLsMock.ts    # Secure-LS mock
│   │       └── secureLsMockFactory.ts # Secure-LS mock factory
│   ├── types/                     # TypeScript type definitions
│   │   ├── apiError.ts            # API error types
│   │   ├── djangoPagination.ts    # Django pagination types
│   │   └── loginTracking.ts       # Login tracking data types
│   ├── utils/                     # Utility functions
│   │   ├── authorization.ts       # User authorization utilities
│   │   ├── dateUtils.ts           # Date formatting utilities
│   │   ├── djangoErrorHandler.ts  # Django error response parser
│   │   └── validationRules.ts     # Form validation rules
│   ├── App.tsx                    # Root application with routing
│   ├── App.test.tsx               # Root application tests
│   ├── main.tsx                   # Application entry point
│   ├── main.test.tsx              # Entry point tests
│   └── index.css                  # Global CSS with Tailwind directives
├── types/                         # Global type declarations
│   ├── eslint.d.ts                # ESLint package type declarations
│   ├── i18n.d.ts                  # i18next type customizations
│   └── twin.d.ts                  # Twin macro type declarations
├── Dockerfile                     # Docker development configuration
├── docker-compose.yml             # Docker Compose services
├── DOCKER_SETUP.md                # Docker setup instructions
├── FRONTEND_SETUP.md              # Frontend setup instructions
├── vite.config.ts                 # Vite build configuration
├── tsconfig.json                  # TypeScript configuration
├── tsconfig.app.json              # App-specific TypeScript config
├── tailwind.config.js             # Tailwind CSS customization
├── postcss.config.js              # PostCSS plugin configuration
└── eslint.config.js               # ESLint rules and plugins
```

## API Integration

The frontend communicates with the [backend REST API](https://github.com/Nikhilcs36/tdd_backend_python_django_project). The API service layer is configured in `src/services/`.

### API Endpoints Consumed

#### Authentication Endpoints
- `POST /api/user/token/` - Login
- `POST /api/user/token/refresh/` - Refresh token
- `POST /api/user/create/` - Register
- `GET /api/user/logout/` - Logout
- `POST /api/user/verify-email/` - Email verification
- `POST /api/user/resend-verification/` - Resend verification email
- `POST /api/user/password-reset/` - Request password reset
- `POST /api/user/reset-password/<token>/` - Reset password with token

#### User Management Endpoints
- `GET /api/user/me/` - Get current user profile
- `PUT /api/user/me/` - Update current user profile
- `GET /api/user/users/` - List all users (admin only)
- `GET /api/user/users/<id>/` - Get specific user details
- `PUT /api/user/users/<id>/` - Update user (admin)

#### Dashboard Endpoints
- `GET /api/user/dashboard/stats/` - User dashboard statistics
- `GET /api/user/dashboard/login-activity/` - User login activity
- `GET /api/user/dashboard/charts/trends/` - Login trends chart data
- `GET /api/user/dashboard/charts/comparison/` - Login comparison data
- `GET /api/user/dashboard/charts/distribution/` - Login distribution data

#### Admin Dashboard Endpoints
- `GET /api/user/admin/dashboard/` - Admin dashboard overview
- `GET /api/user/admin/charts/` - Admin charts data
- `GET /api/user/admin/dashboard/users/stats/` - Admin users statistics
- `GET /api/user/<user_id>/dashboard/stats/` - User-specific statistics (admin)
- `GET /api/user/<user_id>/dashboard/login-activity/` - User-specific login activity (admin)

### Authentication Flow

1. User submits credentials via login form
2. Backend returns JWT access and refresh tokens
3. Tokens are stored in Redux state and encrypted localStorage
4. Axios interceptor attaches `Authorization: JWT <token>` header to all requests
5. On 401 response, interceptor attempts token refresh
6. On logout, tokens are cleared from Redux and storage

## Testing

The project uses **Vitest** with **React Testing Library** for comprehensive testing.

### Test Structure

| Test Location | Description |
|---------------|-------------|
| `src/*.test.tsx` | Root app and entry point tests |
| `src/components/*.test.tsx` | Component-level tests |
| `src/components/dashboard/*.test.tsx` | Dashboard component tests |
| `src/components/dashboard/__tests__/` | Additional dashboard tests |
| `src/components/logout/*.test.tsx` | Logout component tests |
| `src/page/*.test.tsx` | Page-level integration tests |
| `src/store/*.test.ts` | Redux store and slice tests |
| `src/services/__tests__/` | Service layer tests |
| `src/services/*.test.ts` | Individual service tests |
| `src/utils/*.test.ts` | Utility function tests |
| `src/types/*.test.ts` | Type guard tests |
| `src/locale/*.test.ts` | i18n configuration tests |

### Running Tests

```bash
# Run all tests
npm run test
```

### Testing Tools
- **Vitest**: Fast test runner with Vite integration
- **React Testing Library**: Component testing with user-centric queries
- **MSW (Mock Service Worker)**: API mocking without mocking modules
- **jsdom**: Browser-like DOM environment
- **jest-styled-components**: Styled component assertion matchers

## Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite build, server proxy, and Vitest configuration |
| `tsconfig.json` | Base TypeScript configuration |
| `tsconfig.app.json` | App-specific TypeScript config with strict rules |
| `tsconfig.node.json` | Node-specific TypeScript config |
| `tailwind.config.js` | Tailwind CSS with dark mode and custom colors |
| `postcss.config.js` | PostCSS with Tailwind and Autoprefixer |
| `eslint.config.js` | ESLint flat config with TypeScript and React hooks |
| `Dockerfile` | Docker development image with Node.js |
| `docker-compose.yml` | Docker Compose with shared network |
| `.gitignore` | Git ignore rules |
| `.dockerignore` | Docker build context exclusions |

## Customization

### Styling
- Modify `tailwind.config.js` for theme colors and design tokens
- Update `src/styles/GlobalStyles.tsx` for global styles
- Component styles use `twin.macro` with Tailwind utilities

### Internationalization
- Configure i18next in `src/locale/i18n.ts`
- Add new language resources
- Update `src/App.tsx` language switcher buttons

### State Management
- Add new Redux slices in `src/store/`
- Extend root reducer in `src/store/rootReducer.ts`
- Add new action types in `src/store/types.ts`

### API Integration
- Add new endpoints in `src/services/apiEndpoints.ts`
- Implement service functions in `src/services/apiService.ts`
- Add type definitions in `src/types/`

### Routing
- Configure routes in `src/App.tsx`
- Add route guards with `ProtectedRoute` component
- Implement nested routes for dashboards

## License

This project is licensed under the MIT License - see the [MIT License](https://choosealicense.com/licenses/mit/) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new functionality (TDD approach)
4. Make your changes
5. Ensure all tests pass (`npm run test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Support

For support and questions, please contact nikhilcs36@gmail.com or open an issue in the GitHub repository.

## Acknowledgments

- Built with React 18 and TypeScript
- Powered by Vite for blazing-fast development
- Tested with Vitest and React Testing Library
- API mocking with Mock Service Worker (MSW)
- State management with Redux Toolkit
- Styled with Tailwind CSS and Twin Macro
- Charts with Chart.js and react-chartjs-2
- Internationalization with i18next
- Containerized with Docker