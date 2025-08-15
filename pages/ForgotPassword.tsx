import React, { useState, useContext, useMemo, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ActionType, User } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../context/ToastContext';
import { KeyIcon, EnvelopeIcon, DevicePhoneMobileIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { validatePassword } from '../utils/validation';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';

type RecoveryStep = 'identify' | 'choose' | 'verify' | 'reset';
const MAX_ATTEMPTS = 3;

const Stepper: React.FC<{ currentStep: RecoveryStep }> = ({ currentStep }) => {
    const { t } = useTranslation();
    const steps: { id: RecoveryStep; name: string }[] = [
        { id: 'identify', name: t('identify_step') },
        { id: 'choose', name: t('choose_step') },
        { id: 'verify', name: t('verify_step') },
        { id: 'reset', name: t('reset_step') },
    ];
    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <nav aria-label="Progress">
            <ol role="list" className="flex items-center">
                {steps.map((step, stepIdx) => (
                    <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                        {stepIdx < currentStepIndex ? (
                            <>
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="h-0.5 w-full bg-primary-600" />
                                </div>
                                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 hover:bg-primary-900">
                                    <CheckCircleIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                </div>
                            </>
                        ) : stepIdx === currentStepIndex ? (
                            <>
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="h-0.5 w-full bg-gray-200 dark:bg-gray-700" />
                                </div>
                                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary-600 bg-white dark:bg-gray-800" aria-current="step">
                                    <span className="h-2.5 w-2.5 rounded-full bg-primary-600" aria-hidden="true" />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="h-0.5 w-full bg-gray-200 dark:bg-gray-700" />
                                </div>
                                <div className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400">
                                    <span className="h-2.5 w-2.5 rounded-full bg-transparent" aria-hidden="true" />
                                </div>
                            </>
                        )}
                         <span className="absolute top-10 -ml-2 text-xs font-semibold text-gray-600 dark:text-gray-300 w-12 text-center">{step.name}</span>
                    </li>
                ))}
            </ol>
        </nav>
    );
};


const ForgotPassword = () => {
    const { state, dispatch } = useContext(AppContext);
    const { users } = state;
    const { t } = useTranslation();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [step, setStep] = useState<RecoveryStep>('identify');
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState('');
    const [foundUser, setFoundUser] = useState<User | null>(null);
    const [recoveryMethod, setRecoveryMethod] = useState<'phone' | 'email' | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [sentCode, setSentCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [verifyAttempts, setVerifyAttempts] = useState(0);

    const maskedPhone = useMemo(() => foundUser?.phone ? `+**...${foundUser.phone.slice(-3)}` : '', [foundUser]);
    const maskedEmail = useMemo(() => {
        if (!foundUser?.email) return '';
        const [local, domain] = foundUser.email.split('@');
        return `${local.slice(0, 2)}...${local.slice(-1)}@${domain}`;
    }, [foundUser]);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);
    
    const handleIdentify = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setTimeout(() => {
            const user = users.find(u => u.id.toLowerCase() === userId.toLowerCase());
            if (user) {
                setFoundUser(user);
                setStep('choose');
            } else {
                setError(t('user_not_found'));
            }
            setIsLoading(false);
        }, 500);
    };

    const handleSendCode = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setResendCooldown(30);
        setTimeout(() => {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setSentCode(code);
            setVerifyAttempts(0);
            console.log(`Password recovery code for ${foundUser?.name}: ${code}`);
            showToast(t('code_sent_to_console'), 'info');
            setStep('verify');
            setIsLoading(false);
        }, 500);
    };

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setTimeout(() => {
            if (verificationCode === sentCode) {
                setStep('reset');
            } else {
                const newAttempts = verifyAttempts + 1;
                setVerifyAttempts(newAttempts);
                if (newAttempts >= MAX_ATTEMPTS) {
                    showToast(t('too_many_attempts_error'), 'error');
                    setStep('identify'); setUserId(''); setFoundUser(null); setRecoveryMethod(null); setVerificationCode(''); setSentCode(''); setError('');
                } else {
                    setError(`${t('invalid_code')} ${t('verification_attempts_left', { attempts: MAX_ATTEMPTS - newAttempts })}`);
                }
            }
            setIsLoading(false);
        }, 500);
    };
    
    const handleReset = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setPasswordErrors([]);
        
        const validationErrors = validatePassword(newPassword);
        if (validationErrors.length > 0) {
            setPasswordErrors(validationErrors);
            setIsLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordErrors(['passwords_do_not_match']);
            setIsLoading(false);
            return;
        }

        setTimeout(() => {
            if (!foundUser) {
                setIsLoading(false);
                return;
            }
            
            dispatch({
                type: ActionType.RESET_USER_PASSWORD,
                payload: { userId: foundUser.id, newPassword: newPassword }
            });
            showToast(t('password_updated_success'), 'success');
            navigate('/login');
        }, 500);
    };

    const renderStep = () => {
        switch (step) {
            case 'identify':
                return (
                    <form onSubmit={handleIdentify} className="space-y-4">
                        <h2 className="text-xl font-semibold">{t('user_id')}</h2>
                        <input type="text" value={userId} onChange={e => setUserId(e.target.value)} placeholder="e.g., user1" required className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"/>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button type="submit" disabled={isLoading} className="w-full bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-primary-400">{isLoading ? t('thinking') : t('continue')}</button>
                    </form>
                );
            case 'choose':
                return (
                    <form onSubmit={handleSendCode} className="space-y-4">
                        <h2 className="text-xl font-semibold">{t('choose_recovery_method')}</h2>
                        <div className="space-y-2">
                            {foundUser?.phone && (
                                <label className="flex items-center p-3 border rounded-lg cursor-pointer has-[:checked]:bg-primary-50 has-[:checked]:border-primary-500 dark:has-[:checked]:bg-primary-900/50 dark:border-gray-600">
                                    <input type="radio" name="recoveryMethod" value="phone" onChange={() => setRecoveryMethod('phone')} required className="h-4 w-4 text-primary-600 focus:ring-primary-500"/>
                                    <span className="ml-3 flex items-center"><DevicePhoneMobileIcon className="h-5 w-5 mr-2" /> {t('send_code_to_phone', { phone: maskedPhone })}</span>
                                </label>
                            )}
                             {foundUser?.email && (
                                <label className="flex items-center p-3 border rounded-lg cursor-pointer has-[:checked]:bg-primary-50 has-[:checked]:border-primary-500 dark:has-[:checked]:bg-primary-900/50 dark:border-gray-600">
                                    <input type="radio" name="recoveryMethod" value="email" onChange={() => setRecoveryMethod('email')} required className="h-4 w-4 text-primary-600 focus:ring-primary-500"/>
                                    <span className="ml-3 flex items-center"><EnvelopeIcon className="h-5 w-5 mr-2" /> {t('send_code_to_email', { email: maskedEmail })}</span>
                                </label>
                            )}
                        </div>
                        <button type="submit" disabled={!recoveryMethod || isLoading} className="w-full bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-primary-400">{isLoading ? t('thinking') : t('send_verification_code')}</button>
                    </form>
                );
            case 'verify':
                const destination = recoveryMethod === 'phone' ? maskedPhone : maskedEmail;
                return (
                     <form onSubmit={handleVerify} className="space-y-4">
                        <h2 className="text-xl font-semibold">{t('verification')}</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('enter_code_sent_to', { destination })}</p>
                        <input type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} placeholder="123456" maxLength={6} required className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-center text-lg tracking-[0.5em]"/>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <button type="submit" disabled={isLoading} className="w-full bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-primary-400">{isLoading ? t('thinking') : t('verify_code')}</button>
                        <button type="button" onClick={handleSendCode} disabled={resendCooldown > 0 || isLoading} className="w-full text-sm text-center text-primary-600 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed disabled:no-underline">
                            {resendCooldown > 0 ? t('resend_in_seconds', { seconds: resendCooldown }) : t('resend_code')}
                        </button>
                    </form>
                );
            case 'reset':
                return (
                     <form onSubmit={handleReset} className="space-y-4">
                        <h2 className="text-xl font-semibold">{t('set_new_password')}</h2>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={t('new_password')} required className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"/>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t('confirm_new_password')} required className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"/>
                        <PasswordStrengthIndicator password={newPassword} errors={passwordErrors} />
                        <button type="submit" disabled={isLoading} className="w-full bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-primary-400">{isLoading ? t('thinking') : t('save')}</button>
                    </form>
                );
        }
    }


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <main className="w-full max-w-md m-4">
                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-8">
                     <div className="text-center space-y-3">
                         <div className="w-16 h-16 mx-auto rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                            <KeyIcon className="h-8 w-8 text-primary-600 dark:text-primary-400"/>
                         </div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('reset_your_password')}</h1>
                    </div>
                    
                    <Stepper currentStep={step} />

                    <div className="pt-4">
                        {renderStep()}
                    </div>
                    
                    <div className="text-center">
                        <NavLink to="/login" className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 flex items-center justify-center">
                           <ArrowLeftIcon className="h-4 w-4 mr-1"/> {t('back_to_login')}
                        </NavLink>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ForgotPassword;