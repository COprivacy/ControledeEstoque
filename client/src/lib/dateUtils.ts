export function getDaysUntilExpiry(vencimento: string | null): number | null {
  if (!vencimento) return null;
  
  const today = new Date();
  const expiryDate = new Date(vencimento);
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export function getExpiryStatus(vencimento: string | null): 'expired' | 'critical' | 'warning' | 'ok' | null {
  const days = getDaysUntilExpiry(vencimento);
  
  if (days === null) return null;
  if (days < 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 30) return 'warning';
  return 'ok';
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}
