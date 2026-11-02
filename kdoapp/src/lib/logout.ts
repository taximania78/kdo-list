import { clearAuthStorage, withRefreshLock } from '@/lib/auth';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

export async function logout(): Promise<void> {
  // Sous verrou : un refresh en cours dans un autre onglet ne peut pas réécrire
  // un jeton tourné après notre nettoyage (ce qui annulerait la déconnexion).
  await withRefreshLock(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        // Révoque la session côté serveur (réponse 204, aucun Authorization requis)
        await fetch(`${ApiAdress}/api/logout/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
          keepalive: true,
          // Borne la durée de détention du verrou si le serveur ne répond pas
          signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(5000) : undefined,
        });
      } catch (error) {
        // La déconnexion locale a lieu quand même (erreur réseau ou délai dépassé)
        console.error('Logout error:', error);
      }
    }
    clearAuthStorage();
  });
  window.location.href = '/';
}
