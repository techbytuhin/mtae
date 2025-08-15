import React, { useRef } from 'react';
import { useTranslation, handleImageError, PLACEHOLDER_IMAGE } from '../hooks/useTranslation';
import { PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ImageUploaderProps {
    value: string;
    onChange: (value: string) => void;
    label: string;
    shape?: 'square' | 'circle';
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ value, onChange, label, shape = 'square' }) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 512;
                    const MAX_HEIGHT = 512;
                    let width = img.width;
                    let height = img.height;
    
                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        // For JPEGs, we can specify quality. For PNGs, it's lossless.
                        const dataUrl = canvas.toDataURL(file.type, 0.9); // 0.9 quality for JPEGs
                        onChange(dataUrl);
                    } else {
                        // Fallback to original if canvas fails
                        onChange(e.target?.result as string);
                    }
                };
                img.onerror = () => {
                    // Fallback if image can't be loaded (e.g., corrupted)
                    onChange(e.target?.result as string);
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        } else {
            alert(t('alert_select_image'));
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };
    
    const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        onChange('');
    };

    const previewContainerClasses = shape === 'circle'
        ? "flex-shrink-0 h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center"
        : "flex-shrink-0 h-24 w-24 rounded-md bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center";

    return (
        <div>
            <span className="block text-sm font-medium mb-1 dark:text-gray-300">{label}</span>
            <div className="mt-1 flex items-center space-x-4">
                <div className={previewContainerClasses}>
                    <img src={value || PLACEHOLDER_IMAGE} alt={t('image_preview')} className="h-full w-full object-cover" onError={handleImageError} />
                </div>
                <div className="flex flex-col space-y-2">
                     <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center"
                    >
                        <PhotoIcon className="h-5 w-5 mr-2 text-gray-500" />
                        {t('upload_a_file')}
                    </button>
                    <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-3 py-1.5 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 flex items-center"
                    >
                        <TrashIcon className="h-5 w-5 mr-2" />
                        {t('remove_image')}
                    </button>
                    <input ref={fileInputRef} id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg" />
                </div>
            </div>
        </div>
    );
};