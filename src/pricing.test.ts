import { describe, expect, it } from 'vitest';
import { calculateCharge, PricingError, type Cart, type CartItem } from './pricing';

function item(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'item-1',
    name: 'サンプル商品',
    unitPrice: 1000,
    quantity: 1,
    onSale: false,
    ...overrides,
  };
}

function cart(overrides: Partial<Cart> = {}): Cart {
  return {
    items: [item()],
    isMember: false,
    ...overrides,
  };
}

function immutableCart(overrides: Partial<Cart> = {}): Cart {
  const input = cart(overrides);
  input.items.forEach((cartItem) => Object.freeze(cartItem));
  Object.freeze(input.items);
  return Object.freeze(input);
}

describe('calculateCharge 正常系', () => {
  it('小計は単価×数量の合計になる', () => {
    const result = calculateCharge(
      cart({ items: [item({ unitPrice: 1200, quantity: 2 }), item({ id: 'item-2', unitPrice: 800, quantity: 1 })] })
    );

    expect(result.subtotal).toBe(3200);
  });

  it('セール品は会員割引の対象外になる', () => {
    const result = calculateCharge(
      cart({
        isMember: true,
        items: [item({ unitPrice: 2000 }), item({ id: 'item-2', unitPrice: 1000, onSale: true })],
      })
    );

    expect(result.memberDiscount).toBe(200);
  });

  it('会員割引の端数は切り捨てになる', () => {
    const result = calculateCharge(cart({ isMember: true, items: [item({ unitPrice: 1995 })] }));

    expect(result.memberDiscount).toBe(199);
  });

  it('クーポンは500円引きになる', () => {
    const result = calculateCharge(cart({ couponCode: 'SAVE500', items: [item({ unitPrice: 3000 })] }));

    expect(result.couponDiscount).toBe(500);
    expect(result.total).toBe(3000);
  });

  it('送料無料の基準に届かない金額では500円かかる', () => {
    const result = calculateCharge(cart({ items: [item({ unitPrice: 3500 })] }));

    expect(result.shippingFee).toBe(500);
    expect(result.total).toBe(4000);
  });

  it('送料無料の境界（割引後ちょうど5,000円）は無料になる', () => {
    const result = calculateCharge(cart({ items: [item({ unitPrice: 5000 })] }));

    expect(result.shippingFee).toBe(0);
    expect(result.total).toBe(5000);
  });

  it('空のカートは合計0円になる', () => {
    const result = calculateCharge(cart({ items: [] }));

    expect(result.total).toBe(0);
    expect(result.shippingFee).toBe(0);
  });

  it('ラッピング未選択では料金が加算されない', () => {
    const result = calculateCharge(immutableCart({ items: [item({ unitPrice: 1000 })] }));

    expect(result.giftWrappingFee).toBe(0);
    expect(result.total).toBe(1500);
  });

  it('ラッピング選択時は合計に150円が加算される', () => {
    const input = immutableCart({ giftWrapping: true, items: [item({ unitPrice: 1000 })] });
    const result = calculateCharge(input);

    expect(result.giftWrappingFee).toBe(150);
    expect(result.total).toBe(1650);
    expect(Number.isInteger(result.total)).toBe(true);
    expect(input.giftWrapping).toBe(true);
  });

  it('ラッピング料金を含めず送料無料の境界を判定する', () => {
    const result = calculateCharge(
      immutableCart({ giftWrapping: true, items: [item({ unitPrice: 4999 })] })
    );

    expect(result.shippingFee).toBe(500);
    expect(result.total).toBe(5649);
  });

  it('商品額が送料無料の境界ちょうどならラッピング料金を加えても送料無料になる', () => {
    const result = calculateCharge(
      immutableCart({ giftWrapping: true, items: [item({ unitPrice: 5000 })] })
    );

    expect(result.shippingFee).toBe(0);
    expect(result.total).toBe(5150);
  });

  it('空カートでラッピングを選択してもラッピング料金は0円になる', () => {
    const result = calculateCharge(immutableCart({ giftWrapping: true, items: [] }));

    expect(result.giftWrappingFee).toBe(0);
    expect(result.total).toBe(0);
    expect(Number.isInteger(result.total)).toBe(true);
  });
});

describe('calculateCharge 異常系', () => {
  it('数量が0以下なら PricingError を投げる', () => {
    expect(() => calculateCharge(cart({ items: [item({ quantity: 0 })] }))).toThrow(PricingError);
  });

  it('単価がマイナスなら PricingError を投げる', () => {
    expect(() => calculateCharge(cart({ items: [item({ unitPrice: -1 })] }))).toThrow(PricingError);
  });

  it('無効なクーポンコードなら PricingError を投げる', () => {
    expect(() => calculateCharge(cart({ couponCode: 'UNKNOWN' }))).toThrow(PricingError);
  });

  it('会員割引とクーポンの併用は PricingError を投げる', () => {
    expect(() => calculateCharge(cart({ isMember: true, couponCode: 'SAVE500' }))).toThrow(PricingError);
  });
});
