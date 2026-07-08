import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const PRIVACY_POLICY_VERSION = '2026-07-07';

const CONSENT_CACHE_KEY = '@lugna_camera_consent_granted';

interface ConsentStatus {
  granted: boolean;
  policyVersion?: string;
  grantedAt?: string;
}

export const consentService = {
  getCameraConsent: async (): Promise<ConsentStatus> => {
    // Once granted, trust the local cache instead of re-checking the server every
    // time the camera opens — a slow/flaky backend shouldn't make us re-ask for
    // consent that was already given.
    const cached = await AsyncStorage.getItem(CONSENT_CACHE_KEY);
    if (cached === 'true') {
      return { granted: true };
    }
    const { data } = await api.get<ConsentStatus>('/users/me/consent');
    if (data.granted) {
      await AsyncStorage.setItem(CONSENT_CACHE_KEY, 'true');
    }
    return data;
  },

  recordCameraConsent: async (): Promise<ConsentStatus> => {
    const { data } = await api.post<ConsentStatus>('/users/me/consent', {
      policyVersion: PRIVACY_POLICY_VERSION,
    });
    await AsyncStorage.setItem(CONSENT_CACHE_KEY, 'true');
    return data;
  },
};
