export const statusCodes = { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' } as const;

export function isErrorWithCode(_err: unknown): _err is { code: string } {
  return false;
}

export const GoogleSignin = {
  configure: () => {},
  hasPlayServices: async () => true,
  signIn: async (): Promise<never> => {
    throw new Error('El login con Google no está disponible en la versión web.');
  },
};
