import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../hooks/useTranslation';

interface CalculatorProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [display, setDisplay] = useState('0');
    const [isResult, setIsResult] = useState(false);

    const handleInput = (value: string) => {
        if (isResult || display === 'Error') {
            setDisplay(value);
            setIsResult(false);
            return;
        }
        // Avoid multiple leading zeros
        if (display === '0' && value === '0') return;
        // If last char is an operator, don't append another 0
        const lastChar = display.slice(-1);
        if(lastChar === ' ' && value === '0') return;

        setDisplay(display === '0' ? value : display + value);
    };
    
    const handleOperator = (op: string) => {
        if (display === 'Error') {
            handleClear();
            return;
        }
        setIsResult(false);
        const lastChar = display.slice(-1);
        // Replace operator if last input was an operator
        if (lastChar === ' ') {
             setDisplay(display.slice(0, -3) + ` ${op} `);
        } else if (display !== '0') {
             setDisplay(display + ` ${op} `);
        }
    };
    
    const handleClear = () => {
        setDisplay('0');
        setIsResult(false);
    };

    const handleDelete = () => {
        if (isResult || display === 'Error') {
            handleClear();
            return;
        }
        if (display === '0') return;

        // Handles removing operator with spaces
        if (display.endsWith(' ')) {
            const newDisplay = display.slice(0, -3);
            setDisplay(newDisplay.length > 0 ? newDisplay : '0');
            return;
        }

        const newDisplay = display.slice(0, -1);
        setDisplay(newDisplay.length > 0 ? newDisplay : '0');
    };
    
    const handlePercentage = () => {
        if (isResult || display === 'Error') return;
        const segments = display.split(' ');
        const lastSegmentIndex = segments.length - 1;
        const lastSegment = segments[lastSegmentIndex];

        if (lastSegment && !isNaN(parseFloat(lastSegment))) {
            const num = parseFloat(lastSegment) / 100;
            segments[lastSegmentIndex] = num.toString();
            setDisplay(segments.join(' '));
        }
    }


    const evaluateExpression = (expr: string): number => {
        try {
            // Sanitize expression to allow only numbers and basic operators
            const sanitizedExpr = expr.replace(/[^-()\d/*+.\s]/g, '');
            return new Function('return ' + sanitizedExpr)();
        } catch (e) {
            console.error(e);
            throw new Error("Invalid Expression");
        }
    };

    const handleCalculate = () => {
        if (isResult) return;
        try {
            // Trim trailing operators before evaluation
            const finalExpression = display.replace(/\s[\/\*+-]\s*$/g, '');
            const result = evaluateExpression(finalExpression);
             if (!isFinite(result)) {
                setDisplay('Error');
            } else {
                setDisplay(String(Number(result.toFixed(10))));
            }
            setIsResult(true);
        } catch (error) {
            setDisplay('Error');
            setIsResult(true);
        }
    };
    
    const handleClick = (btn: string) => {
        const numRegex = /^[0-9]$/;
        const opRegex = /^[\/\*+-]$/;
        
        if (numRegex.test(btn)) handleInput(btn);
        else if (btn === '.') {
            const parts = display.split(' ');
            const lastPart = parts[parts.length - 1];
            if (!lastPart.includes('.')) {
                handleInput(btn);
            }
        }
        else if (opRegex.test(btn)) handleOperator(btn);
        else if (btn === 'C') handleClear();
        else if (btn === 'DEL') handleDelete();
        else if (btn === '%') handlePercentage();
        else if (btn === '=') handleCalculate();
    }
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            
            const keyMap: {[key: string]: string} = {
                '0':'0', '1':'1', '2':'2', '3':'3', '4':'4', '5':'5', '6':'6', '7':'7', '8':'8', '9':'9',
                '/':'/', '*':'*', '-':'-', '+':'+', '.':'.',
                'Enter': '=', 'Backspace': 'DEL', 'Escape': 'C', '%': '%'
            };

            if (keyMap[e.key]) {
                 e.preventDefault();
                handleClick(keyMap[e.key]);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, display, isResult]);

    if (!isOpen) return null;
    
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return null;

    const buttons = [
        ['C', 'DEL', '%', '/'],
        ['7', '8', '9', '*'],
        ['4', '5', '6', '-'],
        ['1', '2', '3', '+'],
        ['0', '.', '=']
    ];
    
    const getButtonClass = (btn: string) => {
        const isOperator = '/*-+=*'.includes(btn);
        const isFunction = ['C', '%'].includes(btn);

        if (btn === 'DEL') return 'bg-orange-500 hover:bg-orange-600 text-white';
        if (isOperator) return 'bg-primary-500 hover:bg-primary-600 text-white';
        if (isFunction) return 'bg-gray-400 dark:bg-gray-500 hover:bg-gray-500 dark:hover:bg-gray-600 text-black dark:text-white';
        // Default number buttons
        return 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600';
    }


    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xs" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{t('calculator')}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-4 space-y-4">
                    <div className="bg-gray-100 dark:bg-gray-900 rounded p-4 text-right font-mono break-words h-24 flex flex-col justify-end">
                        <div className="text-4xl font-light">{display}</div>
                    </div>
                     <div className="grid grid-cols-4 gap-2">
                         {buttons.flat().map(btn => {
                            const span = btn === '0' ? 'col-span-2' : '';
                             return (<button key={btn} onClick={() => handleClick(btn)} className={`p-4 rounded-lg font-bold text-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-primary-500 ${span} ${getButtonClass(btn)}`}>{btn}</button>)
                         })}
                     </div>
                </div>
            </div>
        </div>,
        portalRoot
    );
};