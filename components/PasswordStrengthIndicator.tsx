import React, { useMemo } from 'react';
import { useTranslation, TranslationKey } from '../hooks/useTranslation';
import { passwordRequirements, getPasswordStrength, validatePassword } from '../utils/validation';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface PasswordStrengthIndicatorProps {
    password?: string;
    errors?: string[];
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password = '', errors = [] }) => {
    const { t } = useTranslation();
    const strength = useMemo(() => getPasswordStrength(password), [password]);
    
    const passwordCheck = useMemo(() => validatePassword(password), [password]);
    
    const strengthLevels = [
        { textKey: 'password_strength_weak', color: 'bg-red-500', width: '25%' },
        { textKey: 'password_strength_weak', color: 'bg-red-500', width: '25%' },
        { textKey: 'password_strength_medium', color: 'bg-yellow-500', width: '50%' },
        { textKey: 'password_strength_medium', color: 'bg-yellow-500', width: '50%' },
        { textKey: 'password_strength_strong', color: 'bg-green-500', width: '75%' },
        { textKey: 'password_strength_strong', color: 'bg-green-500', width: '75%' },
        { textKey: 'password_strength_very_strong', color: 'bg-green-500', width: '100%' },
    ];
    
    const currentStrength = strengthLevels[strength] || { textKey: 'password_strength_weak', color: 'bg-gray-200', width: '0%' };
    
    const requirements: { key: TranslationKey, fulfilled: boolean }[] = [
        { key: 'password_min_length', fulfilled: !passwordCheck.includes('password_min_length') },
        { key: 'password_uppercase', fulfilled: !passwordCheck.includes('password_uppercase') },
        { key: 'password_lowercase', fulfilled: !passwordCheck.includes('password_lowercase') },
        { key: 'password_number', fulfilled: !passwordCheck.includes('password_number') },
        { key: 'password_special', fulfilled: !passwordCheck.includes('password_special') },
        { key: 'password_english_only', fulfilled: !passwordCheck.includes('password_english_only') },
    ];

    return (
        <div className="space-y-3">
            <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{t('password_strength')}</span>
                    {password && <span className="text-sm font-bold">{t(currentStrength.textKey as TranslationKey)}</span>}
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${currentStrength.color}`}
                        style={{ width: currentStrength.width }}
                    ></div>
                </div>
            </div>
            
            <ul className="text-xs text-gray-600 dark:text-gray-400 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                {requirements.map(req => (
                     <li key={req.key} className={`flex items-center transition-colors ${password && req.fulfilled ? 'text-green-600 dark:text-green-400' : ''}`}>
                         {password && (
                            req.fulfilled ? <CheckIcon className="h-4 w-4 mr-2"/> : <XMarkIcon className="h-4 w-4 mr-2 text-red-500"/>
                         )}
                         {!password && <div className="h-4 w-4 mr-2"></div>}
                        {t(req.key, { length: passwordRequirements.minLength })}
                    </li>
                ))}
            </ul>
             {errors.includes('passwords_do_not_match') && <p className="text-red-500 text-sm">{t('passwords_do_not_match')}</p>}
        </div>
    );
};