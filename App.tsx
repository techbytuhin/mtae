

import React, { useContext, useEffect } from 'react';
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Purchases from './pages/Purchases';
import Users from './pages/Users';
import Files from './pages/Files';
import Dues from './pages/Dues';
import PCBuilder from './pages/PCBuilder';
import { AppContext } from './context/AppContext';
import Login from './pages/Login';
import { User, ActionType } from './types';
import Notifications from './pages/Notifications';
import { UserPreferencesProvider, useUserPreferences } from './context/UserPreferencesContext';
import ConnectedDevices from './pages/ConnectedDevices';
import ForgotPassword from './pages/ForgotPassword';

// Helper function to determine the default page for a user role
const getPostLoginRedirectPath = (role: User['role']) => {
    switch(role) {
        case 'admin':
        case 'sales_manager':
        case 'super_user':
            return '/'; // Dashboard
        case 'staff':
            return '/sales';
        case 'monitor':
            return '/'; // Dashboard
        default:
            return '/'; // A sensible fallback
    }
};


const AppWithPreferences: React.FC = () => {
  const { state } = useContext(AppContext);
  const { preferences } = useUserPreferences();
  
  const ProtectedRoute = ({ path, children }: { path: string, children: React.ReactElement }) => {
      const userRole = state.currentUser?.role;
      const { permissions, pcBuilderEnabled, purchasesEnabled } = state.settings;

      if (!userRole) {
          // This case is handled by the main App component, but as a safeguard:
          return <Navigate to="/login" replace />;
      }
      
      if (userRole === 'super_user') {
          return children;
      }

      const defaultPage = getPostLoginRedirectPath(userRole);

      // Special check for feature toggles
      if (path === '/pc-builder' && !pcBuilderEnabled) {
        return <Navigate to={defaultPage} replace />;
      }
      if (path === '/purchases' && !purchasesEnabled) {
        return <Navigate to={defaultPage} replace />;
      }
      
      const allowedRoles = permissions?.[path] ?? [];

      if (allowedRoles.includes(userRole)) {
          return children;
      }
      
      return <Navigate to={defaultPage} replace />;
  };

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'light-green', 'amber', 'rose', 'teal', 'slate', 'astra');
    
    // Apply theme from user preferences
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.add(preferences.theme || state.settings.theme);
    }
    
    // Apply font from global settings
    document.documentElement.style.setProperty('--font-family', `'${state.settings.fontFamily}', sans-serif`);

    // Apply language direction from user preferences
    document.documentElement.lang = preferences.language || state.settings.language;

    // Set body class for dark mode text/bg
    if(preferences.theme === 'dark') {
        document.body.className = 'bg-slate-900 text-gray-100';
    } else {
        document.body.className = 'bg-gray-50 text-gray-900';
    }
  }, [preferences.theme, preferences.language, state.settings.fontFamily, state.settings.theme]);
  
  const redirectPath = state.currentUser ? getPostLoginRedirectPath(state.currentUser.role) : '/';

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-300 ${preferences.theme === 'dark' ? 'dark' : ''}`}>
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        <Routes>
          <Route path="/" element={<ProtectedRoute path="/"><Dashboard /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute path="/products"><Products /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute path="/customers"><Customers /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute path="/suppliers"><Suppliers /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute path="/sales"><Sales /></ProtectedRoute>} />
          
          {state.settings.purchasesEnabled && 
            <Route path="/purchases" element={<ProtectedRoute path="/purchases"><Purchases /></ProtectedRoute>} />
          }
          
          <Route path="/reports" element={<ProtectedRoute path="/reports"><Reports /></ProtectedRoute>} />
          <Route path="/dues" element={<ProtectedRoute path="/dues"><Dues /></ProtectedRoute>} />

          {state.settings.pcBuilderEnabled &&
            <Route path="/pc-builder" element={<ProtectedRoute path="/pc-builder"><PCBuilder /></ProtectedRoute>} />
          }

          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<ProtectedRoute path="/settings"><Settings /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute path="/users"><Users /></ProtectedRoute>} />
          <Route path="/connected-devices" element={<ProtectedRoute path="/connected-devices"><ConnectedDevices /></ProtectedRoute>} />
          <Route path="/files" element={<ProtectedRoute path="/files"><Files /></ProtectedRoute>} />
          
          {/* Redirect logged-in users away from login, and all others to the main page */}
          <Route path="/login" element={<Navigate to={redirectPath} replace />} />
          <Route path="*" element={<Navigate to={redirectPath} replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};


const App: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);

  // This effect runs only once on startup to check for low stock and expiry
  useEffect(() => {
    // Scan for expiry and low stock on startup
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const today = new Date();

    state.products.forEach(p => {
        // Low stock check
        if (!p.isDeleted && p.stock > 0 && p.stock < 10) {
            dispatch({ type: ActionType.ADD_NOTIFICATION, payload: { type: 'low_stock', metadata: { productId: p.id, productName: p.name, stock: p.stock }} });
        }
        // Expiry check
        if (!p.isDeleted && p.expiryDate) {
            const expiry = new Date(p.expiryDate);
            if (expiry < today) {
                dispatch({ type: ActionType.ADD_NOTIFICATION, payload: { type: 'expiry_alert', metadata: { productId: p.id, productName: p.name, expiryDate: p.expiryDate }} });
            } else if (expiry < thirtyDaysFromNow) {
                 dispatch({ type: ActionType.ADD_NOTIFICATION, payload: { type: 'expiry_warning', metadata: { productId: p.id, productName: p.name, expiryDate: p.expiryDate }} });
            }
        }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <HashRouter>
      {!state.currentUser ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <UserPreferencesProvider>
          <AppWithPreferences />
        </UserPreferencesProvider>
      )}
    </HashRouter>
  );
};

export default App;