export function getFXRate(to: string): number {
  if (to === 'GBP') return 0.79;
  if (to === 'EUR') return 0.92;
  if (to === 'BTC') return 0.000015;
  if (to === 'USD') return 1;
  return 1;
}

export function getFXSymbol(to: string): string {
  if (to === 'GBP') return '£';
  if (to === 'EUR') return '€';
  if (to === 'BTC') return '₿';
  return '$';
}
