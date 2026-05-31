export const colors = {
  background: '#C2D8E8',
  backgroundLight: '#D4E6F1',
  white: '#FFFFFF',
  black: '#1A1A1A',
  textMuted: '#6B7280',
  inputBorder: '#E5E7EB',
  primary: '#FFFFFF',
  buttonText: '#1A1A1A',
  link: '#1A1A1A',
  dotActive: '#1A1A1A',
  dotInactive: '#A0B4C3',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 24,
  pill: 50,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '800' as const, color: colors.black },
  h2: { fontSize: 26, fontWeight: '800' as const, color: colors.black },
  h3: { fontSize: 20, fontWeight: '700' as const, color: colors.black },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.black, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textMuted },
  button: { fontSize: 17, fontWeight: '700' as const, color: colors.buttonText },
  label: { fontSize: 14, fontWeight: '600' as const, color: colors.black },
};
