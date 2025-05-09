'use client';

import React, { Suspense } from 'react';
import { Mountains_of_Christmas, Atma } from 'next/font/google';
import KdosList from '@/components/KdosList';
import { useSearchParams } from 'next/navigation';

const theme = process.env.THEME || 'default';

const mountains_of_christmas = Mountains_of_Christmas({
  weight: '700',
  subsets: ['latin'],
});

const knewave = Atma({
  weight: '300',
  subsets: ['latin'],
});

function List() {
  const searchParams = useSearchParams();
  const userQuery = searchParams.get('user');
  let textList: string;
  if (userQuery == 'Mathieu') {
    textList = 'Liste de Mathieu';
  } else if (userQuery == 'Personne') {
    textList = 'Liste de Personne';
  } else {
    textList = 'Liste de Personne & Mathieu';
  }
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="container mx-auto p-2">
        <h1 className="sm:text-4xl text-3xl font-bold text-center">
          <span
            className={
              theme === 'christmas'
                ? mountains_of_christmas.className
                : knewave.className
            }
          >
            {textList}
          </span>
        </h1>
        <KdosList />
      </div>
    </Suspense>
  );
}

// Si List est utilisé comme page, pensez à créer un composant parent pour List
function ListWrapper() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <List />
    </Suspense>
  );
}

export default ListWrapper;
