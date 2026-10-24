import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminLogin from './AdminLogin';
import { AuthProvider } from './AuthProvider';
import { ApiError } from './lib/api';

vi.mock('./adminApi', () => ({
  loginAdmin: vi.fn(),
  logoutAdmin: vi.fn(),
  onForcedLogout: vi.fn(),
  refreshAdminSession: vi.fn().mockRejectedValue(new Error('No session')),
  setAdminAccessToken: vi.fn(),
}));

import { loginAdmin } from './adminApi';

describe('AdminLogin', () => {
  beforeEach(() => {
    vi.mocked(loginAdmin).mockReset();
  });

  it('shows the Retry-After wait time for a 429 response', async () => {
    vi.mocked(loginAdmin).mockRejectedValue(
      new ApiError({}, 429, new Headers({ 'Retry-After': '42' })),
    );
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <AdminLogin />
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText('Correo'), 'admin@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Demasiados intentos. Inténtalo de nuevo en 42 segundos.',
      );
    });
    expect(screen.getByRole('alert')).toHaveFocus();
  });
});
