import { api } from './api';

export const PRIVACY_POLICY_VERSION = '2026-07-07';

interface ConsentStatus {
  granted: boolean;
  policyVersion?: string;
  grantedAt?: string;
}

export const consentService = {
  getCameraConsent: async (): Promise<ConsentStatus> => {
    const { data } = await api.get<ConsentStatus>('/users/me/consent');
    return data;
  },

  recordCameraConsent: async (): Promise<ConsentStatus> => {
    const { data } = await api.post<ConsentStatus>('/users/me/consent', {
      policyVersion: PRIVACY_POLICY_VERSION,
    });
    return data;
  },
};
