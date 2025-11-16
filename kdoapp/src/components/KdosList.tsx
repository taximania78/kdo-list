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

const theme = process.env.NEXT_PUBLIC_THEME || 'default';
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
  }, [userQuery]); // Le tableau vide signifie que l'effet ne s'exécute qu'une fois, au montage du composant

  if (!kdosList)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-lg font-medium">
              Chargement de la liste en cours...
            </p>
          </div>
        </div>
      </div>
    );

  if (kdosList.length === 0)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/20 text-center">
          <p className="text-white text-lg font-medium">
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
          className={`
            backdrop-blur-lg
            bg-white/10
            rounded-2xl
            shadow-2xl
            p-6
            border
            border-white/20
            flex
            flex-col
            justify-between
            transition-all
            duration-300
            hover:scale-[1.02]
            hover:bg-white/15
            group
            ${theme === 'christmas' ? 'hover:shadow-red-500/20' : 'hover:shadow-sky-500/20'}
            ${!kdo.availability ? 'opacity-75' : ''}
          `}
        >
          <div className="space-y-4">
            {/* Title */}
            <h2 className="text-xl font-bold text-center text-white drop-shadow-lg">
              {kdo.name}
            </h2>

            {/* Image */}
            <div className="relative overflow-hidden rounded-xl aspect-square">
              <Image
                src={`/api/kdos/${kdo.imageDisplay}`}
                alt={`Image ${kdo.name}`}
                width={500}
                height={500}
                className={`
                  object-cover
                  w-full
                  h-full
                  transition-all
                  duration-300
                  ${!kdo.availability ? 'grayscale blur-sm group-hover:blur-none' : 'group-hover:scale-105'}
                `}
              />
            </div>

            {/* Details */}
            <div className="space-y-3 text-white">
              {/* Availability */}
              <div className="flex items-center gap-2">
                {kdo.availability ? (
                  <>
                    <CheckCircle
                      className={`w-5 h-5 flex-shrink-0 ${
                        theme === 'christmas' ? 'text-green-400' : 'text-sky-400'
                      }`}
                    />
                    <span className="text-sm font-medium text-white/90">
                      Disponible
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                    <span className="text-sm font-medium text-white/90">
                      Déjà réservé
                    </span>
                  </>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center gap-2">
                <Euro className="w-5 h-5 flex-shrink-0 text-white/70" />
                <span className="text-sm">
                  <span className="font-semibold">{kdo.price}€</span>
                </span>
              </div>

              {/* User */}
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 flex-shrink-0 text-white/70" />
                <span className="text-sm">
                  <span className="text-white/70">Pour :</span>{' '}
                  <span className="font-medium">{kdo.user}</span>
                </span>
              </div>

              {/* Link */}
              <div className="flex items-start gap-2">
                <ExternalLink className="w-5 h-5 flex-shrink-0 text-white/70 mt-0.5" />
                <Link
                  href={kdo.url}
                  target="_blank"
                  className={`
                    text-sm
                    underline
                    hover:no-underline
                    transition-colors
                    duration-200
                    ${
                      theme === 'christmas'
                        ? 'text-green-300 hover:text-green-200'
                        : 'text-sky-300 hover:text-sky-200'
                    }
                  `}
                >
                  Voir le produit
                </Link>
              </div>

              {/* Comment */}
              {kdo.comment && (
                <div className="flex items-start gap-2 pt-2 border-t border-white/10">
                  <MessageCircle className="w-5 h-5 flex-shrink-0 text-white/70 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-white/70 mb-1 font-medium">Commentaire :</p>
                    <p className="text-white/90 italic">{kdo.comment}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action button */}
          <div className="w-full mt-6 pt-4 border-t border-white/10">
            <DialogKdo
              id={kdo.id}
              name={kdo.name}
              comment={kdo.comment}
              takenBy={kdo.takenBy}
              availability={kdo.availability}
              userLogged={userLogged ?? ''}
              theme={theme}
              onValidation={fetchKdos}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default KdosList;
