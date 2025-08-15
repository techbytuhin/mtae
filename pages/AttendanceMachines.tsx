import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { AttendanceMachine, ActionType } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, ArchiveBoxXMarkIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { FormModal } from '../components/FormModal';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../context/ToastContext';
import { ConfirmationModal } from '../components/ConfirmationModal';

// Reusable form components from another file
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


const AttendanceMachineForm = ({ machine, onSave, onCancel }: { machine: AttendanceMachine | null, onSave: (machine: AttendanceMachine) => void, onCancel: () => void }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        type: 'fingerprint' as AttendanceMachine['type'],
        status: 'online' as AttendanceMachine['status'],
        ipAddress: '',
    });

    useEffect(() => {
        if (machine) {
            setFormData({
                name: machine.name,
                type: machine.type,
                status: machine.status,
                ipAddress: machine.ipAddress || '',
            });
        } else {
            setFormData({
                name: '',
                type: 'fingerprint',
                status: 'online',
                ipAddress: '',
            });
        }
    }, [machine]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalMachine: AttendanceMachine = {
            id: machine?.id || `attm_${crypto.randomUUID()}`,
            name: formData.name,
            type: formData.type,
            status: formData.status,
            ipAddress: formData.ipAddress,
            isDeleted: machine?.isDeleted || false,
        };
        onSave(finalMachine);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label={t('machine_name')} id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
                <FormSelect label={t('device_type')} id="type" name="type" value={formData.type} onChange={handleChange} required>
                    <option value="fingerprint">Fingerprint</option>
                    <option value="face_recognition">Face Recognition</option>
                    <option value="card_scanner">Card Scanner</option>
                </FormSelect>
                <FormInput label={t('ip_address')} id="ipAddress" name="ipAddress" type="text" value={formData.ipAddress} onChange={handleChange} placeholder="e.g. 192.168.1.100" />
                <FormSelect label={t('status')} id="status" name="status" value={formData.status} onChange={handleChange} required>
                    <option value="online">{t('online')}</option>
                    <option value="offline">{t('offline')}</option>
                </FormSelect>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="py-2 px-4 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors">{t('cancel')}</button>
                <button type="submit" className="py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">{t('save')}</button>
            </div>
        </form>
    );
};


const AttendanceMachines: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [showTrash, setShowTrash] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMachine, setEditingMachine] = useState<AttendanceMachine | null>(null);
    const [machineToDelete, setMachineToDelete] = useState<AttendanceMachine | null>(null);

    const activeMachines = state.attendanceMachines.filter(p => !p.isDeleted);
    const deletedMachines = state.attendanceMachines.filter(p => p.isDeleted);
    const machinesToShow = showTrash ? deletedMachines : activeMachines;

    const handleAdd = () => {
        setEditingMachine(null);
        setIsModalOpen(true);
    };

    const handleEdit = (machine: AttendanceMachine) => {
        setEditingMachine(machine);
        setIsModalOpen(true);
    };

    const handleSave = (machine: AttendanceMachine) => {
        if (editingMachine) {
            dispatch({ type: ActionType.EDIT_ATTENDANCE_MACHINE, payload: machine });
            showToast('Machine updated successfully!', 'success');
        } else {
            dispatch({ type: ActionType.ADD_ATTENDANCE_MACHINE, payload: machine });
            showToast('Machine added successfully!', 'success');
        }
        setIsModalOpen(false);
    };

    const handleDeleteRequest = (machine: AttendanceMachine) => {
        setMachineToDelete(machine);
    };

    const handleConfirmDelete = () => {
        if (machineToDelete) {
            dispatch({ type: ActionType.DELETE_ATTENDANCE_MACHINE, payload: { machineId: machineToDelete.id } });
            showToast('Machine moved to trash.', 'info');
            setMachineToDelete(null);
        }
    };

    const handleRestore = (machineId: string) => {
        dispatch({ type: ActionType.RESTORE_ATTENDANCE_MACHINE, payload: { machineId } });
        showToast('Machine restored successfully.', 'success');
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">{t('attendance_machines')}</h1>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowTrash(!showTrash)}
                            className="bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 flex items-center transition-colors"
                        >
                            <ArchiveBoxXMarkIcon className="h-5 w-5 mr-2" />
                            {showTrash ? t('view_active') : t('view_trash')} ({deletedMachines.length})
                        </button>
                        <button onClick={handleAdd} className="bg-primary-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-600 flex items-center transition-colors">
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add Machine
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('machine_name')}</th>
                                <th scope="col" className="px-6 py-3">{t('device_type')}</th>
                                <th scope="col" className="px-6 py-3">{t('ip_address')}</th>
                                <th scope="col" className="px-6 py-3">{t('status')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {machinesToShow.map(machine => (
                                <tr key={machine.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{machine.name}</td>
                                    <td className="px-6 py-4 capitalize">{machine.type.replace('_', ' ')}</td>
                                    <td className="px-6 py-4 font-mono">{machine.ipAddress}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${machine.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {t(machine.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {showTrash ? (
                                            <button onClick={() => handleRestore(machine.id)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('restore')}>
                                                <ArrowUturnLeftIcon className="h-5 w-5 text-green-500" />
                                            </button>
                                        ) : (
                                            <div className="flex justify-end space-x-1">
                                                <button onClick={() => handleEdit(machine)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('edit')}>
                                                    <PencilIcon className="h-5 w-5 text-primary-500" />
                                                </button>
                                                <button onClick={() => handleDeleteRequest(machine)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('delete')}>
                                                    <TrashIcon className="h-5 w-5 text-red-500" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {machinesToShow.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500">
                                        {showTrash ? t('trash_is_empty') : 'No attendance machines found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMachine ? 'Edit Attendance Machine' : 'Add Attendance Machine'}>
                <AttendanceMachineForm machine={editingMachine} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </FormModal>
            <ConfirmationModal
                isOpen={!!machineToDelete}
                onClose={() => setMachineToDelete(null)}
                onConfirm={handleConfirmDelete}
                title={t('confirm_delete_title')}
                message={t('confirm_delete_message', { itemName: machineToDelete?.name || '' })}
            />
        </>
    );
};

export default AttendanceMachines;
