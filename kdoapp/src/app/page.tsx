'use client';

import { useEffect, FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import config from '../../config.json';
import { jwtDecode } from 'jwt-decode';

const ApiAdress = config.apiAddress;
const theme = config.theme;

interface DecodedToken {
  sub: number;
  username: string;
  isAdmin: boolean;
  isMegaAdmin: boolean;
  exp: number; // Timestamp d'expiration
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      const admin = localStorage.getItem('isAdmin');
      if (token) {
        try {
          const decoded = jwtDecode<DecodedToken>(token);
          const isExpired = decoded.exp < Date.now() / 1000;

          if (isExpired) {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
              localStorage.clear();
              router.push('/');
              return;
            }
            const isExpired = decoded.exp < Date.now() / 1000;
            if (isExpired) {
              localStorage.clear();
              router.push('/');
              return;
            }
            const response = await fetch(`${ApiAdress}/api/refresh/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken }),
            });
            if (!response.ok) {
              localStorage.clear();
              router.push('/');
              return;
            }
            const data = await response.json();
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('refreshToken', data.refresh_token);
          } else {
            if (admin == 'true') {
              router.push('/admin');
            } else {
              router.push('/list');
            }
          }
        } catch (error) {
          console.error('Token verification error:', error);
          router.push('/login');
          // Gérer l'erreur selon les besoins, par exemple, laisser l'utilisateur se connecter à nouveau
        }
      }
    };

    checkAuth();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new URLSearchParams();
    formData.append('username', event.currentTarget.username.value);
    formData.append('password', event.currentTarget.password.value);

    try {
      const response = await fetch(`${ApiAdress}/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(), // ✅ Convertir les données en URL-encoded
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.access_token);
        localStorage.setItem('refreshToken', data.refresh_token);
        localStorage.setItem('isAdmin', data.isAdmin);
        localStorage.setItem('user', data.username);

        const firstConnection = data.firstConnection;
        if (firstConnection) {
          router.push('/first-connection');
          return;
        }
        const admin = data.isAdmin;
        if (admin) {
          router.push('/admin');
        } else {
          router.push('/list');
        }
      } else {
        setError('Invalid username or password.');
      }
    } catch (err) {
      setError(`An error occurred. Please try again. ${err}`);
    }
  }

  return (
    <div className="flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Se connecter
          </h2>
        </div>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="bg-white appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nom d'utilisateur"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="bg-white appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Mot de passe"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className={`
    relative
    w-full
    flex
    justify-center
    py-2
    px-4
    border
    border-transparent
    text-md
    font-medium
    rounded-md
    text-white
    ${
      theme === 'christmas'
        ? 'bg-red-600 hover:bg-green-700'
        : 'bg-sky-600 hover:bg-sky-700'
    }
  `}
            >
              Se connecter
            </button>
          </div>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 italic">
            Si vous avez oublié votre mot de passe, contactez moi.
          </p>
        </div>
      </div>
    </div>
  );
}
