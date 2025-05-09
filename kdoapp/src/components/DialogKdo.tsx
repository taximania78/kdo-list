import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { useState } from 'react';
import api from '@/lib/api';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

type DialogTakeKdoProps = {
  id: number;
  name: string;
  comment: string;
  availability: boolean;
  takenBy: string;
  userLogged: string;
  theme: string;
  onValidation?: () => void;
};

const DialogKdo = ({
  id,
  name,
  comment,
  availability,
  takenBy,
  userLogged,
  theme,
  onValidation,
}: DialogTakeKdoProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false); // État pour contrôler le dialogue

  const takeKdo = async () => {
    // Logique pour prendre le kdo
    console.log(`Taking kdo: ${id}`);
    try {
      const response = await api.post(`${ApiAdress}/api/take-api/${id}`);

      if (response.status !== 200) {
        throw new Error('Failed to take the Kdo');
      }
      const data = response.data;
      console.log('Kdo taken successfully:', data);
      if (onValidation) {
        onValidation();
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error taking the Kdo:', error);
    }
  };

  const untakeKdo = async () => {
    // Logique pour prendre le kdo
    console.log(`Unaking kdo: ${id}`);
    try {
      const response = await api.post(`${ApiAdress}/api/untake-api/${id}`);

      if (response.status !== 200) {
        throw new Error('Failed to untake the Kdo');
      }
      const data = response.data;
      console.log('Kdo untaken successfully:', data);
      if (onValidation) {
        onValidation();
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error untaking the Kdo:', error);
    }
  };

  return (
    <AlertDialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialog.Trigger asChild>
        <button
          onClick={() => setIsDialogOpen(true)}
          disabled={!availability && takenBy !== userLogged}
          className={`w-full text-white p-2 rounded-lg 
            ${
              availability
                ? theme === 'christmas'
                  ? 'bg-green-800 hover:bg-green-900'
                  : 'bg-blue-600 hover:bg-blue-700'
                : takenBy !== userLogged
                  ? theme === 'christmas'
                    ? 'bg-red-400'
                    : 'bg-slate-400'
                  : theme === 'christmas'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-slate-600 hover:bg-slate-700'
            }
          }`}
        >
          {!availability
            ? takenBy === userLogged
              ? 'Je ne souhaite plus prendre cette idée'
              : `Non disponible - Pris par ${takenBy}`
            : 'Je prends !'}
        </button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black data-[state=open]:animate-overlayShow opacity-90" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 max-h-[85vh] w-[90vw] max-w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-md bg-gray-100 p-[25px] shadow-[var(--shadow-6)] focus:outline-none data-[state=open]:animate-contentShow">
          <AlertDialog.Title className="text-md font-bold mb-4">
            Confirmes-tu ton choix?
          </AlertDialog.Title>
          <AlertDialog.Description className="mb-4">
            {availability ? (
              <>
                <span className="font-bold">Produit : </span>
                {name}
                <br />
                <span className="font-bold">Commentaire : </span>
                {comment}
              </>
            ) : (
              <>
                {name} sera de nouveau disponible pour d&apos;autres personnes.
              </>
            )}
          </AlertDialog.Description>
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)} // Fermer le dialogue
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
              >
                Non
              </button>
            </AlertDialog.Cancel>
            <button
              type="button"
              onClick={() => {
                if (availability) {
                  takeKdo();
                } else {
                  untakeKdo();
                }
              }}
              className={
                `rounded-lg text-white px-6 py-2 transition-colors bg-gradient-to-r ` +
                (theme === 'christmas'
                  ? 'from-green-600 to-red-600 hover:from-green-700 hover:to-red-700'
                  : 'from-sky-600 to-red-600 hover:from-sky-700 hover:to-red-700')
              }
            >
              {availability
                ? 'Oui, je prends !'
                : 'Oui, je ne prends plus cette idée !'}
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

export default DialogKdo;
