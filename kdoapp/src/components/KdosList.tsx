import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import router from 'next/router';
import { jwtDecode } from 'jwt-decode';
import DialogKdo from './DialogKdo';
import Link from 'next/link';

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

interface DecodedToken {
  sub: number;
  username: string;
  isAdmin: boolean;
  isMegaAdmin: boolean;
  exp: number; // Timestamp d'expiration
}

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

  const fetchUsername = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const decoded = jwtDecode<DecodedToken>(token);
      const isExpired = decoded.exp < Date.now() / 1000;
      if (!isExpired) {
        setUserLogged(decoded.username);
      }
    }
  };

  useEffect(() => {
    fetchKdos();
    fetchUsername();
  }, [userQuery]); // Le tableau vide signifie que l'effet ne s'exécute qu'une fois, au montage du composant

  if (!kdosList) return <div>Chargement de la liste en cours...</div>;
  if (kdosList.length === 0)
    return <div>Aucun cadeau n&apos;a été trouvé.</div>;

  return (
    <div className="grid xl:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-8 p-4 text-black">
      {kdosList.map((kdo, index) => (
        <div
          key={index}
          className="kdo-item border p-4 rounded-lg shadow-lg flex flex-col justify-between"
        >
          <div>
            <h2 className="text-xl font-bold text-center mb-2">{kdo.name}</h2>
            <Image
              src={`/api/kdos/${kdo.imageDisplay}`}
              alt={`Image ${kdo.name}`}
              width={500}
              height={500}
              className={`${!kdo.availability ? 'grayscale blur-xs hover:blur-none' : ''} object-contain mb-2`}
            />
            <p className="mb-1 flex">
              <span className="font-bold">Disponibilité :</span>
              <Image
                className="ml-1"
                src={`/icons/${kdo.availability ? 'circle-check.svg' : 'circle-x.svg'}`}
                alt="Produit disponible"
                height={24}
                width={24}
              />
            </p>
            <p className="mb-1">
              <span className="font-bold">Prix :</span> {kdo.price}€
            </p>
            <p className="mb-1">
              <span className="font-bold">Pour :</span> {kdo.user}
            </p>
            <p className="mb-1">
              <span className="font-bold">Lien : </span>
              <Link href={kdo.url} target="_blank">
                <span className="underline">Cliquer ici</span>
              </Link>
            </p>
            <p className="mb-1">
              <span className="font-bold">Commentaire :</span> {kdo.comment}
            </p>
          </div>
          <div className="w-full mt-auto">
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
