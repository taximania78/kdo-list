'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Mountains_of_Christmas, Atma } from 'next/font/google';
import { jwtDecode } from 'jwt-decode';
import { usePathname } from 'next/navigation';

const mountains_of_christmas = Mountains_of_Christmas({
  weight: '700',
  subsets: ['latin'],
});

const knewave = Atma({
  weight: '500',
  subsets: ['latin'],
});

const theme = process.env.THEME || 'default';
const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

interface DecodedToken {
  sub: number;
  username: string;
  isAdmin: boolean;
  isMegaAdmin: boolean;
  exp: number; // Timestamp d'expiration
}

export const Nav = () => {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('authToken');

      if (token) {
        try {
          const decoded = jwtDecode<DecodedToken>(token);
          const isExpired = decoded.exp < Date.now() / 1000;

          if (!isExpired) {
            setIsUserLoggedIn(true);
            setUsername(localStorage.getItem('user'));
            setIsAdmin(localStorage.getItem('isAdmin'));
          } else {
            setIsUserLoggedIn(false);
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du token:', error);
          setIsUserLoggedIn(false);
        }
      } else {
        setIsUserLoggedIn(false);
      }
    };

    checkToken();
  }, [pathname]);

  const handleLogout = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const response = await fetch(`${ApiAdress}/api/auth/logout/`, {
          method: 'POST',
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          console.log('Déconnexion validée');
        } else {
          console.log('Réponse invalide lors de la déconnexion');
        }
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
      }
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('user');
    setIsUserLoggedIn(false);
    window.location.href = '/';
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="w-full border-b border-gray-300 relative">
      <div className="px-4">
        <div
          className={
            theme === 'christmas'
              ? mountains_of_christmas.className
              : knewave.className
          }
        >
          <nav className="flex items-center justify-between py-4">
            <div>
              {isAdmin === 'false' || !isAdmin ? (
                <Link
                  href={`${isUserLoggedIn ? '/list' : '/'}`}
                  className="flex gap-2 items-center"
                >
                  <Image
                    src={
                      theme === 'christmas' ? 'logo-christmas.svg' : 'logo.svg'
                    }
                    alt="KDO liste logo"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                  <p className="text-2xl logo_text">{`${theme == 'christmas' ? 'Liste de Noël' : "Liste d'anniversaire"}`}</p>
                </Link>
              ) : username === 'Mathieu' ? (
                <Link
                  href={`${isUserLoggedIn ? '/list?user=Personne' : '/'}`}
                  className="flex gap-2 items-center"
                >
                  <Image
                    src={
                      theme === 'christmas' ? 'logo-christmas.svg' : 'logo.svg'
                    }
                    alt="KDO liste logo"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                  <p className="text-2xl logo_text">{`${theme == 'christmas' ? 'Liste de Noël' : "Liste d'anniversaire"}`}</p>
                </Link>
              ) : (
                <Link
                  href={`${isUserLoggedIn ? '/list?user=Mathieu' : '/'}`}
                  className="flex gap-2 items-center"
                >
                  <Image
                    src={
                      theme === 'christmas' ? 'logo-christmas.svg' : 'logo.svg'
                    }
                    alt="KDO liste logo"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                  <p className="text-2xl logo_text">{`${theme == 'christmas' ? 'Liste de Noël' : "Liste d'anniversaire"}`}</p>
                </Link>
              )}
            </div>
            {isUserLoggedIn && (
              <>
                <div className="md:hidden">
                  <button onClick={toggleMenu} className="p-2 text-gray-600">
                    {isMenuOpen ? 'Fermer' : 'Menu'}
                  </button>
                </div>
                <div className="hidden md:flex gap-8">
                  {isAdmin === 'false' ? (
                    <>
                      <Link
                        href="/list"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Liste complète
                      </Link>
                      <Link
                        href="/list?user=Personne"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Liste Personne
                      </Link>
                      <Link
                        href="/list?user=Mathieu"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Liste Mathieu
                      </Link>
                    </>
                  ) : username === 'Mathieu' ? (
                    <>
                      <Link
                        href="/admin/superadmin"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Admin
                      </Link>
                      <Link
                        href="/admin"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Modifier la liste
                      </Link>
                      <Link
                        href="/list?user=Personne"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Liste Personne
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/admin"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Modifier la liste
                      </Link>
                      <Link
                        href="/list?user=Mathieu"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Liste Mathieu
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block px-4 py-2 text-red-500 hover:bg-gray-100"
                  >
                    Déconnexion
                  </button>
                </div>
              </>
            )}
          </nav>
        </div>
      </div>
      {isUserLoggedIn && (
        <div
          className={`mobile-menu ${isMenuOpen ? 'block' : 'hidden'} md:hidden absolute top-full left-0 right-0 z-10`}
        >
          <div className="bg-white shadow-md rounded-b-md">
            <div className="px-4 py-2">
              {isAdmin === 'false' ? (
                <>
                  <Link
                    href="/list"
                    onClick={toggleMenu}
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Liste complète
                  </Link>
                  <Link
                    href="/list?user=Personne"
                    onClick={toggleMenu}
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Liste Personne
                  </Link>
                  <Link
                    href="/list?user=Mathieu"
                    onClick={toggleMenu}
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Liste Mathieu
                  </Link>
                </>
              ) : username === 'Mathieu' ? (
                <>
                  <Link
                    href="/admin/superadmin"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Admin
                  </Link>
                  <Link
                    href="/admin"
                    onClick={toggleMenu}
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Modif. liste
                  </Link>
                  <Link
                    href="/list?user=Personne"
                    onClick={toggleMenu}
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Liste Personne
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/admin"
                    onClick={toggleMenu}
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Modif. liste
                  </Link>
                  <Link
                    href="/list?user=Mathieu"
                    onClick={toggleMenu}
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Liste Mathieu
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="block w-full px-4 py-2 text-red-500 hover:bg-gray-100"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
