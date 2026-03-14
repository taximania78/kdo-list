'use client';

import Link from 'next/link';
import { Logo } from './Logo';
import { useEffect, useState } from 'react';
import { Mountains_of_Christmas, Atma } from 'next/font/google';
import { usePathname } from 'next/navigation';
import {
  isTokenDecodable,
  decodeToken,
  clearAuthStorage,
} from '@/lib/auth';
import { isChristmas, themeConfig } from '@/lib/theme';
import {
  Menu,
  X,
  LogOut,
  List,
  Settings,
  Shield,
  Gift,
} from 'lucide-react';

const mountainsOfChristmas = Mountains_of_Christmas({
  weight: '700',
  subsets: ['latin'],
});

const atma = Atma({
  weight: '500',
  subsets: ['latin'],
});

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
        if (isTokenDecodable(token)) {
          const decoded = decodeToken(token);
          if (decoded) {
            setIsUserLoggedIn(true);
            setUsername(decoded.username);
            setIsAdmin(decoded.isAdmin ? 'true' : 'false');
          } else {
            setIsUserLoggedIn(false);
          }
        } else {
          console.warn('⚠️ [NAV] Token is corrupted but not deleting it');
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

    clearAuthStorage();
    setIsUserLoggedIn(false);
    window.location.href = '/';
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const getLogoHref = () => {
    if (!isUserLoggedIn) return '/';
    return '/list';
  };

  return (
    <header className="w-full backdrop-blur-md bg-[var(--nav-bg)] border-b-2 border-[var(--nav-border)] shadow-[var(--shadow-sm)] sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between py-4">
          {/* Logo section */}
          <div className="flex-shrink-0">
            <Link href={getLogoHref()} className="flex gap-3 items-center group">
              <Logo size={44} />
              <p className={`text-xl sm:text-2xl font-semibold transition-colors duration-200 text-[var(--primary)] group-hover:text-[var(--primary-hover)] ${isChristmas ? mountainsOfChristmas.className : atma.className}`}>
                {themeConfig.titleEmoji} {themeConfig.appTitle}
              </p>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {isUserLoggedIn && (
              <>
                {/* Mobile menu button */}
                <div className="md:hidden">
                  <button
                    onClick={toggleMenu}
                    className="p-2 rounded-lg transition-all duration-200 text-[var(--primary)] hover:bg-[var(--primary-light)]"
                    aria-label="Toggle menu"
                  >
                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>
                </div>

                {/* Desktop menu */}
                <div className="hidden md:flex items-center gap-2">
                  {isAdmin === 'false' ? (
                    <>
                      <NavLink href="/list" icon={<List className="w-4 h-4" />}>
                        Listes
                      </NavLink>
                    </>
                  ) : username === 'Mathieu' ? (
                    <>
                      <NavLink href="/admin/superadmin" icon={<Shield className="w-4 h-4" />}>
                        Admin
                      </NavLink>
                      <NavLink href="/admin" icon={<Settings className="w-4 h-4" />}>
                        Modifier
                      </NavLink>
                      <NavLink href="/list" icon={<Gift className="w-4 h-4" />}>
                        Listes
                      </NavLink>
                    </>
                  ) : (
                    <>
                      <NavLink href="/admin" icon={<Settings className="w-4 h-4" />}>
                        Modifier
                      </NavLink>
                      <NavLink href="/list" icon={<Gift className="w-4 h-4" />}>
                        Listes
                      </NavLink>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--danger)] hover:bg-[var(--error-bg)] transition-all duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </>
          )}
        </nav>
      </div>

      {/* Mobile menu dropdown */}
      {isUserLoggedIn && (
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="backdrop-blur-lg bg-[var(--surface-hover)] border-t border-[var(--border-light)]">
            <div className="px-4 py-3 space-y-1">
              {isAdmin === 'false' ? (
                <>
                  <MobileNavLink href="/list" onClick={toggleMenu} icon={<List className="w-5 h-5" />}>
                    Listes
                  </MobileNavLink>
                </>
              ) : username === 'Mathieu' ? (
                <>
                  <MobileNavLink href="/admin/superadmin" onClick={toggleMenu} icon={<Shield className="w-5 h-5" />}>
                    Admin
                  </MobileNavLink>
                  <MobileNavLink href="/admin" onClick={toggleMenu} icon={<Settings className="w-5 h-5" />}>
                    Modif. liste
                  </MobileNavLink>
                  <MobileNavLink href="/list" onClick={toggleMenu} icon={<Gift className="w-5 h-5" />}>
                    Listes
                  </MobileNavLink>
                </>
              ) : (
                <>
                  <MobileNavLink href="/admin" onClick={toggleMenu} icon={<Settings className="w-5 h-5" />}>
                    Modif. liste
                  </MobileNavLink>
                  <MobileNavLink href="/list" onClick={toggleMenu} icon={<Gift className="w-5 h-5" />}>
                    Listes
                  </MobileNavLink>
                </>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-[var(--danger)] hover:bg-[var(--error-bg)] transition-all duration-200"
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

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--nav-text)] hover:text-[var(--nav-text-hover)] hover:bg-[var(--surface-hover)] transition-all duration-200"
    >
      {icon}
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  onClick,
  icon,
  children,
}: {
  href: string;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--nav-text)] hover:text-[var(--nav-text-hover)] hover:bg-[var(--surface-hover)] transition-all duration-200"
    >
      {icon}
      {children}
    </Link>
  );
}
