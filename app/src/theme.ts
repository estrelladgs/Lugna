export const colors = {
  background: '#F0E9F9',
  backgroundLight: '#CBBBD6',
  white: '#D5E9F4',
  black: '#2F4F75',
  textMuted: '#9A9CC2',
  inputBorder: '#CBBBD6',
  primary: '#2F4F75',
  buttonText: '#2F4F75',
  link: '#2F4F75',
  dotActive: '#2F4F75',
  dotInactive: '#CBBBD6',
  scoreHigh: '#2F4F75',
  scoreMedium: '#99BDDF',
  scoreLow: '#9A9CC2',
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
