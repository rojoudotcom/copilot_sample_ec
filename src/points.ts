/** 購入ポイントの計算の入力 */
export interface PointInput {
  /** 支払う金額（円） */
  amount: number;
  /** 会員かどうか */
  isMember: boolean;
}

/** この金額ごとに1ポイント付く（円） */
export const YEN_PER_POINT = 100;
/** 会員のポイント倍率 */
export const MEMBER_POINT_MULTIPLIER = 2;

/** 1回の購入で付くポイントを計算する。100円未満の端数にはポイントが付かない */
export function calculatePoints(input: PointInput): number {
  const basePoints = Math.floor(input.amount / YEN_PER_POINT);
  if (input.isMember) {
    return basePoints * MEMBER_POINT_MULTIPLIER;
  }
  return basePoints;
}
