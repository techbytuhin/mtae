
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import {
    PrinterIcon, CreditCardIcon, DeviceTabletIcon, Cog6ToothIcon, PlusIcon, PencilIcon,
    TrashIcon, ArchiveBoxXMarkIcon, ArrowUturnLeftIcon, IdentificationIcon
} from '@heroicons/react/24/outline';
import { WifiIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid';
import { Printer, CardMachine, UsbDevice, BluetoothDevice, NetworkDevice, ActionType, AttendanceMachine } from '../types';
import { FormModal } from '../components/FormModal';
import { useToast } from '../context/ToastContext';
import { ConfirmationModal } from '../components/ConfirmationModal';

// Reusable form components
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

// Printer form for adding/editing printers
const PrinterForm = ({ printer, onSave, onCancel }: { printer: Printer | null, onSave: (printer: Printer) => void, onCancel: () => void }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '', type: 'thermal' as Printer['type'], connectionType: 'usb' as Printer['connectionType'], ipAddress: '', description: ''
    });

    useEffect(() => {
        if (printer) {
            setFormData({
                name: printer.name,
                type: printer.type,
                connectionType: printer.connectionType,
                ipAddress: printer.ipAddress || '',
                description: printer.description || '',
            });
        } else {
            setFormData({
                name: '', type: 'thermal', connectionType: 'usb', ipAddress: '', description: ''
            });
        }
    }, [printer]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalPrinter: Printer = {
            id: printer?.id || `printer_${crypto.randomUUID()}`,
            name: formData.name,
            type: formData.type,
            connectionType: formData.connectionType,
            ipAddress: (formData.connectionType === 'network' || formData.connectionType === 'lan') ? formData.ipAddress : '',
            description: formData.description,
            isDeleted: printer?.isDeleted || false,
        };
        onSave(finalPrinter);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label={t('printer_name')} id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
                <FormSelect label={t('printer_type')} id="type" name="type" value={formData.type} onChange={handleChange} required>
                    <option value="thermal">{t('thermal')}</option>
                    <option value="laser">{t('laser')}</option>
                    <option value="inkjet">{t('inkjet')}</option>
                </FormSelect>
                <FormSelect label={t('connection_type')} id="connectionType" name="connectionType" value={formData.connectionType} onChange={handleChange} required>
                    <option value="usb">{t('usb')}</option>
                    <option value="network">{t('network')}</option>
                    <option value="lan">{t('lan')}</option>
                    <option value="bluetooth">{t('bluetooth')}</option>
                </FormSelect>
                {(formData.connectionType === 'network' || formData.connectionType === 'lan') && (
                    <FormInput label={t('ip_address')} id="ipAddress" name="ipAddress" type="text" value={formData.ipAddress} onChange={handleChange} placeholder="e.g., 192.168.1.100" />
                )}
            </div>
            <div>
                 <label htmlFor="description" className="block text-sm font-medium mb-1 dark:text-gray-300">{t('description')}</label>
                 <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="py-2 px-4 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors">{t('cancel')}</button>
                <button type="submit" className="py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">{t('save')}</button>
            </div>
        </form>
    );
};

// Card Machine form for adding/editing
const CardMachineForm = ({ machine, onSave, onCancel }: { machine: CardMachine | null, onSave: (machine: CardMachine) => void, onCancel: () => void }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '', provider: '', status: 'Connected' as CardMachine['status'], description: ''
    });

    useEffect(() => {
        if (machine) {
            setFormData({
                name: machine.name,
                provider: machine.provider,
                status: machine.status,
                description: machine.description || '',
            });
        } else {
            setFormData({
                name: '', provider: '', status: 'Connected', description: ''
            });
        }
    }, [machine]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalMachine: CardMachine = {
            id: machine?.id || `cm_${crypto.randomUUID()}`,
            name: formData.name,
            provider: formData.provider,
            status: formData.status,
            description: formData.description,
            isDeleted: machine?.isDeleted || false,
        };
        onSave(finalMachine);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label={t('machine_name')} id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
                <FormInput label={t('provider')} id="provider" name="provider" type="text" value={formData.provider} onChange={handleChange} placeholder="e.g., Stripe, Square" required />
            </div>
            <FormSelect label={t('status')} id="status" name="status" value={formData.status} onChange={handleChange} required>
                <option value="Connected">{t('connected')}</option>
                <option value="Disconnected">{t('disconnected')}</option>
            </FormSelect>
            <div>
                 <label htmlFor="description" className="block text-sm font-medium mb-1 dark:text-gray-300">{t('description')}</label>
                 <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="py-2 px-4 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors">{t('cancel')}</button>
                <button type="submit" className="py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">{t('save')}</button>
            </div>
        </form>
    );
};

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


const DeviceCard = ({ title, icon, children, count, actions }: { title: string, icon: React.ReactNode, children: React.ReactNode, count: number, actions?: React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b dark:border-gray-700 flex items-center space-x-3">
            <div className="bg-primary-100 dark:bg-primary-900/50 p-2 rounded-full">
                {icon}
            </div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <div className="flex-grow" />
            <div className="flex items-center space-x-2">
                {actions}
                <span className="bg-gray-200 dark:bg-gray-700 text-sm font-bold px-2.5 py-1 rounded-full">{count}</span>
            </div>
        </div>
        <div className="overflow-x-auto">
            {children}
        </div>
    </div>
);

const NoDevicesMessage: React.FC<{ message: string }> = ({ message }) => (
     <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>{message}</p>
    </div>
);


const ConnectedDevices: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'managed' | 'discovered'>('managed');
    
    // Discovered devices state
    const { usbDevices, bluetoothDevices, networkDevices, settings } = state;
    
    // State for Printers
    const [showTrashPrinters, setShowTrashPrinters] = useState(false);
    const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
    const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
    const [printerToDelete, setPrinterToDelete] = useState<Printer | null>(null);

    // State for Card Machines
    const [showTrashCardMachines, setShowTrashCardMachines] = useState(false);
    const [isCardMachineModalOpen, setIsCardMachineModalOpen] = useState(false);
    const [editingCardMachine, setEditingCardMachine] = useState<CardMachine | null>(null);
    const [cardMachineToDelete, setCardMachineToDelete] = useState<CardMachine | null>(null);

    // State for Attendance Machines
    const [showTrashAttMachines, setShowTrashAttMachines] = useState(false);
    const [isAttMachineModalOpen, setIsAttMachineModalOpen] = useState(false);
    const [editingAttMachine, setEditingAttMachine] = useState<AttendanceMachine | null>(null);
    const [attMachineToDelete, setAttMachineToDelete] = useState<AttendanceMachine | null>(null);

    // Memoized data for Printers
    const activePrinters = state.printers.filter(p => !p.isDeleted);
    const deletedPrinters = state.printers.filter(p => p.isDeleted);
    const printersToShow = showTrashPrinters ? deletedPrinters : activePrinters;

    // Memoized data for Card Machines
    const activeCardMachines = state.cardMachines.filter(m => !m.isDeleted);
    const deletedCardMachines = state.cardMachines.filter(m => m.isDeleted);
    const cardMachinesToShow = showTrashCardMachines ? deletedCardMachines : activeCardMachines;

    // Memoized data for Attendance Machines
    const activeAttMachines = state.attendanceMachines.filter(p => !p.isDeleted);
    const deletedAttMachines = state.attendanceMachines.filter(p => p.isDeleted);
    const attMachinesToShow = showTrashAttMachines ? deletedAttMachines : activeAttMachines;
    
    // --- Handlers for Printers ---
    const handleAddPrinter = () => { setEditingPrinter(null); setIsPrinterModalOpen(true); };
    const handleEditPrinter = (printer: Printer) => { setEditingPrinter(printer); setIsPrinterModalOpen(true); };
    const handleSavePrinter = (printer: Printer) => {
        if (editingPrinter) {
            dispatch({ type: ActionType.EDIT_PRINTER, payload: printer });
            showToast(t('printer_updated_success'), 'success');
        } else {
            dispatch({ type: ActionType.ADD_PRINTER, payload: printer });
            showToast(t('printer_added_success'), 'success');
        }
        setIsPrinterModalOpen(false);
    };
    const handleDeletePrinterRequest = (printer: Printer) => setPrinterToDelete(printer);
    const handleConfirmDeletePrinter = () => {
        if (printerToDelete) {
            dispatch({ type: ActionType.DELETE_PRINTER, payload: { printerId: printerToDelete.id } });
            showToast(t('printer_deleted_success'), 'info');
            setPrinterToDelete(null);
        }
    };

    // --- Handlers for Card Machines ---
    const handleAddCardMachine = () => { setEditingCardMachine(null); setIsCardMachineModalOpen(true); };
    const handleEditCardMachine = (machine: CardMachine) => { setEditingCardMachine(machine); setIsCardMachineModalOpen(true); };
    const handleSaveCardMachine = (machine: CardMachine) => {
        if (editingCardMachine) {
            dispatch({ type: ActionType.EDIT_CARD_MACHINE, payload: machine });
            showToast(t('card_machine_updated_success'), 'success');
        } else {
            dispatch({ type: ActionType.ADD_CARD_MACHINE, payload: machine });
            showToast(t('card_machine_added_success'), 'success');
        }
        setIsCardMachineModalOpen(false);
    };
    const handleDeleteCardMachineRequest = (machine: CardMachine) => setCardMachineToDelete(machine);
    const handleConfirmDeleteCardMachine = () => {
        if (cardMachineToDelete) {
            dispatch({ type: ActionType.DELETE_CARD_MACHINE, payload: { machineId: cardMachineToDelete.id } });
            showToast(t('card_machine_deleted_success'), 'info');
            setCardMachineToDelete(null);
        }
    };

    // --- Handlers for Attendance Machines ---
    const handleAddAttMachine = () => { setEditingAttMachine(null); setIsAttMachineModalOpen(true); };
    const handleEditAttMachine = (machine: AttendanceMachine) => { setEditingAttMachine(machine); setIsAttMachineModalOpen(true); };
    const handleSaveAttMachine = (machine: AttendanceMachine) => {
        if (editingAttMachine) {
            dispatch({ type: ActionType.EDIT_ATTENDANCE_MACHINE, payload: machine });
            showToast('Machine updated successfully!', 'success');
        } else {
            dispatch({ type: ActionType.ADD_ATTENDANCE_MACHINE, payload: machine });
            showToast('Machine added successfully!', 'success');
        }
        setIsAttMachineModalOpen(false);
    };
    const handleDeleteAttMachineRequest = (machine: AttendanceMachine) => setAttMachineToDelete(machine);
    const handleConfirmDeleteAttMachine = () => {
        if (attMachineToDelete) {
            dispatch({ type: ActionType.DELETE_ATTENDANCE_MACHINE, payload: { machineId: attMachineToDelete.id } });
            showToast('Machine moved to trash.', 'info');
            setAttMachineToDelete(null);
        }
    };
    const handleRestoreAttMachine = (machineId: string) => {
        dispatch({ type: ActionType.RESTORE_ATTENDANCE_MACHINE, payload: { machineId } });
        showToast('Machine restored successfully.', 'success');
    };
    
    const printerActions = (
        <div className="flex items-center space-x-2">
            <button onClick={() => setShowTrashPrinters(!showTrashPrinters)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={showTrashPrinters ? t('view_active') : t('view_trash')}>
                <ArchiveBoxXMarkIcon className="h-5 w-5" />
            </button>
            <button onClick={handleAddPrinter} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('add_printer')}>
                <PlusIcon className="h-5 w-5" />
            </button>
        </div>
    );

    const cardMachineActions = (
        <div className="flex items-center space-x-2">
             <button onClick={() => setShowTrashCardMachines(!showTrashCardMachines)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={showTrashCardMachines ? t('view_active') : t('view_trash')}>
                <ArchiveBoxXMarkIcon className="h-5 w-5" />
            </button>
            <button onClick={handleAddCardMachine} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('add_card_machine')}>
                <PlusIcon className="h-5 w-5" />
            </button>
        </div>
    );

    const attMachineActions = (
        <div className="flex items-center space-x-2">
             <button onClick={() => setShowTrashAttMachines(!showTrashAttMachines)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={showTrashAttMachines ? t('view_active') : t('view_trash')}>
                <ArchiveBoxXMarkIcon className="h-5 w-5" />
            </button>
            <button onClick={handleAddAttMachine} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={'Add Machine'}>
                <PlusIcon className="h-5 w-5" />
            </button>
        </div>
    );

    const TabButton = ({ text, isActive, onClick }: { text: string, isActive: boolean, onClick: () => void }) => (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-white dark:bg-gray-800 shadow text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/50'}`}
        >
            {text}
        </button>
    );

    return (
        <>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">{t('connected_devices')}</h1>
                
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
                    <TabButton text="Managed Devices" isActive={activeTab === 'managed'} onClick={() => setActiveTab('managed')} />
                    <TabButton text="Discovered Devices" isActive={activeTab === 'discovered'} onClick={() => setActiveTab('discovered')} />
                </div>

                {activeTab === 'managed' && (
                    <div className="space-y-8">
                        <DeviceCard 
                            title={t('printers')} 
                            icon={<PrinterIcon className="h-6 w-6 text-primary-500" />} 
                            count={printersToShow.length} 
                            actions={printerActions}
                        >
                            {printersToShow.length > 0 ? (
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">{t('printer_name')}</th>
                                            <th scope="col" className="px-6 py-3">{t('connection_type')}</th>
                                            <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {printersToShow.map(p => (
                                            <PrinterRow key={p.id} printer={p} isTrashView={showTrashPrinters} onEdit={handleEditPrinter} onDelete={handleDeletePrinterRequest} />
                                        ))}
                                    </tbody>
                                </table>
                            ) : <NoDevicesMessage message={showTrashPrinters ? t('trash_is_empty') : t('no_printers_found')} />}
                        </DeviceCard>

                         <DeviceCard 
                            title={t('card_machines')} 
                            icon={<CreditCardIcon className="h-6 w-6 text-primary-500" />} 
                            count={cardMachinesToShow.length} 
                            actions={cardMachineActions}
                        >
                            {cardMachinesToShow.length > 0 ? (
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">{t('machine_name')}</th>
                                            <th scope="col" className="px-6 py-3">{t('status')}</th>
                                            <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cardMachinesToShow.map(m => (
                                            <CardMachineRow key={m.id} machine={m} isTrashView={showTrashCardMachines} onEdit={handleEditCardMachine} onDelete={handleDeleteCardMachineRequest} />
                                        ))}
                                    </tbody>
                                </table>
                            ): <NoDevicesMessage message={showTrashCardMachines ? t('trash_is_empty') : t('no_card_machines_found')} />}
                        </DeviceCard>

                         <DeviceCard 
                            title={t('attendance_machines')} 
                            icon={<IdentificationIcon className="h-6 w-6 text-primary-500" />} 
                            count={attMachinesToShow.length} 
                            actions={attMachineActions}
                        >
                            {attMachinesToShow.length > 0 ? (
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">{t('machine_name')}</th>
                                            <th scope="col" className="px-6 py-3">{t('device_type')}</th>
                                            <th scope="col" className="px-6 py-3">{t('ip_address')}</th>
                                            <th scope="col" className="px-6 py-3">{t('status')}</th>
                                            <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attMachinesToShow.map(m => (
                                            <AttendanceMachineRow key={m.id} machine={m} isTrashView={showTrashAttMachines} onEdit={handleEditAttMachine} onDelete={handleDeleteAttMachineRequest} onRestore={handleRestoreAttMachine}/>
                                        ))}
                                    </tbody>
                                </table>
                            ): <NoDevicesMessage message={showTrashAttMachines ? t('trash_is_empty') : 'No attendance machines found.'} />}
                        </DeviceCard>
                    </div>
                )}
                
                {activeTab === 'discovered' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <DeviceCard title={t('usb_devices')} icon={<DeviceTabletIcon className="h-6 w-6 text-primary-500" />} count={usbDevices.length}>
                            {usbDevices.length > 0 ? (
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                     <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">{t('device_name')}</th>
                                            <th scope="col" className="px-6 py-3">{t('device_type')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usbDevices.map(d => (
                                            <tr key={d.id} className="border-b dark:border-gray-700 last:border-b-0">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{d.name}</td>
                                                <td className="px-6 py-4">{d.type}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <NoDevicesMessage message={t('no_usb_devices')} />}
                        </DeviceCard>

                        <DeviceCard title={t('bluetooth_devices')} icon={<SpeakerWaveIcon className="h-6 w-6 text-primary-500" />} count={bluetoothDevices.length}>
                             {bluetoothDevices.length > 0 ? (
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                     <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">{t('device_name')}</th>
                                            <th scope="col" className="px-6 py-3">{t('signal_strength')}</th>
                                            <th scope="col" className="px-6 py-3">{t('status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bluetoothDevices.map(d => (
                                            <tr key={d.id} className="border-b dark:border-gray-700 last:border-b-0">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{d.name}</td>
                                                <td className="px-6 py-4">{d.signalStrength} dBm</td>
                                                <td className="px-6 py-4">{d.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <NoDevicesMessage message={t('no_bluetooth_devices')} />}
                        </DeviceCard>
                        
                        <div className="lg:col-span-2">
                            <DeviceCard title={t('network_devices')} icon={<WifiIcon className="h-6 w-6 text-primary-500" />} count={networkDevices.length}>
                                {networkDevices.length > 0 ? (
                                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th scope="col" className="px-6 py-3">{t('hostname')}</th>
                                                <th scope="col" className="px-6 py-3">{t('ip_address')}</th>
                                                <th scope="col" className="px-6 py-3">{t('mac_address')}</th>
                                                <th scope="col" className="px-6 py-3">{t('connection')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {networkDevices.map(d => (
                                                <tr key={d.macAddress} className="border-b dark:border-gray-700 last:border-b-0">
                                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{d.hostname}</td>
                                                    <td className="px-6 py-4 font-mono">{d.ipAddress}</td>
                                                    <td className="px-6 py-4 font-mono">{d.macAddress}</td>
                                                    <td className="px-6 py-4">{d.connection}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ): <NoDevicesMessage message={t('no_network_devices')} />}
                            </DeviceCard>
                        </div>
                    </div>
                )}
            </div>
            {/* --- Modals --- */}
            <FormModal isOpen={isPrinterModalOpen} onClose={() => setIsPrinterModalOpen(false)} title={editingPrinter ? t('edit_printer') : t('add_printer')}>
                <PrinterForm printer={editingPrinter} onSave={handleSavePrinter} onCancel={() => setIsPrinterModalOpen(false)} />
            </FormModal>
             <FormModal isOpen={isCardMachineModalOpen} onClose={() => setIsCardMachineModalOpen(false)} title={editingCardMachine ? t('edit_card_machine') : t('add_card_machine')}>
                <CardMachineForm machine={editingCardMachine} onSave={handleSaveCardMachine} onCancel={() => setIsCardMachineModalOpen(false)} />
            </FormModal>
            <FormModal isOpen={isAttMachineModalOpen} onClose={() => setIsAttMachineModalOpen(false)} title={editingAttMachine ? 'Edit Attendance Machine' : 'Add Attendance Machine'}>
                <AttendanceMachineForm machine={editingAttMachine} onSave={handleSaveAttMachine} onCancel={() => setIsAttMachineModalOpen(false)} />
            </FormModal>

            <ConfirmationModal isOpen={!!printerToDelete} onClose={() => setPrinterToDelete(null)} onConfirm={handleConfirmDeletePrinter} title={t('confirm_delete_title')} message={t('confirm_delete_message', { itemName: printerToDelete?.name || '' })} />
            <ConfirmationModal isOpen={!!cardMachineToDelete} onClose={() => setCardMachineToDelete(null)} onConfirm={handleConfirmDeleteCardMachine} title={t('confirm_delete_title')} message={t('confirm_delete_message', { itemName: cardMachineToDelete?.name || '' })} />
            <ConfirmationModal isOpen={!!attMachineToDelete} onClose={() => setAttMachineToDelete(null)} onConfirm={handleConfirmDeleteAttMachine} title={t('confirm_delete_title')} message={t('confirm_delete_message', { itemName: attMachineToDelete?.name || '' })} />
        </>
    );
};

// --- Row Components ---
const PrinterRow: React.FC<{ printer: Printer; isTrashView: boolean; onEdit: (printer: Printer) => void; onDelete: (printer: Printer) => void; }> = ({ printer, isTrashView, onEdit, onDelete }) => {
    const { dispatch } = useContext(AppContext);
    const { t } = useTranslation();
    const { showToast } = useToast();

    const handleRestore = (printerId: string) => {
        dispatch({ type: ActionType.RESTORE_PRINTER, payload: { printerId } });
        showToast(t('printer_restored_success'), 'success');
    };

    return (
        <tr className="border-b dark:border-gray-700 last:border-b-0">
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{printer.name}</td>
            <td className="px-6 py-4 capitalize">{printer.connectionType}{printer.ipAddress && ` (${printer.ipAddress})`}</td>
            <td className="px-6 py-4 text-right">
                {isTrashView ? (
                    <button onClick={() => handleRestore(printer.id)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('restore')}>
                        <ArrowUturnLeftIcon className="h-5 w-5 text-green-500" />
                    </button>
                ) : (
                    <div className="flex justify-end space-x-1">
                        <button onClick={() => onEdit(printer)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('edit')}>
                            <PencilIcon className="h-5 w-5 text-primary-500" />
                        </button>
                        <button onClick={() => onDelete(printer)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('delete')}>
                            <TrashIcon className="h-5 w-5 text-red-500" />
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
};

const CardMachineRow: React.FC<{ machine: CardMachine; isTrashView: boolean; onEdit: (machine: CardMachine) => void; onDelete: (machine: CardMachine) => void; }> = ({ machine, isTrashView, onEdit, onDelete }) => {
    const { dispatch } = useContext(AppContext);
    const { t } = useTranslation();
    const { showToast } = useToast();

    const handleRestore = (machineId: string) => {
        dispatch({ type: ActionType.RESTORE_CARD_MACHINE, payload: { machineId } });
        showToast(t('card_machine_restored_success'), 'success');
    };
    
    const statusColor = machine.status === 'Connected' ? 'bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-800/50 dark:text-red-300';

    return (
        <tr className="border-b dark:border-gray-700 last:border-b-0">
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{machine.name}</td>
            <td className="px-6 py-4">
                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                    {t(machine.status.toLowerCase() as any)}
                 </span>
            </td>
            <td className="px-6 py-4 text-right">
                {isTrashView ? (
                    <button onClick={() => handleRestore(machine.id)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('restore')}>
                        <ArrowUturnLeftIcon className="h-5 w-5 text-green-500" />
                    </button>
                ) : (
                    <div className="flex justify-end space-x-1">
                        <button onClick={() => onEdit(machine)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('edit')}>
                            <PencilIcon className="h-5 w-5 text-primary-500" />
                        </button>
                        <button onClick={() => onDelete(machine)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('delete')}>
                            <TrashIcon className="h-5 w-5 text-red-500" />
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
};

const AttendanceMachineRow: React.FC<{ machine: AttendanceMachine; isTrashView: boolean; onEdit: (machine: AttendanceMachine) => void; onDelete: (machine: AttendanceMachine) => void; onRestore: (machineId: string) => void; }> = ({ machine, isTrashView, onEdit, onDelete, onRestore }) => {
    const { t } = useTranslation();
    return (
        <tr className="border-b dark:border-gray-700 last:border-b-0">
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{machine.name}</td>
            <td className="px-6 py-4 capitalize">{machine.type.replace('_', ' ')}</td>
            <td className="px-6 py-4 font-mono">{machine.ipAddress}</td>
            <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${machine.status === 'online' ? 'bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-800/50 dark:text-red-300'}`}>
                    {t(machine.status)}
                </span>
            </td>
            <td className="px-6 py-4 text-right">
                {isTrashView ? (
                    <button onClick={() => onRestore(machine.id)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('restore')}>
                        <ArrowUturnLeftIcon className="h-5 w-5 text-green-500" />
                    </button>
                ) : (
                    <div className="flex justify-end space-x-1">
                        <button onClick={() => onEdit(machine)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('edit')}>
                            <PencilIcon className="h-5 w-5 text-primary-500" />
                        </button>
                        <button onClick={() => onDelete(machine)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={t('delete')}>
                            <TrashIcon className="h-5 w-5 text-red-500" />
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
};


export default ConnectedDevices;
