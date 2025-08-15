import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AppContext } from './AppContext';
import { Settings } from '../types';

type UserPreferences = Pick<Settings, 'theme' | 'language' | 'currency' | 'timeZone'>;

interface UserPreferencesContextType {
  preferences: UserPreferences;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state: appState } = useContext(AppContext);
  const { settings, currentUser } = appState;

  const [preferences, setPreferencesState] = useState<UserPreferences>({
    theme: settings.theme,
    language: settings.language,
    currency: settings.currency,
    timeZone: settings.timeZone,
  });

  // Load preferences from localStorage when user changes
  useEffect(() => {
    if (currentUser) {
      try {
        const savedPrefs = localStorage.getItem(`userPrefs_${currentUser.id}`);
        if (savedPrefs) {
          setPreferencesState(JSON.parse(savedPrefs));
        } else {
          // If no saved prefs, initialize with global settings
          setPreferencesState({
            theme: settings.theme,
            language: settings.language,
            currency: settings.currency,
            timeZone: settings.timeZone,
          });
        }
      } catch (e) {
        console.error("Failed to load user preferences", e);
        // Fallback to global settings on error
        setPreferencesState({
            theme: settings.theme,
            language: settings.language,
            currency: settings.currency,
            timeZone: settings.timeZone,
        });
      }
    }
  }, [currentUser, settings]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(`userPrefs_${currentUser.id}`, JSON.stringify(preferences));
      } catch (e) {
        console.error("Failed to save user preferences", e);
      }
    }
  }, [preferences, currentUser]);

  const setPreferences = (newPrefs: Partial<UserPreferences>) => {
    setPreferencesState(prev => ({ ...prev, ...newPrefs }));
  };

  return (
    <UserPreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};

// Also export the context directly for safe consumption in useTranslation
export { UserPreferencesContext };
