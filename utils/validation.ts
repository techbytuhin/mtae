import { TranslationKey } from '../hooks/useTranslation';

export const passwordRequirements = {
    minLength: 6,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
    englishOnly: true,
};

type PasswordRequirementKey = 
    | 'password_min_length' 
    | 'password_uppercase'
    | 'password_lowercase'
    | 'password_number'
    | 'password_special'
    | 'password_english_only';

export const validatePassword = (password: string): PasswordRequirementKey[] => {
    const errors: PasswordRequirementKey[] = [];
    if (password.length < passwordRequirements.minLength) {
        errors.push('password_min_length');
    }
    if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('password_uppercase');
    }
    if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('password_lowercase');
    }
    if (passwordRequirements.requireNumber && !/\d/.test(password)) {
        errors.push('password_number');
    }
    if (passwordRequirements.requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
        errors.push('password_special');
    }
    if (passwordRequirements.englishOnly && /[^ -~]/.test(password)) {
        errors.push('password_english_only');
    }
    return errors;
};

export const getPasswordStrength = (password: string): number => {
    let score = 0;
    if (!password) return 0;
    
    // Simple score based on length
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Add a point for variety
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    return Math.min(score, 6);
};