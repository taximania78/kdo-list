import { clearAuthStorage } from '@/lib/auth';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (refreshToken) {
    try {
      // Révoque la session côté serveur (réponse 204, aucun Authorization requis)
      await fetch(`${ApiAdress}/api/logout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
        keepalive: true,
      });
    } catch (error) {
      // La déconnexion locale a lieu quand même
      console.error('Logout error:', error);
    }
  }
  clearAuthStorage();
  window.location.href = '/';
}
