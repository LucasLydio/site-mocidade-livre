export function formatBRLFromCents(cents) {
  const value = (Number(cents) || 0) / 100;
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
