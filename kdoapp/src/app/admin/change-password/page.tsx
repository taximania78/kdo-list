import FormModifyPwd from '@/components/FormModifyPwd';

export default function firstConnection() {
  return (
    <div className="container mx-auto p-2 w-full max-w-lg mt-4">
      <h1 className="sm:text-4xl text-3xl font-bold text-center mb-4">
        Modifier mon mot de passe
      </h1>
      <FormModifyPwd />
    </div>
  );
}
