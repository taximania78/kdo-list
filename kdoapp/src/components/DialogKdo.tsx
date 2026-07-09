import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { useState } from 'react';
import api from '@/lib/api';
import { Gift, CheckCircle, X } from 'lucide-react';
import { isChristmas } from '@/lib/theme';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

type DialogTakeKdoProps = {
  id: number;
  name: string;
  comment: string;
  availability: boolean;
  takenBy: string;
  userLogged: string;
  onValidation?: () => void;
};

const DialogKdo = ({
  id,
  name,
  comment,
  availability,
  takenBy,
  userLogged,
  onValidation,
}: DialogTakeKdoProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const takeKdo = async () => {
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
    console.log(`Untaking kdo: ${id}`);
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

  const getButtonClasses = () => {
    if (availability) {
      return 'bg-[var(--secondary)] hover:bg-[var(--secondary-hover)] text-[var(--on-primary)] shadow-[var(--shadow-primary)]';
    }
    if (takenBy !== userLogged) {
      return 'bg-[var(--surface-muted)] text-[var(--text-muted)] cursor-not-allowed';
    }
    return 'bg-[var(--danger)] hover:bg-[var(--danger-hover)] text-[var(--on-primary)] shadow-[var(--shadow-primary)]';
  };

  return (
    <AlertDialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialog.Trigger asChild>
        <button
          onClick={() => setIsDialogOpen(true)}
          disabled={!availability && takenBy !== userLogged}
          className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${getButtonClasses()}`}
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
        <AlertDialog.Overlay className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 data-[state=open]:animate-overlayShow" />
        <AlertDialog.Content
          className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[85vh] w-[90vw] max-w-[500px] z-50 rounded-2xl p-8 border shadow-xl focus:outline-none data-[state=open]:animate-contentShow surface-card ${
            isChristmas ? 'backdrop-blur-lg' : ''
          }`}
        >
          <AlertDialog.Title className="text-2xl font-bold mb-6 flex items-center gap-3 text-[var(--text-primary)]">
            {availability ? (
              <>
                <Gift className="w-6 h-6 text-[var(--primary)]" />
                Confirmes-tu ton choix?
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6 text-[var(--primary)]" />
                Libérer cette idée?
              </>
            )}
          </AlertDialog.Title>
          <AlertDialog.Description asChild>
            <div className="mb-6 space-y-3 text-[var(--text-secondary)]">
              {availability ? (
                <div className="space-y-2 p-4 rounded-lg border bg-[var(--surface-hover)] border-[var(--border-light)]">
                  <div>
                    <span className="font-semibold text-[var(--text-primary)]">Produit : </span>
                    <span>{name}</span>
                  </div>
                  {comment && (
                    <div>
                      <span className="font-semibold text-[var(--text-primary)]">Commentaire : </span>
                      <span>{comment}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-lg border bg-[var(--surface-hover)] border-[var(--border-light)]">
                  <p>
                    <span className="font-semibold text-[var(--text-primary)]">{name}</span> sera de
                    nouveau disponible pour d&apos;autres personnes.
                  </p>
                </div>
              )}
            </div>
          </AlertDialog.Description>
          <div className="flex gap-3">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 border bg-[var(--surface-hover)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] border-[var(--border)]"
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
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-[var(--on-primary)] font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-[var(--shadow-primary)] ${
                isChristmas
                  ? 'bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700'
                  : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)]'
              }`}
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
