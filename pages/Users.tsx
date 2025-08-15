import React, { useContext, useState, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { User, ActionType } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, UserCircleIcon, ShieldCheckIcon, KeyIcon, IdentificationIcon, EyeIcon, EyeSlashIcon, ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { FormModal } from '../components/FormModal';
import { useTranslation, TranslationKey, handleImageError } from '../hooks/useTranslation';
import { useToast } from '../context/ToastContext';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { IDCardPrintModal } from '../components/IDCardPrintModal';
import { validatePassword } from '../utils/validation';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { ImageUploader } from '../components/ImageUploader';

// Reusable input component
const FormInput = ({ label, id, ...props }: { label: string, id: string, [key: string]: any }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium mb-1 dark:text-gray-300">{label}</label>
        <input id={id} {...props} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
    </div>
);

const FormSelect = ({ label, id, children, ...props }: { label: string, id: string, children: React.ReactNode, [key: string]: any }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium mb-1 dark:text-gray-300">{label}</label>
        <select id={id} {...props} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500">
            {children}
        </select>
    </div>
);


const UserForm = ({ user, allUsers, onSave, onCancel }: { user: User | null, allUsers: User[], onSave: (user: User) => void, onCancel: () => void }) => {
    const { state } = useContext(AppContext);
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        role: 'staff' as User['role'],
        phone: '',
        iconUrl: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    const availableRoles = useMemo(() => {
        const roles: { value: User['role']; label: string }[] = [
            { value: 'staff', label: t('staff') },
            { value: 'sales_manager', label: t('sales_manager') }
        ];

        // A super user can assign the 'admin' role.
        if (state.currentUser?.role === 'super_user') {
            roles.push({ value: 'admin', label: t('admin') });
        }
        
        // If the user being edited is an Admin, keep Admin in the list
        // so it doesn't get accidentally changed.
        if (user?.role === 'admin' && !roles.some(r => r.value === 'admin')) {
            roles.push({ value: 'admin', label: t('admin') });
        }
        
        // Super user role is never assignable from the UI.
        
        return roles;
    }, [state.currentUser?.role, t, user?.role]);


    useEffect(() => {
        if (user) {
            setFormData({
                id: user.id,
                name: user.name,
                email: user.email || '',
                role: user.role,
                phone: user.phone,
                iconUrl: user.iconUrl,
                password: '',
                confirmPassword: '',
            });
        } else {
            setFormData({
                id: '',
                name: '',
                email: '',
                role: 'staff',
                phone: '',
                iconUrl: '',
                password: '',
                confirmPassword: '',
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        errors.length > 0 && setErrors([]);
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);
        
        // ID validation
        if (!formData.id.trim()) {
            showToast(t('user_id_cannot_be_empty'), 'error');
            return;
        }

        const isIdTaken = allUsers.some(
            existingUser => existingUser.id.toLowerCase() === formData.id.toLowerCase() && existingUser.id !== user?.id
        );
        if (isIdTaken) {
            showToast(t('user_id_exists_error'), 'error');
            return;
        }
        
        // Single Super User validation
        if (formData.role === 'super_user') {
            const otherSuperUserExists = allUsers.some(u => u.role === 'super_user' && u.id !== user?.id);
            if (otherSuperUserExists) {
                showToast(t('super_user_exists_error'), 'error');
                return;
            }
        }

        // Password validation
        const isCreating = !user;
        const isChangingPassword = !!formData.password;

        if (isCreating || isChangingPassword) {
            const passwordErrors = validatePassword(formData.password);
            if (passwordErrors.length > 0) {
                setErrors(passwordErrors);
                return;
            }
             if (formData.password !== formData.confirmPassword) {
                setErrors(['passwords_do_not_match']);
                return;
            }
        }
       
        if (state.currentUser?.role === 'admin' && formData.role === 'admin') {
             showToast(t('admin_cannot_create_admin'), 'error');
             return;
        }

        const finalUser: User = {
            id: formData.id,
            name: formData.name,
            role: formData.role,
            phone: formData.phone,
            email: formData.email,
            iconUrl: formData.iconUrl,
            ...(isChangingPassword && { password: formData.password })
        };
        onSave(finalUser);
    };

    const handleAvatarChange = (newUrl: string) => {
        setFormData(prev => ({ ...prev, iconUrl: newUrl }));
    };

    const isIdEditingDisabled = user && (user.role === 'admin' || user.role === 'super_user' || user.id === state.currentUser?.id);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-2">
                    <ImageUploader label={t('user_avatar')} value={formData.iconUrl} onChange={handleAvatarChange} shape="circle" />
                </div>
                <div className="md:col-span-2 space-y-4">
                    <div className="p-4 border dark:border-gray-700 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">{t('personal_information')}</h3>
                        <div className="space-y-4">
                            <FormInput label={t('full_name')} id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
                            <FormInput label={t('email')} id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                            <FormInput label={t('phone')} id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 border dark:border-gray-700 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold mb-2">{t('account_credentials')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        label={t('user_id')}
                        id="id"
                        name="id"
                        type="text"
                        value={formData.id}
                        onChange={handleChange}
                        required
                        disabled={isIdEditingDisabled}
                        title={isIdEditingDisabled ? "Protected user IDs cannot be changed." : ""}
                    />
                    <FormSelect label={t('role')} id="role" name="role" value={formData.role} onChange={handleChange} required>
                        {availableRoles.map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                    </FormSelect>
                     <div className="relative">
                        <FormInput label={t('password')} id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} placeholder={user ? "Leave blank to keep current" : "Required"} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-8 right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                             {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                    <FormInput label={t('confirm_password')} id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} />
                </div>
                { (formData.password || !user) && <PasswordStrengthIndicator password={formData.password} errors={errors}/> }

            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="py-2 px-4 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors">{t('cancel')}</button>
                <button type="submit" className="py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">{t('save')}</button>
            </div>
        </form>
    );
};

const PasswordDisplay = ({ hash }: { hash?: string }) => {
    const [visible, setVisible] = useState(false);
    if (!hash) {
        return <span className="text-gray-400 italic">Not set</span>;
    }
    return (
        <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="truncate" style={{ maxWidth: '100px' }}>{visible ? hash : '••••••••••••••••'}</span>
            <button onClick={() => setVisible(!visible)} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                {visible ? <EyeSlashIcon className="h-4 w-4"/> : <EyeIcon className="h-4 w-4"/>}
            </button>
        </div>
    );
};

const generateRandomPassword = (length = 12) => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    const allChars = uppercase + lowercase + numbers + special;
    let password = '';
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    for (let i = password.length; i < length; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    // Shuffle the password to avoid predictable start
    return password.split('').sort(() => 0.5 - Math.random()).join('');
};

const TemporaryPasswordModal = ({ isOpen, onClose, userName, tempPassword }: { isOpen: boolean, onClose: () => void, userName: string, tempPassword: string }) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(tempPassword).then(() => {
            setCopied(true);
            showToast(t('password_copied_success'), 'success');
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <FormModal isOpen={isOpen} onClose={onClose} title={t('password_reset_success', { userName })}>
            <div className="text-center space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">A new temporary password has been generated for {userName}. Please provide it to them and advise them to change it upon their next login.</p>
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-between">
                    <span className="font-mono text-lg font-bold">{tempPassword}</span>
                    <button onClick={handleCopy} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                        {copied ? <ClipboardDocumentCheckIcon className="h-6 w-6 text-green-500" /> : <ClipboardDocumentIcon className="h-6 w-6" />}
                    </button>
                </div>
                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="py-2 px-6 rounded-lg bg-primary-600 text-white hover:bg-primary-700">Done</button>
                </div>
            </div>
        </FormModal>
    )
};


const Users: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [userForIdCard, setUserForIdCard] = useState<User | null>(null);
  const { currentUser } = state;
  
  const usersToShow = state.users.filter(u => u.role !== 'super_user');

  const handleAdd = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };
  
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSave = (user: User) => {
    if (editingUser) {
        dispatch({ type: ActionType.EDIT_USER, payload: { originalId: editingUser.id, updatedUser: user } });
        showToast(t('user_updated_success'), 'success');
    } else {
        dispatch({ type: ActionType.ADD_USER, payload: user });
        showToast(t('user_added_success'), 'success');
    }
    setIsModalOpen(false);
  };
  
  const handleDeleteRequest = (user: User) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
        dispatch({ type: ActionType.DELETE_USER, payload: { userId: userToDelete.id } });
        showToast(t('user_deleted_success'), 'info');
        setUserToDelete(null);
    }
  };

  const handleResetRequest = (user: User) => {
    const newPassword = generateRandomPassword();
    dispatch({
        type: ActionType.RESET_USER_PASSWORD,
        payload: { userId: user.id, newPassword }
    });
    setTempPassword(newPassword);
    setUserToReset(user);
  };
  
  const handleShowIdCard = (user: User) => {
    setUserForIdCard(user);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t('user_management')}</h1>
          {currentUser?.role !== 'monitor' && (
            <div className="flex items-center space-x-2">
              <button onClick={handleAdd} className="bg-primary-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-600 flex items-center transition-colors">
                <PlusIcon className="h-5 w-5 mr-2" />
                {t('add_user')}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">{t('full_name')}</th>
                <th scope="col" className="px-6 py-3">{t('user_id')}</th>
                <th scope="col" className="px-6 py-3">{t('password')}</th>
                <th scope="col" className="px-6 py-3">{t('phone')}</th>
                <th scope="col" className="px-6 py-3">{t('role')}</th>
                <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {usersToShow.map(user => (
                <UserRow key={user.id} user={user} onEdit={handleEdit} onDelete={handleDeleteRequest} onReset={handleResetRequest} onIdCard={handleShowIdCard} />
              ))}
               {usersToShow.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500">{t('no_users_found')}</td></tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? t('edit_user') : t('add_user')}>
        <UserForm user={editingUser} allUsers={state.users} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
      </FormModal>
      
      {userToReset && (
        <TemporaryPasswordModal
            isOpen={!!userToReset}
            onClose={() => setUserToReset(null)}
            userName={userToReset.name}
            tempPassword={tempPassword}
        />
      )}

      <ConfirmationModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t('confirm_delete_title')}
        message={t('confirm_delete_message', { itemName: userToDelete?.name || '' })}
      />
      {userForIdCard && <IDCardPrintModal user={userForIdCard} onClose={() => setUserForIdCard(null)} />}
    </>
  );
};

interface UserRowProps {
    user: User;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    onReset: (user: User) => void;
    onIdCard: (user: User) => void;
}

const UserRow: React.FC<UserRowProps> = ({ user, onEdit, onDelete, onReset, onIdCard }) => {
    const { state } = useContext(AppContext);
    const { t } = useTranslation();
    const { showToast } = useToast();
    
    const currentUser = state.currentUser;
    const isEditingSelf = user.id === currentUser?.id;

    const handleEditClick = () => {
        const isAdminModifyingAdmin = currentUser?.role === 'admin' && user.role === 'admin' && !isEditingSelf;
        if (isAdminModifyingAdmin) {
            showToast(t('admin_cannot_edit_admin'), 'error');
            return;
        }
        onEdit(user);
    };

    const handleDeleteClick = () => {
        if (isEditingSelf) {
            showToast(t('delete_self_error'), 'error');
            return;
        }
        
        // Super user can delete any user except themselves.
        if (currentUser?.role === 'super_user') {
            onDelete(user);
            return;
        }

        // For other roles (e.g., admin), prevent deleting a super user.
        if (user.role === 'super_user') {
            showToast(t('admin_cannot_delete_super_user'), 'error');
            return;
        }

        // An admin cannot delete another admin.
        if (currentUser?.role === 'admin' && user.role === 'admin') {
            showToast(t('admin_cannot_delete_admin'), 'error');
            return;
        }

        onDelete(user);
    };
    
    const handleResetClick = () => {
        if (isEditingSelf) {
            showToast(t('cannot_reset_own_password'), 'error');
            return;
        }
        if (currentUser?.role === 'admin' && user.role === 'super_user') {
            showToast(t('admin_cannot_reset_super_user'), 'error');
            return;
        }
        if (currentUser?.role === 'admin' && user.role === 'admin' && !isEditingSelf) {
            showToast(t('admin_cannot_reset_admin'), 'error');
            return;
        }
        onReset(user);
    };
    
    return (
         <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
            <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap flex items-center space-x-3">
                <img src={user.iconUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover" onError={handleImageError}/>
                <span>{user.name}</span>
            </th>
            <td className="px-6 py-4 font-mono text-xs">{user.id}</td>
            <td className="px-6 py-4">
                {currentUser?.role === 'monitor' ? (
                    <span className="font-mono text-xs">••••••••</span>
                ) : (
                    <PasswordDisplay hash={user.password} />
                )}
            </td>
            <td className="px-6 py-4">{user.phone}</td>
            <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin' ? 'bg-green-100 text-green-800' : user.role === 'sales_manager' ? 'bg-yellow-100 text-yellow-800' : user.role === 'super_user' ? 'bg-purple-100 text-purple-800' : user.role === 'monitor' ? 'bg-blue-100 text-blue-800' : 'bg-primary-100 text-primary-800'} flex items-center w-fit`}>
                    {user.role === 'admin' || user.role === 'super_user' ? <ShieldCheckIcon className="h-4 w-4 mr-1"/> : <UserCircleIcon className="h-4 w-4 mr-1"/>}
                    {t(user.role as TranslationKey)}
                </span>
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex justify-end space-x-1">
                    <button onClick={() => onIdCard(user)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('id_card')}>
                        <IdentificationIcon className="h-5 w-5 text-teal-600"/>
                    </button>
                    {currentUser?.role !== 'monitor' && (
                        <>
                            <button onClick={handleResetClick} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('reset_password')}>
                                <KeyIcon className="h-5 w-5 text-yellow-600"/>
                            </button>
                            <button onClick={handleEditClick} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('edit')}>
                                <PencilIcon className="h-5 w-5 text-primary-500"/>
                            </button>
                            <button onClick={handleDeleteClick} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('delete')}>
                                <TrashIcon className={`h-5 w-5 text-red-500`}/>
                            </button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}

export default Users;