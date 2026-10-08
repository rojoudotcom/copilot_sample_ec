// 買い物かごの画面。計算はすべて src/pricing.ts の calculateCharge に任せる
import { calculateCharge, PricingError, type Cart, type CartItem } from '../src/pricing';

const items: CartItem[] = [
  { id: 'mouse', name: 'ワイヤレスマウス', unitPrice: 2980, quantity: 1, onSale: false },
  { id: 'cable', name: 'USB-C ケーブル', unitPrice: 980, quantity: 2, onSale: true },
  { id: 'note', name: 'ノート（A5）', unitPrice: 350, quantity: 3, onSale: false },
];

const yen = (n: number) => `${n.toLocaleString('ja-JP')}円`;
const minus = (n: number) => (n > 0 ? `−${yen(n)}` : yen(0));
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function renderItems() {
  $('items').innerHTML = items
    .map(
      (item, i) => `
      <li class="item">
        <span class="name">${item.name}${item.onSale ? '<span class="sale">セール</span>' : ''}</span>
        <span class="price">${yen(item.unitPrice)}</span>
        <span class="qty">
          <button data-i="${i}" data-d="-1" aria-label="減らす">−</button>
          <span>${item.quantity}</span>
          <button data-i="${i}" data-d="1" aria-label="増やす">＋</button>
        </span>
        <span class="amount">${yen(item.unitPrice * item.quantity)}</span>
      </li>`
    )
    .join('');
}

function renderSummary() {
  const coupon = $<HTMLInputElement>('coupon').value.trim();
  const cart: Cart = {
    items,
    isMember: $<HTMLInputElement>('member').checked,
    couponCode: coupon === '' ? undefined : coupon,
    giftWrapping: $<HTMLInputElement>('gift-wrapping').checked,
  };
  const error = $('error');
  try {
    const r = calculateCharge(cart);
    $('summary').innerHTML = `
      <dt>小計</dt><dd>${yen(r.subtotal)}</dd>
      <dt>会員割引（10%・セール品を除く）</dt><dd class="minus">${minus(r.memberDiscount)}</dd>
      <dt>クーポン割引</dt><dd class="minus">${minus(r.couponDiscount)}</dd>
      <dt>送料（5,000円以上で無料）</dt><dd>${yen(r.shippingFee)}</dd>
      <dt>ギフトラッピング</dt><dd>${yen(r.giftWrappingFee)}</dd>
      <dt class="total">合計</dt><dd class="total">${yen(r.total)}</dd>`;
    error.hidden = true;
  } catch (e) {
    if (!(e instanceof PricingError)) throw e;
    $('summary').innerHTML = '';
    error.textContent = e.message;
    error.hidden = false;
  }
}

$('items').addEventListener('click', (ev) => {
  const b = (ev.target as HTMLElement).closest('button');
  if (!b) return;
  const item = items[Number(b.dataset.i)];
  item.quantity = Math.max(0, item.quantity + Number(b.dataset.d));
  renderItems();
  renderSummary();
});
$('member').addEventListener('change', renderSummary);
$('coupon').addEventListener('input', renderSummary);
$('gift-wrapping').addEventListener('change', renderSummary);

renderItems();
renderSummary();
