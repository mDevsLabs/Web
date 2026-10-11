import AgentsClient from "./agents-client";

// La route reste `/agents` : elle fait partie des signets et des liens
// enregistrés. Seule la fonctionnalité s'appelle « Bots » dans l'interface.
//
// Aucun contrôle de forfait ici : les bots sont ouverts à tous les forfaits et
// bornés par quota (`getTierAgentLimit`, appliqué par POST /api/agents). La page
// n'a donc rien à décider — `proxy.ts` écarte les visiteurs sans session, et le
// client affiche la limite que l'API lui renvoie.

export const metadata = {
  title: "Bots — Instructions, modèle et outils | mAI",
};

export default async function AgentsPage() {
  return <AgentsClient />;
}
