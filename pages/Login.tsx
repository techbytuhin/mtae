import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { ActionType } from '../types';
import { useTranslation, handleImageError } from '../hooks/useTranslation';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';
import { NavLink } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, UserIcon as UserOutlineIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const Login: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { settings, loginError } = state;
    const { t } = useTranslation();

    // State for password login form
    const [userIdInput, setUserIdInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // Clear login error when component mounts or error changes, to ensure stale errors are not shown.
        if (loginError) {
            dispatch({ type: ActionType.CLEAR_LOGIN_ERROR });
        }
    }, [dispatch, loginError]);
    
    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (loginError) {
            dispatch({ type: ActionType.CLEAR_LOGIN_ERROR });
        }
        setter(e.target.value);
    };
    
    const handlePasswordLogin = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({
            type: ActionType.LOGIN_WITH_PASSWORD,
            payload: { userId: userIdInput, password: passwordInput }
        });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-slate-900 p-4 font-sans">
            <main className="w-full max-w-md">
                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
                    <div className="text-center space-y-3">
                        <img src={settings.shopLogo} alt="Shop Logo" className="w-24 h-24 mx-auto rounded-full object-cover shadow-lg" onError={handleImageError} />
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{settings.shopName}</h1>
                    </div>

                    <div className="space-y-6">
                        <form onSubmit={handlePasswordLogin} className="space-y-4">
                             <div className="relative">
                                <UserOutlineIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2"/>
                                <input
                                    type="text"
                                    value={userIdInput}
                                    onChange={handleInputChange(setUserIdInput)}
                                    placeholder={t('user_id')}
                                    required
                                    className="w-full p-2 pl-10 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div className="relative">
                                 <LockClosedIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2"/>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordInput}
                                    onChange={handleInputChange(setPasswordInput)}
                                    placeholder={t('password')}
                                    required
                                    className="w-full p-2 pl-10 pr-10 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                                />
                                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500">
                                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                            
                            {loginError && <p className="text-red-500 text-sm text-center h-5">{loginError}</p>}
                            {!loginError && <div className="h-5"></div>}


                            <div className="text-right">
                                <NavLink to="/forgot-password" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">{t('forgot_password')}</NavLink>
                            </div>

                            <button type="submit" className="w-full bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700">
                                {t('login')}
                            </button>
                        </form>
                    </div>
                    <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 pt-4">
                        <ShieldCheckIcon className="h-4 w-4 mr-2 text-green-500" />
                        <span>Don't share Password & Stay Safe</span>
                    </div>
                </div>
                 <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                    Developed by Tarikul Islam Tuhin
                </div>
            </main>
        </div>
    );
};

export default Login;