import FormModifyPwd from '@/components/FormModifyPwd';

export default function firstConnection() {
  return (
    <div className="container mx-auto p-2 w-full max-w-sm mt-4">
      <h1 className="sm:text-4xl text-3xl font-bold text-center mb-4">
        Première connexion
      </h1>
      <p className="mb-4">
        C&apos;est votre première connexion. Vous devez changer votre mot de
        passe.
      </p>
      <FormModifyPwd firstConnection />
    </div>
  );
}
