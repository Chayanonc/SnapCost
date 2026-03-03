/**
 * แปลงตัวเลขเป็น string ราคา (2 ทศนิยม, มี comma)
 * @example formatPrice(1234567.5) → "1,234,567.50"
 * @example formatPrice("invalid")  → "0.00"
 */
export const formatPrice = (
  amount: number | string | null | undefined,
): string => {
  const num = Number(amount);

  if (amount === null || amount === undefined || amount === "" || isNaN(num)) {
    return "0.00";
  }

  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * แปลง string ราคา (มี comma) กลับเป็น number
 * @example parsePrice("1,234,567.50") → 1234567.5
 */
export const parsePrice = (value: string | null | undefined): number => {
  if (!value) return 0;
  const cleaned = value.replace(/,/g, "");
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
};
