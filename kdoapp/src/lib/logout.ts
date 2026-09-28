import { clearAuthStorage } from '@/lib/auth';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

export async function logout(): Promise<void> {
  const token = localStorage.getItem('authToken');
  if (token) {
    try {
      await fetch(`${ApiAdress}/api/auth/logout/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      // La déconnexion locale a lieu quand même
      console.error('Logout error:', error);
    }
  }
  clearAuthStorage();
  window.location.href = '/';
}
