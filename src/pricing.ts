export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PricingError';
  }
}

export interface CartItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  onSale: boolean;
}

export interface Cart {
  items: CartItem[];
  isMember: boolean;
  couponCode?: string;
}

export interface PricingResult {
  subtotal: number;
  memberDiscount: number;
  couponDiscount: number;
  shippingFee: number;
  total: number;
}

export const MEMBER_DISCOUNT_RATE = 0.1;
export const FREE_SHIPPING_THRESHOLD = 5000;
export const SHIPPING_FEE = 500;

export const COUPON_DISCOUNTS: Record<string, number> = {
  SAVE500: 500,
};

export function calculateSubtotal(cart: Cart): number {
  return cart.items.reduce((sum, item) => {
    if (item.quantity <= 0) {
      throw new PricingError(`数量が不正です: ${item.name} / ${item.quantity}`);
    }
    if (item.unitPrice < 0) {
      throw new PricingError(`単価が不正です: ${item.name} / ${item.unitPrice}`);
    }
    return sum + item.unitPrice * item.quantity;
  }, 0);
}

export function calculateMemberDiscount(cart: Cart): number {
  if (!cart.isMember) {
    return 0;
  }
  const target = cart.items
    .filter((item) => !item.onSale)
    .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return Math.round(target * MEMBER_DISCOUNT_RATE);
}

export function calculateCouponDiscount(cart: Cart): number {
  if (!cart.couponCode) {
    return 0;
  }
  if (cart.isMember) {
    throw new PricingError('会員割引とクーポンは併用できません');
  }
  const amount = COUPON_DISCOUNTS[cart.couponCode];
  if (amount === undefined) {
    throw new PricingError(`無効なクーポンです: ${cart.couponCode}`);
  }
  return amount;
}

export function calculateCharge(cart: Cart): PricingResult {
  if (cart.items.length === 0) {
    return {
      subtotal: 0,
      memberDiscount: 0,
      couponDiscount: 0,
      shippingFee: 0,
      total: 0,
    };
  }

  const subtotal = calculateSubtotal(cart);
  const memberDiscount = calculateMemberDiscount(cart);
  const couponDiscount = calculateCouponDiscount(cart);
  const amountAfterDiscount = subtotal - memberDiscount - couponDiscount;
  const shippingFee = amountAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  return {
    subtotal,
    memberDiscount,
    couponDiscount,
    shippingFee,
    total: amountAfterDiscount + shippingFee,
  };
}
