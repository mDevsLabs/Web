"use client";

import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";

export const SignOutForm = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
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
