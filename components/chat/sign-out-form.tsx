"use client";

import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";

export const SignOutForm = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    // Même parcours que la déconnexion du menu utilisateur : sortie vers le
    // site public avec invitation à se reconnecter (?connexion=1).
    router.push("/site?connexion=1");
    router.refresh();
  };

  return (
    <form action={handleLogout} className="w-full">
      <button
        className="w-full px-1 py-0.5 text-left text-red-500 text-xs font-medium cursor-pointer"
        type="submit"
      >
        Se déconnecter
      </button>
    </form>
  );
};
