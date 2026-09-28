'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { PageShell } from '@/components/ui/PageShell';
import { PageTitle } from '@/components/ui/PageTitle';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push(user.isAdmin ? '/admin' : '/list');
    }
  }, [isAuthenticated, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new URLSearchParams();
    formData.append('username', event.currentTarget.username.value);
    formData.append('password', event.currentTarget.password.value);

    try {
      const response = await fetch(`${ApiAdress}/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!response.ok) {
        setError("Nom d'utilisateur ou mot de passe invalide.");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      localStorage.setItem('isAdmin', data.isAdmin);
      localStorage.setItem('user', data.username);

      if (data.firstConnection) {
        sessionStorage.setItem('requirePasswordChange', 'true');
        router.push('/first-connection');
        return;
      }
      router.push(data.isAdmin ? '/admin' : '/list');
    } catch {
      setError("Une erreur s'est produite. Réessaie.");
      setIsLoading(false);
    }
  }

  return (
    <PageShell narrow>
      <PageTitle className="mb-7 mt-6 md:mt-12">Les bonnes idées restent en famille.</PageTitle>
      {error && (
        <p role="alert" className="animate-shake mb-5 w-fit rounded-md bg-paper px-3 py-2 font-semibold text-error">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Field label="Nom d'utilisateur" htmlFor="username">
          <Input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            disabled={isLoading}
            placeholder="Nom d'utilisateur"
          />
        </Field>
        <Field label="Mot de passe" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isLoading}
            placeholder="Mot de passe"
          />
        </Field>
        <Button type="submit" block pending={isLoading} className="mt-1.5 py-3.5">
          {isLoading ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>
      <p className="mt-5 font-hand text-[22px] font-semibold text-hand">mot de passe oublié ? contactez-moi</p>
    </PageShell>
  );
}
