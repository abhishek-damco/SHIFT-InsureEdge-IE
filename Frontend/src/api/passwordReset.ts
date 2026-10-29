import api from './client';

export const passwordResetApi = {
  request: (email: string) =>
    api.post('/password-reset/request', { email }),

  resend: (email: string) =>
    api.post('/password-reset/resend', { email }),

  validate: (username: string, token: string) =>
    api.post<{ valid: boolean }>('/password-reset/validate', { username, token }).then(r => r.data),

  confirm: (username: string, token: string, newPassword: string) =>
    api.post('/password-reset/confirm', { username, token, newPassword }),
};

export const onboardingApi = {
  validate: (username: string, token: string) =>
    api.post<{ valid: boolean }>('/users/onboarding/validate', { username, token }).then(r => r.data),

  setup: (username: string, token: string, newPassword: string) =>
    api.post('/users/onboarding/setup', { username, token, newPassword }),
};
