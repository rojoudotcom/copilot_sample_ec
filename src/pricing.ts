/** 料金計算の入力が不正なときに投げるエラー */
export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PricingError';
  }
}

/** 買い物かごの1品 */
export interface CartItem {
  /** 商品 ID */
  id: string;
  /** 商品名 */
  name: string;
  /** 単価（円） */
  unitPrice: number;
  /** 数量 */
  quantity: number;
  /** セール品かどうか */
  onSale: boolean;
}

/** 買い物かご */
export interface Cart {
  /** かごに入っている商品 */
  items: CartItem[];
  /** 会員かどうか */
  isMember: boolean;
  /** 使うクーポンのコード（使わないときは省略） */
  couponCode?: string;
}

/** 料金計算の結果（金額はすべて円） */
export interface PricingResult {
  /** 小計 */
  subtotal: number;
  /** 会員割引の額 */
  memberDiscount: number;
  /** クーポン割引の額 */
  couponDiscount: number;
  /** 送料 */
  shippingFee: number;
  /** 支払う合計 */
  total: number;
}

/** 会員割引の率（10%） */
export const MEMBER_DISCOUNT_RATE = 0.1;
/** この金額以上で送料が無料になる（割引後の金額で判定） */
export const FREE_SHIPPING_THRESHOLD = 5000;
/** 送料（円） */
export const SHIPPING_FEE = 500;

/** 使えるクーポンと、その割引額（円） */
export const COUPON_DISCOUNTS: Record<string, number> = {
  SAVE500: 500,
};

/** 小計（単価 × 数量 の合計）を計算する。数量や単価が不正ならエラー */
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

/** 会員割引の額を計算する。会員でなければ0円。セール品は対象外 */
export function calculateMemberDiscount(cart: Cart): number {
  if (!cart.isMember) {
    return 0;
  }
  const target = cart.items
    .filter((item) => !item.onSale)
    .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return Math.round(target * MEMBER_DISCOUNT_RATE);
}

/** クーポン割引の額を計算する。会員割引との併用や無効なコードはエラー */
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

/** 小計・割引・送料をまとめて計算し、支払う合計を返す */
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
