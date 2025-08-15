import { UsbDevice } from '../types';

export const MOCK_USB_DEVICES: UsbDevice[] = [
  { id: '046d:c52b', name: 'Logitech Unifying Receiver', type: 'Mouse', status: 'Connected' },
  { id: '045e:028e', name: 'Microsoft Xbox 360 Controller', type: 'Other', status: 'Connected' },
  { id: '0bda:8153', name: 'Realtek USB GbE Family Controller', type: 'Other', status: 'Connected' },
  { id: '046d:082d', name: 'Logitech HD Pro Webcam C920', type: 'Webcam', status: 'Connected' },
  { id: '0781:5583', name: 'SanDisk Ultra Fit', type: 'Storage', status: 'Connected' },
  { id: '03f0:0c4a', name: 'HP LaserJet Pro M15w', type: 'Printer', status: 'Connected' },
];
