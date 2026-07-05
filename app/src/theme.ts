export const colors = {
  background: '#D5E9F4',
  backgroundLight: '#99BDDF',
  white: '#D5E9F4',
  black: '#000000',
  textMuted: '#2F4F75',
  inputBorder: '#99BDDF',
  primary: '#2F4F75',
  buttonText: '#2F4F75',
  link: '#2F4F75',
  dotActive: '#2F4F75',
  dotInactive: '#99BDDF',
  scoreHigh: '#2F4F75',
  scoreMedium: '#99BDDF',
  scoreLow: '#E4572E',
  header: '#99BDDF',
  alert: '#E4572E',
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
  h1: { fontSize: 34, fontWeight: '800' as const, color: colors.black },
  h2: { fontSize: 28, fontWeight: '800' as const, color: colors.black },
  h3: { fontSize: 22, fontWeight: '700' as const, color: colors.black },
  body: { fontSize: 16, fontWeight: '400' as const, color: colors.black, lineHeight: 23 },
  caption: { fontSize: 14, fontWeight: '400' as const, color: colors.textMuted },
  button: { fontSize: 18, fontWeight: '700' as const, color: colors.buttonText },
  label: { fontSize: 15, fontWeight: '600' as const, color: colors.black },
};
