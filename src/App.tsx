import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { I18nextProvider, useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useMemo } from "react";
import i18n from "./locale/i18n";
import SignUpPage from "./page/SignUpPage";
import HomePage from "./page/HomePage";
import LoginPage from "./page/LoginPage";
import UserPageWrapper from "./page/UserPage";
import ProfilePageWrapper from "./page/ProfilePage";
import AccountActivationPage from "./page/accountActivationPage";
import VerifyEmailPage from "./page/VerifyEmailPage";
import ResetPasswordPage from "./page/ResetPasswordPage";
import UserListPage from "./page/UserListPage";
import DashboardContainer from "./components/dashboard/DashboardContainer";
import {
  axiosApiServiceActivation,
  axiosApiServiceGetUser,
  axiosApiServiceGetCurrentUser,
  axiosApiServiceLogin,
  axiosApiServiceSignUp,
  axiosApiServiceUpdateUser,
  axiosApiServiceLogout,
  axiosApiServiceVerifyEmail,
  axiosApiServiceResendVerification,
  axiosApiServiceResetPassword,
  ApiService,
} from "./services/apiService";
import tw from "twin.macro";
import { Provider, useSelector } from "react-redux";
import store, { RootState } from "./store";
import { useLogout } from "./components/logout/useLogout";
import { useUserAuthorization } from "./utils/authorization";
import LogoutMessage from "./components/logout/LogoutMessage";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalErrorDisplay from "./components/GlobalErrorDisplay";
import { ReactElement } from "react";

// Navbar styled components
const NavBar = tw.nav`
  bg-gray-400
  dark:bg-dark-secondary
  text-white
  dark:text-dark-text
  py-4
  px-4
  sm:px-6
  flex
  flex-col
  xl:flex-row
  xl:justify-between
  items-center
  fixed
  w-full
  top-0
  z-20
  shadow-lg
`;
const NavRow = tw.div`flex items-center gap-2 sm:gap-4 lg:gap-6`;
// Scrollable variant of NavRow - only used for Malayalam language
const NavRowScrollable = tw.div`
  flex
  items-center
  gap-2 sm:gap-4 lg:gap-6
  overflow-x-auto
  flex-nowrap
  scroll-smooth
  max-w-full
  xl:max-w-none
  [-ms-overflow-style:none]
  [scrollbar-width:none]
`;
const NavRowScrollWrapper = tw.div`relative max-w-full w-full xl:w-auto`;
const ScrollArrow = tw.button`
  absolute top-1/2 -translate-y-1/2 z-10
  w-6 h-6 flex items-center justify-center
  rounded-full bg-gray-500/80 text-white text-sm shadow-md
  hover:bg-gray-600 transition-all duration-200 cursor-pointer
`;
const MobileMenu = tw.div`md:hidden absolute top-full left-0 right-0 bg-gray-400 dark:bg-dark-secondary shadow-lg py-2 px-4 flex flex-col gap-2`;
const NavLink = tw(Link)`
  font-semibold
  cursor-pointer
  px-3
  sm:px-4
  py-1.5
  sm:py-2
  rounded-lg
  border
  border-transparent
  hover:border-white/50
  hover:bg-white/10
  transition-all
  duration-200
  text-sm
  sm:text-base
`;
const StyledButton = tw.button`
  font-semibold
  cursor-pointer
  px-3
  sm:px-4
  py-1.5
  sm:py-2
  rounded-lg
  border
  border-transparent
  hover:border-white/50
  hover:bg-white/10
  transition-all
  duration-200
  text-sm
  sm:text-base
`;
const NavItemSeparator = tw.span`border-r border-white/20 mx-1 sm:mx-2 h-6 self-center`;
const Content = tw.div`
  mt-28
  xl:mt-16
  dark:bg-dark-primary
  min-h-[calc(100vh-7rem)]
  xl:min-h-[calc(100vh-4rem)]
`;
const Footer = tw.footer`
  bg-gray-200
  dark:bg-dark-secondary
  text-gray-600
  dark:text-gray-400
  py-4
  px-4
  text-center
  text-sm
`;
const LanguageButton = tw.button`px-2 py-1 text-xs font-medium rounded transition-colors`;

// Protected Route Component for admin-only routes
interface ProtectedRouteProps {
  children: ReactElement;
  requireAdmin?: boolean;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireAuth = true
}) => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const { isAdmin } = useUserAuthorization();
  const { t } = useTranslation();

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check admin requirement
  if (requireAdmin && (!isAuthenticated || !isAdmin())) {
    if (!isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="py-8 text-center text-red-500 dark:text-red-400">
          {t("userlist.accessDeniedMessage")}
        </div>
      </div>
    );
  }

  return children;
};

interface AppContentProps {
  logoutApiService?: ApiService;
}

export const AppContent = ({
  logoutApiService = axiosApiServiceLogout,
}: AppContentProps) => {
  const { t } = useTranslation();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const { isAdmin } = useUserAuthorization();
  const { logout: logoutUser } = useLogout(logoutApiService);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme || "light") as "light" | "dark";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const navRow2Ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleThemeSwitch = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setMobileMenuOpen(false);
  };

  const currentLang = i18n.language;

  // Memoize navLinks to prevent useEffect from running on every render
  const navLinks = useMemo(() => {
    const active = (path: string) => {
      if (path === "/") return location.pathname === "/";
      return location.pathname.startsWith(path);
    };
    return isAuthenticated ? (
      <>
        <NavLink to="/dashboard" data-testid="dashboard-link" className={active("/dashboard") ? "border-white/50 bg-white/10" : ""}>
          {t("dashboard.title")}
        </NavLink>
        <NavItemSeparator />
        <NavLink to="/profile" data-testid="my-profile-link" className={active("/profile") ? "border-white/50 bg-white/10" : ""}>
          {t("myProfile")}
        </NavLink>
        {isAdmin() && (
          <>
            <NavItemSeparator />
            <NavLink to="/users" data-testid="users-link" className={active("/users") ? "border-white/50 bg-white/10" : ""}>
              {t("userlist.title")}
            </NavLink>
          </>
        )}
        <NavItemSeparator />
        <StyledButton onClick={logoutUser} data-testid="logout-link">
          {t("logout.title")}
        </StyledButton>
      </>
    ) : (
      <>
        <NavLink to="/signup" data-testid="signup-link" className={active("/signup") ? "border-white/50 bg-white/10" : ""}>
          {t("signup.title")}
        </NavLink>
        <NavItemSeparator />
        <NavLink to="/login" data-testid="login-link" className={active("/login") ? "border-white/50 bg-white/10" : ""}>
          {t("login.title")}
        </NavLink>
      </>
    );
  }, [isAuthenticated, isAdmin, t, location.pathname, logoutUser]);

  // Track scroll position for Malayalam scrollable row
  useEffect(() => {
    if (currentLang !== 'ml') return;
    const el = navRow2Ref.current;
    if (!el) return;

    const check = () => {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    };

    check();
    el.addEventListener('scroll', check);
    const observer = new ResizeObserver(check);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', check);
      observer.disconnect();
    };
  }, [currentLang, navLinks]);

  const scrollRow2 = (direction: 'left' | 'right') => {
    navRow2Ref.current?.scrollBy({
      left: direction === 'left' ? -200 : 200,
      behavior: 'smooth',
    });
  };

  // Dynamic mask based on arrow visibility: fade only on edges where scroll arrows are shown
  const maskGradient = useMemo(() => {
    if (currentLang !== 'ml') return 'none';
    if (canScrollLeft && canScrollRight) {
      return 'linear-gradient(to right, transparent 0.5rem, black 1.5rem, black calc(100% - 1.5rem), transparent calc(100% - 0.5rem))';
    }
    if (canScrollLeft) {
      return 'linear-gradient(to right, transparent 0.5rem, black 1.5rem)';
    }
    if (canScrollRight) {
      return 'linear-gradient(to right, black calc(100% - 1.5rem), transparent calc(100% - 0.5rem))';
    }
    return 'none';
  }, [currentLang, canScrollLeft, canScrollRight]);

  return (
    <I18nextProvider i18n={i18n}>
      <GlobalErrorDisplay />
      <NavBar data-testid="navbar">
        {/* Row 1: Home + ThemeSwitcher + Language switcher */}
        <NavRow data-testid="nav-row-1">
          <NavLink to="/" title="Home" data-testid="home-link" className={location.pathname === "/" ? "border-white/50 bg-white/10" : ""}>
            {t("home")}
          </NavLink>
          <NavItemSeparator />
          <ThemeSwitcher onClick={handleThemeSwitch} theme={theme} />
          <NavItemSeparator />
          <LanguageButton
            onClick={() => changeLanguage("en")}
            className={currentLang === "en" ? "bg-white/30 text-white" : "text-white/80 hover:bg-white/20"}
            data-testid="lang-en"
          >
            EN
          </LanguageButton>
          <LanguageButton
            onClick={() => changeLanguage("ml")}
            className={currentLang === "ml" ? "bg-white/30 text-white" : "text-white/80 hover:bg-white/20"}
            data-testid="lang-ml"
          >
            ML
          </LanguageButton>
          <LanguageButton
            onClick={() => changeLanguage("ar")}
            className={currentLang === "ar" ? "bg-white/30 text-white" : "text-white/80 hover:bg-white/20"}
            data-testid="lang-ar"
          >
            AR
          </LanguageButton>
        </NavRow>
        {/* Row 2: Page header nav links - scrollable only for Malayalam language */}
        {currentLang === 'ml' ? (
          <NavRowScrollWrapper data-testid="nav-row-2-wrapper-ml">
            {canScrollLeft && (
              <ScrollArrow onClick={() => scrollRow2('left')} style={{ left: 0, transform: 'translate(-50%, -50%)' }} data-testid="scroll-left-arrow">
                ‹
              </ScrollArrow>
            )}
            <NavRowScrollable ref={navRow2Ref} data-testid="nav-row-2" style={{ maskImage: maskGradient, WebkitMaskImage: maskGradient }}>
              {navLinks}
            </NavRowScrollable>
            {canScrollRight && (
              <ScrollArrow onClick={() => scrollRow2('right')} style={{ right: 0, transform: 'translate(50%, -50%)' }} data-testid="scroll-right-arrow">
                ›
              </ScrollArrow>
            )}
          </NavRowScrollWrapper>
        ) : (
          <NavRow data-testid="nav-row-2">
            {navLinks}
          </NavRow>
        )}
        {/* Mobile hamburger button - hidden in jsdom (no media query support), visible on real mobile */}
        <button
          className="hidden p-2 text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="mobile-menu-toggle"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        {/* Mobile menu - shown conditionally */}
        {mobileMenuOpen && (
          <MobileMenu data-testid="mobile-menu">
            {navLinks}
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/20">
              <LanguageButton
                onClick={() => changeLanguage("en")}
                className={currentLang === "en" ? "bg-white/30 text-white" : "text-white/80 hover:bg-white/20"}
              >
                English
              </LanguageButton>
              <LanguageButton
                onClick={() => changeLanguage("ml")}
                className={currentLang === "ml" ? "bg-white/30 text-white" : "text-white/80 hover:bg-white/20"}
              >
                മലയാളം
              </LanguageButton>
              <LanguageButton
                onClick={() => changeLanguage("ar")}
                className={currentLang === "ar" ? "bg-white/30 text-white" : "text-white/80 hover:bg-white/20"}
              >
                العربية
              </LanguageButton>
            </div>
          </MobileMenu>
        )}
      </NavBar>
      <Content>
        <ErrorBoundary>
          <LogoutMessage />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/signup"
              element={<SignUpPage apiService={axiosApiServiceSignUp} />}
            />
            <Route
              path="/login"
              element={<LoginPage apiService={axiosApiServiceLogin} />}
            />
            <Route
              path="/user/:id"
              element={
                <UserPageWrapper
                  ApiGetService={axiosApiServiceGetUser}
                  ApiPutService={axiosApiServiceUpdateUser}
                />
              }
            />
            <Route
              path="/profile"
              element={
                <ProfilePageWrapper
                  ApiGetService={axiosApiServiceGetCurrentUser}
                  ApiPutService={axiosApiServiceUpdateUser}
                />
              }
            />
            <Route
              path="/activate/:token"
              element={
                <AccountActivationPage apiService={axiosApiServiceActivation} />
              }
            />
            <Route
              path="/verify-email"
              element={
                <VerifyEmailPage 
                  apiService={axiosApiServiceVerifyEmail} 
                  resendApiService={axiosApiServiceResendVerification} 
                />
              }
            />
            <Route
              path="/reset-password/:token"
              element={
                <ResetPasswordPage apiService={axiosApiServiceResetPassword} />
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <UserListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireAuth={true}>
                  <DashboardContainer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/:userId"
              element={
                <ProtectedRoute requireAuth={true}>
                  <DashboardContainer />
                </ProtectedRoute>
              }
            />
          </Routes>
        </ErrorBoundary>
      </Content>
      <Footer data-testid="app-footer">
        <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
      </Footer>
    </I18nextProvider>
  );
};
// Production version with Router
const AppWithRouter = () => (
  <Router>
    <AppContent />
  </Router>
);
// Wrap the AppWithRouter with the Redux Provider
const App = () => (
  <Provider store={store}>
    <AppWithRouter />
  </Provider>
);

export default App; // Export the new App component