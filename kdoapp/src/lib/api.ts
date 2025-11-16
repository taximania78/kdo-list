// api.ts
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

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
 * Appel à l'endpoint /api/refresh
 */
async function refreshAccessToken() {
  console.log('🔄 [AUTH] Token refresh initiated at:', new Date().toISOString());

  if (isRefreshing) {
    console.log('⏳ [AUTH] Token refresh already in progress, waiting...');
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.warn('⚠️ [AUTH] No refresh token found');
        return;
      }

      // Appel vers /api/refresh/ avec refresh_token
      const response = await axios.post(`${ApiAdress}/api/refresh/`, {
        refresh_token: refreshToken,
      });

      console.log('✅ [AUTH] Token refreshed successfully at:', new Date().toISOString());
      console.log('📅 [AUTH] New token expires:', new Date(jwtDecode<DecodedToken>(response.data.access_token).exp * 1000).toISOString());

      // On stocke les nouveaux tokens
      localStorage.setItem('authToken', response.data.access_token);
      localStorage.setItem('refreshToken', response.data.refresh_token);
    } catch (err) {
      console.error('❌ [AUTH] Token refresh failed:', err);
      console.log('🚪 [AUTH] Logging out user due to refresh failure');
      localStorage.clear();
      window.location.href = '/';
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
      // Vérifier expiration proche
      console.log('Token expiring soon?', isTokenExpiringSoon(accessToken));
      if (isTokenExpiringSoon(accessToken)) {
        await refreshAccessToken();
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
        await refreshAccessToken();

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
        window.location.href = '/';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
