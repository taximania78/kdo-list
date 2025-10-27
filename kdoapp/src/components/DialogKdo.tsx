import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { useState } from 'react';
import api from '@/lib/api';
import { Gift, CheckCircle, X } from 'lucide-react';

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
          className={`
            w-full
            flex
            items-center
            justify-center
            gap-2
            p-3
            rounded-lg
            font-semibold
            transition-all
            duration-200
            transform
            hover:scale-[1.02]
            active:scale-[0.98]
            disabled:opacity-50
            disabled:cursor-not-allowed
            disabled:hover:scale-100
            ${
              availability
                ? theme === 'christmas'
                  ? 'bg-green-700 hover:bg-green-800 text-white shadow-lg shadow-green-900/30'
                  : 'bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-900/30'
                : takenBy !== userLogged
                  ? theme === 'christmas'
                    ? 'bg-red-400 text-white cursor-not-allowed'
                    : 'bg-slate-400 text-white cursor-not-allowed'
                  : theme === 'christmas'
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30'
                    : 'bg-slate-600 hover:bg-slate-700 text-white shadow-lg shadow-slate-900/30'
            }
          `}
        >
          {availability ? (
            <>
              <Gift className="w-5 h-5" />
              Je prends !
            </>
          ) : takenBy === userLogged ? (
            <>
              <X className="w-5 h-5" />
              Je ne souhaite plus prendre cette idée
            </>
          ) : (
            <>
              <X className="w-5 h-5" />
              Non disponible - Pris par {takenBy}
            </>
          )}
        </button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/90 z-50 data-[state=open]:animate-overlayShow" />
        <AlertDialog.Content
          className={`
            fixed
            left-1/2
            top-1/2
            -translate-x-1/2
            -translate-y-1/2
            max-h-[85vh]
            w-[90vw]
            max-w-[500px]
            z-50
            backdrop-blur-lg
            ${
              theme === 'christmas'
                ? 'bg-red-900/90'
                : 'bg-indigo-900/90'
            }
            rounded-2xl
            p-8
            border
            border-white/20
            shadow-2xl
            focus:outline-none
            data-[state=open]:animate-contentShow
          `}
        >
          <AlertDialog.Title className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            {availability ? (
              <>
                <Gift className="w-6 h-6" />
                Confirmes-tu ton choix?
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6" />
                Libérer cette idée?
              </>
            )}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-white/90 mb-6 space-y-3">
            {availability ? (
              <div className="space-y-2 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div>
                  <span className="font-semibold text-white">Produit : </span>
                  <span className="text-white/90">{name}</span>
                </div>
                {comment && (
                  <div>
                    <span className="font-semibold text-white">
                      Commentaire :{' '}
                    </span>
                    <span className="text-white/90">{comment}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <p className="text-white/90">
                  <span className="font-semibold text-white">{name}</span> sera
                  de nouveau disponible pour d&apos;autres personnes.
                </p>
              </div>
            )}
          </AlertDialog.Description>
          <div className="flex gap-3">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="
                  flex-1
                  px-4
                  py-3
                  rounded-lg
                  bg-white/20
                  hover:bg-white/30
                  text-white
                  font-medium
                  transition-all
                  duration-200
                  backdrop-blur-sm
                  border
                  border-white/30
                "
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
              className={`
                flex-1
                flex
                items-center
                justify-center
                gap-2
                px-4
                py-3
                rounded-lg
                text-white
                font-semibold
                transition-all
                duration-200
                transform
                hover:scale-[1.02]
                active:scale-[0.98]
                ${
                  theme === 'christmas'
                    ? 'bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700 shadow-lg shadow-green-500/30'
                    : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 shadow-lg shadow-sky-500/30'
                }
              `}
            >
              {availability ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Oui, je prends !
                </>
              ) : (
                <>
                  <X className="w-5 h-5" />
                  Oui, libérer
                </>
              )}
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

export default DialogKdo;
