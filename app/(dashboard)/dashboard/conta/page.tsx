import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function ContaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Conta</h1>
      <p className="text-gray-400 mb-6">
        Dados da sua conta e perfil.
      </p>
      <div className="p-6 rounded-xl border border-gray-700 bg-white/5 max-w-md">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-gray-500">Nome</dt>
            <dd className="text-white font-medium">{session.user.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">E-mail</dt>
            <dd className="text-white">{session.user.email ?? "—"}</dd>
          </div>
        </dl>
        <p className="text-gray-500 text-xs mt-4">
          Em breve: edição de perfil e alteração de senha.
        </p>
      </div>
    </div>
  );
}
