// api.ts
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { redirectToLogin, withRefreshLock } from '@/lib/auth';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

interface DecodedToken {
  sub: number;
  username: string;
  isAdmin: boolean;
  isMegaAdmin: boolean;
  exp: number; // Timestamp d'expiration
}

/**
 * Crée l'instance axios
 */
const api = axios.create({
  baseURL: ApiAdress, // ex: "http://localhost:8000"
});

/**
 * Vérifie si le token expire bientôt
 */
function isTokenExpiringSoon(token: string, thresholdSeconds = 120): boolean {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp - now < thresholdSeconds;
  } catch (e) {
    console.error('Erreur lors du décodage du token:', e);
    return true; // S'il y a une erreur, on considère expiré
  }
}

// Variable pour éviter plusieurs refresh simultanés
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

/**
 * Vide le stockage seulement si le refresh token stocké est encore celui envoyé
 * (null si aucun n'a été envoyé) : sinon un autre onglet vient d'y écrire des jetons
 * frais (changement de mot de passe, refresh) qu'il ne faut pas effacer.
 */
function clearIfUnchanged(sentRefreshToken: string | null): void {
  if (localStorage.getItem('refreshToken') === sentRefreshToken) {
    localStorage.clear();
  }
}

/**
 * Appel réseau vers /api/refresh/ (exécuté sous verrou).
 * seenToken : le jeton d'accès que l'appelant a vu (expirant ou rejeté en 401).
 */
async function doRefresh(seenToken: string | null | undefined, onSend: (refreshToken: string) => void): Promise<void> {
  // Si le jeton stocké diffère de celui de l'appelant, un autre onglet a déjà rafraîchi
  const currentAccess = localStorage.getItem('authToken');
  if (seenToken && currentAccess && currentAccess !== seenToken) {
    console.log('⏭️ [AUTH] Token already refreshed by another tab');
    return;
  }

  // Relu sous verrou : jamais de rejeu d'un refresh token déjà tourné
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    // Plus de refresh token (ex. un autre onglet a échoué) : échec, l'appelant redirige
    throw new Error('No refresh token found');
  }

  onSend(refreshToken);
  try {
    // Appel vers /api/refresh/ avec refresh_token
    const response = await axios.post(
      `${ApiAdress}/api/refresh/`,
      { refresh_token: refreshToken },
      { timeout: 15000 }
    );

    console.log('✅ [AUTH] Token refreshed successfully at:', new Date().toISOString());
    console.log('📅 [AUTH] New token expires:', new Date(jwtDecode<DecodedToken>(response.data.access_token).exp * 1000).toISOString());

    // On stocke les nouveaux tokens
    localStorage.setItem('authToken', response.data.access_token);
    localStorage.setItem('refreshToken', response.data.refresh_token);
  } catch (err) {
    // Nettoyage sous verrou : un onglet en attente ne doit pas rejouer ce refresh token
    clearIfUnchanged(refreshToken);
    throw err;
  }
}

/**
 * Appel à l'endpoint /api/refresh
 */
export async function refreshAccessToken(seenToken?: string | null) {
  console.log('🔄 [AUTH] Token refresh initiated at:', new Date().toISOString());

  if (isRefreshing) {
    console.log('⏳ [AUTH] Token refresh already in progress, waiting...');
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    let sentRefreshToken: string | null = null;
    try {
      await withRefreshLock(() =>
        doRefresh(seenToken, (token) => {
          sentRefreshToken = token;
        })
      );
    } catch (err) {
      console.error('❌ [AUTH] Token refresh failed:', err);
      console.log('🚪 [AUTH] Logging out user due to refresh failure');
      clearIfUnchanged(sentRefreshToken);
      redirectToLogin();
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Intercepteur de requête
 * => Ajoute le token, vérifie si expiration proche
 */
api.interceptors.request.use(
  async (config) => {
    const accessToken = localStorage.getItem('authToken');
    if (accessToken) {
      // Vérifier expiration proche et rafraîchir si nécessaire
      if (isTokenExpiringSoon(accessToken)) {
        await refreshAccessToken(accessToken);
      }
      // Mettre à jour le header Authorization
      const newToken = localStorage.getItem('authToken');
      if (newToken && config.headers) {
        config.headers.Authorization = `Bearer ${newToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Intercepteur de réponse
 * => Si 401, on tente un refresh (si ce n’est pas déjà fait),
 *    puis on rejoue la requête initiale
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Vérifier code 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Empêche boucle infinie

      try {
        const rejectedToken = String(originalRequest.headers?.Authorization ?? '').replace(/^Bearer /, '') || null;
        await refreshAccessToken(rejectedToken);

        // Récupérer le nouveau token
        const newToken = localStorage.getItem('authToken');
        if (newToken) {
          // Mettre à jour le header Authorization
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        // On retente la requête initiale
        return api(originalRequest);
      } catch (err) {
        // Si le refresh a échoué => redirection
        console.error('Échec du refresh dans le response interceptor', err);
        localStorage.clear();
        redirectToLogin();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
