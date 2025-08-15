import { Product, Settings, DiscountOffer } from '../types';

export interface PriceDetails {
    originalPrice: number;
    finalPrice: number;
    bestOffer: DiscountOffer | null;
    mrp: number | undefined;
    saveAmount: number;
}

export function calculateProductPrice(product: Product, settings: Settings): PriceDetails {
    const { specialOffersEnabled, specialOffers } = settings;
    let finalPrice = product.price;
    let bestOffer: DiscountOffer | null = null;
    let bestDiscount = 0;

    if (specialOffersEnabled && specialOffers) {
        for (const offer of specialOffers) {
            // Skip disabled or expired offers
            if (!offer.enabled || (offer.expiryDate && new Date(offer.expiryDate) < new Date())) {
                continue;
            }

            let isApplicable = false;
            if (offer.appliesTo === 'all') {
                isApplicable = true;
            } else if (offer.appliesTo === 'categories' && offer.targetIds.includes(product.categoryId)) {
                isApplicable = true;
            } else if (offer.appliesTo === 'products' && offer.targetIds.includes(product.id)) {
                isApplicable = true;
            }

            if (isApplicable) {
                let currentDiscount = 0;
                if (offer.discountType === 'percentage') {
                    currentDiscount = product.price * (offer.discountValue / 100);
                } else { // 'fixed'
                    currentDiscount = offer.discountValue;
                }
                
                // Ensure discount doesn't make price negative
                if (product.price - currentDiscount < 0) {
                    currentDiscount = product.price;
                }

                if (currentDiscount > bestDiscount) {
                    bestDiscount = currentDiscount;
                    bestOffer = offer;
                }
            }
        }
    }
    
    finalPrice = product.price - bestDiscount;

    // The "save" amount should be based on the highest price (either MRP or original price)
    const displayPrice = product.mrp && product.mrp > product.price ? product.mrp : product.price;
    const saveAmount = displayPrice - finalPrice;

    return {
        originalPrice: product.price,
        finalPrice,
        bestOffer,
        mrp: product.mrp,
        saveAmount: saveAmount > 0 ? saveAmount : 0,
    };
}
