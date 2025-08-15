import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Product } from '../types';
import { PrinterIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../hooks/useTranslation';
import { PrintPCBuilderModal } from '../components/PrintPCBuilderModal';
import { calculateProductPrice } from '../utils/priceCalculator';

// Component slots for the PC builder
const componentSlots = [
  'cpu', 'cpu_cooler', 'motherboard', 'ram_1', 'ram_2', 
  'storage_1', 'storage_2', 'graphics_card', 'power_supply', 'casing', 
  'monitor', 'keyboard', 'mouse', 'headphone', 'ups'
];

const PCBuilder: React.FC = () => {
  const { state } = useContext(AppContext);
  const { products, settings } = state;
  const { t, lang, currency } = useTranslation();
  const [selectedProducts, setSelectedProducts] = useState<Record<string, string | null>>(
    componentSlots.reduce((acc, slot) => ({ ...acc, [slot]: null }), {})
  );
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  
  // Memoize products suitable for building a PC
  const pcComponents = useMemo(() => {
    const pcCategoryNames = ['Electronics', 'Computer Parts'];
    const pcCategoryIds = settings.productCategories
        .filter(c => c.enabled && pcCategoryNames.includes(c.name))
        .map(c => c.id);
        
    return products.filter(p => !p.isDeleted && pcCategoryIds.includes(p.categoryId));
  }, [products, settings.productCategories]);

  const handleSelectProduct = (slot: string, productId: string) => {
    setSelectedProducts(prev => ({ ...prev, [slot]: productId === 'none' ? null : productId }));
  };

  const selectedData = useMemo(() => {
    return Object.entries(selectedProducts)
      .map(([slot, productId]) => {
        const product = productId ? products.find(p => p.id === productId) : null;
        return { slot, product };
      })
      .filter(item => item.product);
  }, [selectedProducts, products]);

  const totalPrice = useMemo(() => {
    return selectedData.reduce((total, item) => {
        if (!item.product) return total;
        const { finalPrice } = calculateProductPrice(item.product, settings);
        return total + finalPrice;
    }, 0);
  }, [selectedData, settings]);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat(lang, {
    style: 'currency',
    currency: currency,
  }), [lang, currency]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t('pc_builder')}</h1>
          <button 
            onClick={() => setIsPrintModalOpen(true)} 
            className="bg-primary-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-600 flex items-center transition-colors disabled:bg-primary-400"
            disabled={selectedData.length === 0}
          >
            <PrinterIcon className="h-5 w-5 mr-2" />
            {t('print_quotation')}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div className="p-6 space-y-4">
            {componentSlots.map(slot => (
              <div key={slot} className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 border-b dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                <label htmlFor={slot} className="font-semibold capitalize md:text-right">
                  {t(slot as any)}
                </label>
                <div className="md:col-span-2">
                  <select
                    id={slot}
                    value={selectedProducts[slot] || 'none'}
                    onChange={(e) => handleSelectProduct(slot, e.target.value)}
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="none">{t('select_a_product')}</option>
                    {pcComponents.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({currencyFormatter.format(p.price)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-6 flex justify-end items-center">
            <span className="text-xl font-bold">{t('total')}:</span>
            <span className="text-2xl font-bold ml-4 text-primary-600 dark:text-primary-400">
              {currencyFormatter.format(totalPrice)}
            </span>
          </div>
        </div>
      </div>
      {isPrintModalOpen && (
        <PrintPCBuilderModal
          selectedComponents={selectedData}
          total={totalPrice}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </>
  );
};

export default PCBuilder;
