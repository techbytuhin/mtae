import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Product } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { calculateProductPrice } from '../utils/priceCalculator';

export interface SelectedComponent {
  slot: string;
  product: Product | null;
}

interface PrintablePCBuilderProps {
  selectedComponents: SelectedComponent[];
  total: number;
}

export const PrintablePCBuilder: React.FC<PrintablePCBuilderProps> = ({ selectedComponents, total }) => {
  const { state } = useContext(AppContext);
  const { t, lang, formatDateTime, currency } = useTranslation();
  const { settings } = state;

  const currencyFormatter = new Intl.NumberFormat(lang, {
    style: 'currency',
    currency: currency,
  });

  return (
    <div style={{ background: 'white', color: 'black', padding: '20px', fontFamily: 'Arial, sans-serif', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>{settings.shopName}</h1>
          <p style={{ margin: '2px 0' }}>{settings.shopAddress}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{t('pc_builder_quotation')}</h2>
          <p style={{ margin: '2px 0' }}>{t('date')}: {formatDateTime(new Date())}</p>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead style={{ backgroundColor: '#f2f2f2' }}>
          <tr>
            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', width: '30%' }}>{t('component')}</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>{t('product_name')}</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', width: '20%' }}>{t('price')}</th>
          </tr>
        </thead>
        <tbody>
          {selectedComponents.map(({ slot, product }) => {
            if (!product) return null;
            const { finalPrice, originalPrice, bestOffer } = calculateProductPrice(product, settings);
            
            return (
              <tr key={slot}>
                <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textTransform: 'capitalize' }}>{t(slot as any)}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{product.name}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>
                  {bestOffer ? (
                    <>
                      <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '11px' }}>{currencyFormatter.format(originalPrice)}</span>
                      <br/>
                      <span style={{ fontWeight: 'bold' }}>{currencyFormatter.format(finalPrice)}</span>
                    </>
                  ) : (
                    currencyFormatter.format(finalPrice)
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 'bold', fontSize: '16px', backgroundColor: '#f2f2f2', borderTop: '2px solid black' }}>
            <td colSpan={2} style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{t('total')}</td>
            <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{currencyFormatter.format(total)}</td>
          </tr>
        </tfoot>
      </table>

      <div style={{ marginTop: '30px', fontSize: '10px', color: '#777' }}>
        <p>{settings.invoiceNotes}</p>
        <p>{settings.invoiceTerms}</p>
      </div>
    </div>
  );
};
