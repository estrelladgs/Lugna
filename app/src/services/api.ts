import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const raw = await AsyncStorage.getItem('@lugna_auth');
  if (raw) {
    const { tokens } = JSON.parse(raw);
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: ((token: string) => void)[] = [];

function drainQueue(newToken: string) {
  refreshQueue.forEach((cb) => cb(newToken));
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;
    try {
      const raw = await AsyncStorage.getItem('@lugna_auth');
      if (!raw) throw new Error('no auth');
      const { user, tokens } = JSON.parse(raw);
      if (!tokens?.refreshToken) throw new Error('no refresh token');

      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken: tokens.refreshToken,
      });

      const newTokens = { accessToken: data.accessToken, refreshToken: data.refreshToken };
      await AsyncStorage.setItem('@lugna_auth', JSON.stringify({ user, tokens: newTokens }));

      drainQueue(newTokens.accessToken);
      original.headers.Authorization = `Bearer ${newTokens.accessToken}`;
      return api(original);
    } catch {
      refreshQueue = [];
      await AsyncStorage.removeItem('@lugna_auth');
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);
