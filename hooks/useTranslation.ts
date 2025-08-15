import { useContext, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { translations } from '../translations';
import { UserPreferencesContext } from '../context/UserPreferencesContext';

// Define a type for the translation keys based on the 'en' locale.
export type TranslationKey = keyof typeof translations['en'];

const PLACEHOLDER_IMAGE_B64 = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiIgZmlsbD0iI0U1RTdFQiI+PC9yZWN0PjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ij48L2NpcmNsZT48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIj48L3BvbHlsaW5lPjwvc3ZnPg==';
export const PLACEHOLDER_IMAGE = `data:image/svg+xml;base64,${PLACEHOLDER_IMAGE_B64}`;

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  if (e.currentTarget.src !== PLACEHOLDER_IMAGE) {
      e.currentTarget.src = PLACEHOLDER_IMAGE;
      e.currentTarget.onerror = null; // prevent infinite loop if placeholder is also broken
  }
};


const formatDateInternal = (date: Date | string | undefined, lang: string, timeZone: string): string => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';

    const formatter = new Intl.DateTimeFormat(lang, {
      dateStyle: 'medium', // This provides a locale-sensitive format like "Dec 25, 2024" or "25 dec. 2024"
      timeZone,
    });
    return formatter.format(d);
};

const formatTimeInternal = (date: Date | string, lang: string, timeZone: string, options: Intl.DateTimeFormatOptions = {}): string => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString(lang, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone,
        ...options,
    });
};

const formatDateTimeInternal = (date: Date | string, lang: string, timeZone: string, timeOptions: Intl.DateTimeFormatOptions = {}): string => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    
    const time = formatTimeInternal(d, lang, timeZone, timeOptions);
    const fDate = formatDateInternal(d, lang, timeZone);
    return `${fDate}, ${time}`;
};

export const useTranslation = () => {
    const { state: appState } = useContext(AppContext);
    const userPreferencesContext = useContext(UserPreferencesContext); // Can be undefined if not logged in

    const language = userPreferencesContext?.preferences.language || appState.settings.language;
    const timeZone = userPreferencesContext?.preferences.timeZone || appState.settings.timeZone;
    const currency = userPreferencesContext?.preferences.currency || appState.settings.currency;

    const t = useCallback((key: TranslationKey, replacements?: {[key: string]: string | number}): string => {
        let text = translations[language]?.[key] || translations['en'][key] || key;
        
        if (replacements) {
            Object.keys(replacements).forEach(r_key => {
                const regex = new RegExp(`{${r_key}}`, 'g');
                text = text.replace(regex, String(replacements[r_key]));
            });
        }

        return text;
    }, [language]);

    const formatDate = useCallback((date: Date | string | undefined) => {
        return formatDateInternal(date, language, timeZone);
    }, [language, timeZone]);

    const formatTime = useCallback((date: Date | string, options: Intl.DateTimeFormatOptions = {}) => {
        return formatTimeInternal(date, language, timeZone, options);
    }, [language, timeZone]);

    const formatDateTime = useCallback((date: Date | string, timeOptions: Intl.DateTimeFormatOptions = {}) => {
        return formatDateTimeInternal(date, language, timeZone, timeOptions);
    }, [language, timeZone]);

    return { t, lang: language, formatDate, formatTime, formatDateTime, currency };
};