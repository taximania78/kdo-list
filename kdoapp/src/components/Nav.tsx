'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Mountains_of_Christmas, Atma } from 'next/font/google';
import { usePathname } from 'next/navigation';
import {
  isTokenDecodable,
  decodeToken,
  clearAuthStorage,
} from '@/lib/auth';
import {
  Menu,
  X,
  LogOut,
  List,
  Settings,
  Shield,
  Gift,
} from 'lucide-react';

const mountains_of_christmas = Mountains_of_Christmas({
  weight: '700',
  subsets: ['latin'],
});

const knewave = Atma({
  weight: '500',
  subsets: ['latin'],
});

const theme = process.env.NEXT_PUBLIC_THEME || 'default';
const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

export const Nav = () => {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('authToken');

      if (token) {
        // Only check if token is decodable, NOT if expired
        if (isTokenDecodable(token)) {
          const decoded = decodeToken(token);
          if (decoded) {
            setIsUserLoggedIn(true);
            setUsername(decoded.username);
            setIsAdmin(decoded.isAdmin ? 'true' : 'false');
          } else {
            // Shouldn't happen if isTokenDecodable returned true, but safety check
            setIsUserLoggedIn(false);
          }
        } else {
          // Token is corrupted/invalid (not just expired)
          console.warn('⚠️ [NAV] Token is corrupted but not deleting it');
          setIsUserLoggedIn(false);
          // DON'T delete tokens - user might be mid-refresh
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
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          console.log('✅ [NAV] Logout successful');
        } else {
          console.warn('⚠️ [NAV] Logout response not OK');
        }
      } catch (error) {
        console.error('❌ [NAV] Logout error:', error);
      }
    }

    clearAuthStorage(); // Use centralized function
    setIsUserLoggedIn(false);
    window.location.href = '/';
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header
      className={`
        w-full
        backdrop-blur-md
        bg-white/70
        border-b
        ${
          theme === 'christmas'
            ? 'border-red-200/50 shadow-lg shadow-red-100/20'
            : 'border-sky-200/50 shadow-lg shadow-sky-100/20'
        }
        sticky
        top-0
        z-50
        transition-all
        duration-300
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={
            theme === 'christmas'
              ? mountains_of_christmas.className
              : knewave.className
          }
        >
          <nav className="flex items-center justify-between py-4">
            {/* Logo section */}
            <div className="flex-shrink-0">
              {isAdmin === 'false' || !isAdmin ? (
                <Link
                  href={`${isUserLoggedIn ? '/list' : '/'}`}
                  className="flex gap-3 items-center group"
                >
                  <div className="relative">
                    <Image
                      src={
                        theme === 'christmas'
                          ? 'logo-christmas.svg'
                          : 'logo.svg'
                      }
                      alt="KDO liste logo"
                      width={50}
                      height={50}
                      className="object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
                    />
                  </div>
                  <p
                    className={`
                      text-2xl
                      sm:text-3xl
                      font-bold
                      transition-colors
                      duration-200
                      ${
                        theme === 'christmas'
                          ? 'text-red-700 group-hover:text-green-700'
                          : 'text-sky-700 group-hover:text-indigo-700'
                      }
                    `}
                  >
                    {theme === 'christmas'
                      ? '🎄 Liste de Noël'
                      : "Liste d'anniversaire"}
                  </p>
                </Link>
              ) : username === 'Mathieu' ? (
                <Link
                  href={`${isUserLoggedIn ? '/list?user=Personne' : '/'}`}
                  className="flex gap-3 items-center group"
                >
                  <div className="relative">
                    <Image
                      src={
                        theme === 'christmas'
                          ? 'logo-christmas.svg'
                          : 'logo.svg'
                      }
                      alt="KDO liste logo"
                      width={50}
                      height={50}
                      className="object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
                    />
                  </div>
                  <p
                    className={`
                      text-2xl
                      sm:text-3xl
                      font-bold
                      transition-colors
                      duration-200
                      ${
                        theme === 'christmas'
                          ? 'text-red-700 group-hover:text-green-700'
                          : 'text-sky-700 group-hover:text-indigo-700'
                      }
                    `}
                  >
                    {theme === 'christmas'
                      ? '🎄 Liste de Noël'
                      : "Liste d'anniversaire"}
                  </p>
                </Link>
              ) : (
                <Link
                  href={`${isUserLoggedIn ? '/list?user=Mathieu' : '/'}`}
                  className="flex gap-3 items-center group"
                >
                  <div className="relative">
                    <Image
                      src={
                        theme === 'christmas'
                          ? 'logo-christmas.svg'
                          : 'logo.svg'
                      }
                      alt="KDO liste logo"
                      width={50}
                      height={50}
                      className="object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
                    />
                  </div>
                  <p
                    className={`
                      text-2xl
                      sm:text-3xl
                      font-bold
                      transition-colors
                      duration-200
                      ${
                        theme === 'christmas'
                          ? 'text-red-700 group-hover:text-green-700'
                          : 'text-sky-700 group-hover:text-indigo-700'
                      }
                    `}
                  >
                    {theme === 'christmas'
                      ? '🎄 Liste de Noël'
                      : "Liste d'anniversaire"}
                  </p>
                </Link>
              )}
            </div>

            {/* Desktop Navigation */}
            {isUserLoggedIn && (
              <>
                {/* Mobile menu button */}
                <div className="md:hidden">
                  <button
                    onClick={toggleMenu}
                    className={`
                      p-2
                      rounded-lg
                      transition-all
                      duration-200
                      ${
                        theme === 'christmas'
                          ? 'text-red-700 hover:bg-red-100/50'
                          : 'text-sky-700 hover:bg-sky-100/50'
                      }
                    `}
                    aria-label="Toggle menu"
                  >
                    {isMenuOpen ? (
                      <X className="w-6 h-6" />
                    ) : (
                      <Menu className="w-6 h-6" />
                    )}
                  </button>
                </div>

                {/* Desktop menu */}
                <div className="hidden md:flex items-center gap-2">
                  {isAdmin === 'false' ? (
                    <>
                      <Link
                        href="/list"
                        className={`
                          flex
                          items-center
                          gap-2
                          px-4
                          py-2
                          rounded-lg
                          font-medium
                          transition-all
                          duration-200
                          ${
                            theme === 'christmas'
                              ? 'text-red-700 hover:bg-red-100/50'
                              : 'text-sky-700 hover:bg-sky-100/50'
                          }
                        `}
                      >
                        <List className="w-4 h-4" />
                        Liste complète
                      </Link>
                      <Link
                        href="/list?user=Personne"
                        className={`
                          flex
                          items-center
                          gap-2
                          px-4
                          py-2
                          rounded-lg
                          font-medium
                          transition-all
                          duration-200
                          ${
                            theme === 'christmas'
                              ? 'text-red-700 hover:bg-red-100/50'
                              : 'text-sky-700 hover:bg-sky-100/50'
                          }
                        `}
                      >
                        <Gift className="w-4 h-4" />
                        Personne
                      </Link>
                      <Link
                        href="/list?user=Mathieu"
                        className={`
                          flex
                          items-center
                          gap-2
                          px-4
                          py-2
                          rounded-lg
                          font-medium
                          transition-all
                          duration-200
                          ${
                            theme === 'christmas'
                              ? 'text-red-700 hover:bg-red-100/50'
                              : 'text-sky-700 hover:bg-sky-100/50'
                          }
                        `}
                      >
                        <Gift className="w-4 h-4" />
                        Mathieu
                      </Link>
                    </>
                  ) : username === 'Mathieu' ? (
                    <>
                      <Link
                        href="/admin/superadmin"
                        className={`
                          flex
                          items-center
                          gap-2
                          px-4
                          py-2
                          rounded-lg
                          font-medium
                          transition-all
                          duration-200
                          ${
                            theme === 'christmas'
                              ? 'text-red-700 hover:bg-red-100/50'
                              : 'text-sky-700 hover:bg-sky-100/50'
                          }
                        `}
                      >
                        <Shield className="w-4 h-4" />
                        Admin
                      </Link>
                      <Link
                        href="/admin"
                        className={`
                          flex
                          items-center
                          gap-2
                          px-4
                          py-2
                          rounded-lg
                          font-medium
                          transition-all
                          duration-200
                          ${
                            theme === 'christmas'
                              ? 'text-red-700 hover:bg-red-100/50'
                              : 'text-sky-700 hover:bg-sky-100/50'
                          }
                        `}
                      >
                        <Settings className="w-4 h-4" />
                        Modifier
                      </Link>
                      <Link
                        href="/list?user=Personne"
                        className={`
                          flex
                          items-center
                          gap-2
                          px-4
                          py-2
                          rounded-lg
                          font-medium
                          transition-all
                          duration-200
                          ${
                            theme === 'christmas'
                              ? 'text-red-700 hover:bg-red-100/50'
                              : 'text-sky-700 hover:bg-sky-100/50'
                          }
                        `}
                      >
                        <Gift className="w-4 h-4" />
                        Personne
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/admin"
                        className={`
                          flex
                          items-center
                          gap-2
                          px-4
                          py-2
                          rounded-lg
                          font-medium
                          transition-all
                          duration-200
                          ${
                            theme === 'christmas'
                              ? 'text-red-700 hover:bg-red-100/50'
                              : 'text-sky-700 hover:bg-sky-100/50'
                          }
                        `}
                      >
                        <Settings className="w-4 h-4" />
                        Modifier
                      </Link>
                      <Link
                        href="/list?user=Mathieu"
                        className={`
                          flex
                          items-center
                          gap-2
                          px-4
                          py-2
                          rounded-lg
                          font-medium
                          transition-all
                          duration-200
                          ${
                            theme === 'christmas'
                              ? 'text-red-700 hover:bg-red-100/50'
                              : 'text-sky-700 hover:bg-sky-100/50'
                          }
                        `}
                      >
                        <Gift className="w-4 h-4" />
                        Mathieu
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="
                      flex
                      items-center
                      gap-2
                      px-4
                      py-2
                      rounded-lg
                      font-medium
                      text-red-600
                      hover:bg-red-100/50
                      transition-all
                      duration-200
                    "
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isUserLoggedIn && (
        <div
          className={`
            md:hidden
            overflow-hidden
            transition-all
            duration-300
            ease-in-out
            ${isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div
            className={`
              backdrop-blur-lg
              ${
                theme === 'christmas'
                  ? 'bg-red-50/80 border-t border-red-200/50'
                  : 'bg-sky-50/80 border-t border-sky-200/50'
              }
            `}
          >
            <div className="px-4 py-3 space-y-1">
              {isAdmin === 'false' ? (
                <>
                  <Link
                    href="/list"
                    onClick={toggleMenu}
                    className={`
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      rounded-lg
                      font-medium
                      transition-all
                      duration-200
                      ${
                        theme === 'christmas'
                          ? 'text-red-700 hover:bg-red-100/50'
                          : 'text-sky-700 hover:bg-sky-100/50'
                      }
                    `}
                  >
                    <List className="w-5 h-5" />
                    Liste complète
                  </Link>
                  <Link
                    href="/list?user=Personne"
                    onClick={toggleMenu}
                    className={`
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      rounded-lg
                      font-medium
                      transition-all
                      duration-200
                      ${
                        theme === 'christmas'
                          ? 'text-red-700 hover:bg-red-100/50'
                          : 'text-sky-700 hover:bg-sky-100/50'
                      }
                    `}
                  >
                    <Gift className="w-5 h-5" />
                    Liste Personne
                  </Link>
                  <Link
                    href="/list?user=Mathieu"
                    onClick={toggleMenu}
                    className={`
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      rounded-lg
                      font-medium
                      transition-all
                      duration-200
                      ${
                        theme === 'christmas'
                          ? 'text-red-700 hover:bg-red-100/50'
                          : 'text-sky-700 hover:bg-sky-100/50'
                      }
                    `}
                  >
                    <Gift className="w-5 h-5" />
                    Liste Mathieu
                  </Link>
                </>
              ) : username === 'Mathieu' ? (
                <>
                  <Link
                    href="/admin/superadmin"
                    onClick={toggleMenu}
                    className={`
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      rounded-lg
                      font-medium
                      transition-all
                      duration-200
                      ${
                        theme === 'christmas'
                          ? 'text-red-700 hover:bg-red-100/50'
                          : 'text-sky-700 hover:bg-sky-100/50'
                      }
                    `}
                  >
                    <Shield className="w-5 h-5" />
                    Admin
                  </Link>
                  <Link
                    href="/admin"
                    onClick={toggleMenu}
                    className={`
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      rounded-lg
                      font-medium
                      transition-all
                      duration-200
                      ${
                        theme === 'christmas'
                          ? 'text-red-700 hover:bg-red-100/50'
                          : 'text-sky-700 hover:bg-sky-100/50'
                      }
                    `}
                  >
                    <Settings className="w-5 h-5" />
                    Modif. liste
                  </Link>
                  <Link
                    href="/list?user=Personne"
                    onClick={toggleMenu}
                    className={`
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      rounded-lg
                      font-medium
                      transition-all
                      duration-200
                      ${
                        theme === 'christmas'
                          ? 'text-red-700 hover:bg-red-100/50'
                          : 'text-sky-700 hover:bg-sky-100/50'
                      }
                    `}
                  >
                    <Gift className="w-5 h-5" />
                    Liste Personne
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/admin"
                    onClick={toggleMenu}
                    className={`
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      rounded-lg
                      font-medium
                      transition-all
                      duration-200
                      ${
                        theme === 'christmas'
                          ? 'text-red-700 hover:bg-red-100/50'
                          : 'text-sky-700 hover:bg-sky-100/50'
                      }
                    `}
                  >
                    <Settings className="w-5 h-5" />
                    Modif. liste
                  </Link>
                  <Link
                    href="/list?user=Mathieu"
                    onClick={toggleMenu}
                    className={`
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      rounded-lg
                      font-medium
                      transition-all
                      duration-200
                      ${
                        theme === 'christmas'
                          ? 'text-red-700 hover:bg-red-100/50'
                          : 'text-sky-700 hover:bg-sky-100/50'
                      }
                    `}
                  >
                    <Gift className="w-5 h-5" />
                    Liste Mathieu
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="
                  flex
                  items-center
                  gap-3
                  w-full
                  px-4
                  py-3
                  rounded-lg
                  font-medium
                  text-red-600
                  hover:bg-red-100/50
                  transition-all
                  duration-200
                "
              >
                <LogOut className="w-5 h-5" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
