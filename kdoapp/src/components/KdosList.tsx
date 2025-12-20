import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import router from 'next/router';
import { getUserInfo } from '@/lib/auth';
import DialogKdo from './DialogKdo';
import Link from 'next/link';
import {
  ExternalLink,
  Euro,
  User,
  MessageCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

type Kdo = {
  id: number;
  name: string;
  price: number;
  user: string;
  url: string;
  comment: string;
  imageDisplay: string;
  availability: boolean;
  takenBy: string;
};

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

const KdosList = () => {
  const searchParams = useSearchParams();
  const userQuery = searchParams.get('user');
  const [kdosList, setKdosList] = useState<Kdo[] | null>(null);
  const [userLogged, setUserLogged] = useState<string | null>(null);

  const fetchKdos = async () => {
    console.log('Fetching kdos with user:', userQuery);
    let apiUrl = `${ApiAdress}/api/kdos/?format=json`;
    if (userQuery) {
      apiUrl += `&user=${encodeURIComponent(userQuery)}`;
    }

    try {
      const response = await api.get(apiUrl);
      console.log('Response status:', response.status);
      if (response.status !== 200) {
        router.push('/');
        throw new Error('Network response was not ok');
      }
      const data = response.data;
      setKdosList(data);
    } catch (error) {
      console.error('Failed to fetch kdos:', error);
    }
  };

  const fetchUsername = () => {
    const userInfo = getUserInfo();
    if (userInfo) {
      setUserLogged(userInfo.username);
    }
  };

  useEffect(() => {
    fetchKdos();
    fetchUsername();
  }, [userQuery]);

  if (!kdosList)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="surface-card rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-[var(--text-primary)] text-lg font-medium">
              Chargement de la liste en cours...
            </p>
          </div>
        </div>
      </div>
    );

  if (kdosList.length === 0)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="surface-card rounded-2xl p-8 shadow-lg text-center">
          <p className="text-[var(--text-primary)] text-lg font-medium">
            Aucun cadeau n&apos;a été trouvé.
          </p>
        </div>
      </div>
    );

  return (
    <div className="grid xl:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6 pb-8">
      {kdosList.map((kdo, index) => (
        <div
          key={index}
          className={`surface-card rounded-2xl shadow-lg p-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group ${
            !kdo.availability ? 'opacity-75' : ''
          }`}
        >
          <div className="space-y-4">
            {/* Title */}
            <h2 className="text-xl font-bold text-center text-[var(--text-primary)]">
              {kdo.name}
            </h2>

            {/* Image */}
            <div className="relative overflow-hidden rounded-xl aspect-square">
              <Image
                src={`/api/kdos/${kdo.imageDisplay}`}
                alt={`Image ${kdo.name}`}
                width={500}
                height={500}
                className={`object-contain w-full h-full rounded-xl transition-all duration-300 ${
                  !kdo.availability ? 'grayscale blur-sm group-hover:blur-none' : 'group-hover:scale-105'
                }`}
              />
            </div>

            {/* Details */}
            <div className="space-y-3 text-[var(--text-primary)]">
              {/* Availability */}
              <div className="flex items-center gap-2">
                {kdo.availability ? (
                  <>
                    <CheckCircle className="w-5 h-5 flex-shrink-0 text-[var(--success)]" />
                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                      Disponible
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 flex-shrink-0 text-[var(--danger)]" />
                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                      Déjà réservé
                    </span>
                  </>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center gap-2">
                <Euro className="w-5 h-5 flex-shrink-0 text-[var(--text-muted)]" />
                <span className="text-sm">
                  <span className="font-semibold">{kdo.price}€</span>
                </span>
              </div>

              {/* User */}
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 flex-shrink-0 text-[var(--text-muted)]" />
                <span className="text-sm">
                  <span className="text-[var(--text-muted)]">Pour :</span>{' '}
                  <span className="font-medium">{kdo.user}</span>
                </span>
              </div>

              {/* Link */}
              <div className="flex items-start gap-2">
                <ExternalLink className="w-5 h-5 flex-shrink-0 text-[var(--text-muted)] mt-0.5" />
                <Link
                  href={kdo.url}
                  target="_blank"
                  className="text-sm underline hover:no-underline transition-colors duration-200 text-[var(--link)] hover:text-[var(--link-hover)]"
                >
                  Voir le produit
                </Link>
              </div>

              {/* Comment */}
              {kdo.comment && (
                <div className="flex items-start gap-2 pt-2 border-t border-[var(--border-light)]">
                  <MessageCircle className="w-5 h-5 flex-shrink-0 text-[var(--text-muted)] mt-0.5" />
                  <div className="text-sm">
                    <p className="text-[var(--text-muted)] mb-1 font-medium">Commentaire :</p>
                    <p className="text-[var(--text-secondary)] italic">{kdo.comment}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action button */}
          <div className="w-full mt-6 pt-4 border-t border-[var(--border-light)]">
            <DialogKdo
              id={kdo.id}
              name={kdo.name}
              comment={kdo.comment}
              takenBy={kdo.takenBy}
              availability={kdo.availability}
              userLogged={userLogged ?? ''}
              onValidation={fetchKdos}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default KdosList;
