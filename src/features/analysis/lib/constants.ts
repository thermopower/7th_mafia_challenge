export const ANALYSIS_TYPE_LABELS = {
  monthly: '월간 운세',
  yearly: '신년 운세',
  lifetime: '평생 운세',
} as const;

export const ANALYSIS_TYPE_OPTIONS = [
  { value: 'monthly' as const, label: '월간 운세' },
  { value: 'yearly' as const, label: '신년 운세' },
  { value: 'lifetime' as const, label: '평생 운세' },
] as const;

export const MODEL_LABELS = {
  'gemini-2.5-flash': 'Flash',
  'gemini-2.5-pro': 'Pro',
} as const;
