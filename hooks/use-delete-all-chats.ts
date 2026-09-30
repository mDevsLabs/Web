"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { getChatHistoryPaginationKey } from "@/components/chat/sidebar-history";
import { useActiveChat } from "@/hooks/use-active-chat";
import { extractApiErrorMessage } from "@/lib/api/client-error";

// Suppression de TOUT l'historique, en un seul endroit.
//
// L'action existe à trois endroits — l'onglet Données, l'ancienne entrée de la
// barre latérale, et la commande `/purge`. Trois implémentations avaient déjà
// dérivé : l'une d'elles affichait « Toutes les discussions ont été supprimées »
// même quand la requête réseau avait échoué, et aucune ne rafraîchissait le
// cache SWR. Le comportement correct est ici, une fois.
//
// Le vidage du cache AVANT la confirmation de la réponse est délibéré : l'UI
// ne doit pas rebrainer des discussions qui n'existent plus. En cas d'échec, on
// repasse par `revalidate` pour retélécharger la vérité plutôt que de laisser
// une liste tronquée à l'écran.

export function useDeleteAllChats() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { resetChat } = useActiveChat();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAll = useCallback(async () => {
    setIsDeleting(true);
    const historyKey = unstable_serialize(getChatHistoryPaginationKey);
    // Vider d'abord : l'utilisateur voit l'effet immédiatement.
    mutate(historyKey, [], { revalidate: false });
    resetChat();
    router.replace("/");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          extractApiErrorMessage(data) ||
            "La suppression de l'historique a échoué."
        );
      }
      toast.success("Toutes les discussions ont été supprimées");
      return true;
    } catch (error) {
      // La liste affichée a été vidée pour rien : on la recharge.
      await mutate(historyKey);
      toast.error(
        error instanceof Error
          ? error.message
          : "La suppression de l'historique a échoué."
      );
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [mutate, resetChat, router]);

  return { deleteAll, isDeleting };
}
