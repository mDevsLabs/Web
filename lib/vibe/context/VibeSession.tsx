/**
 * ============================================================================
 * PONT DE SESSION — Vibe adopte la session de l'hôte
 * ============================================================================
 *
 * POURQUOI CE FICHIER
 *
 * Vibe avait sa propre authentification : un `AuthContext` qui lit un JWT dans
 * `localStorage` (`vibe_jwt_token`), et un `AuthModal` plein écran quand le
 * jeton manque. Intégré tel quel dans mAI, l'utilisateur déjà connecté devrait
 * se reconnecter une deuxième fois, dans une fenêtre qui ressemble à une autre
 * application — et sa déconnexion depuis Vibe ne couperait que la moitié de sa
 * session.
 *
 * Or l'hôte DÉTIENT déjà ce jeton : le cookie httpOnly `mai_session_token`
 * (lib/constants.ts), le même que celui qu'il présente à l'API. Un Server
 * Component le lit et le transmet ici une seule fois, au montage.
 *
 * On passe par `loginWithToken`, l'API déjà publique de l'AuthContext de Vibe :
 * elle pose le jeton, bascule l'état de chargement et recharge la session. Rien
 * de plus n'est nécessaire — et surtout, aucun état privé n'est touché.
 *
 * LE PONT EST UN ALLER, PAS UN RETOUR
 *
 * Vibe ne peut pas écrire dans un cookie httpOnly : il n'y a pas d'accès. La
 * déconnexion reste celle de l'hôte (Server Action), et le `logout` local de
 * Vibe ne sert qu'à purger son état. Sens de circulation : l'hôte est
 * l'autorité, Vibe un consommateur.
 */

"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/vibe/context/AuthContext";
import { ApiService } from "@/lib/vibe/services/api";

/**
 * Amorce le client Vibe avec le jeton de session de l'hôte.
 *
 * À poser une fois autour de l'arbre Vibe, avant tout appel API.
 *
 * @param sessionToken Jeton lu côté serveur dans le cookie `mai_session_token`.
 *   `null` si la session a expiré entre le rendu et le montage : on ne touche
 *   alors à rien, et l'AuthContext de Vibe affiche son écran de connexion.
 */
export function VibeSessionBridge({
  sessionToken,
}: {
  sessionToken: string | null;
}) {
  const { loginWithToken } = useAuth();
  // Une seule application du jeton par montage : `setToken` purge le cache API
  // quand la valeur change, le rejouer à chaque rendu invaliderait le cache en
  // boucle à chaque navigation Vibe.
  const applique = useRef(false);

  useEffect(() => {
    if (applique.current || !sessionToken) {
      return;
    }
    // Un jeton déjà identique (navigation entre pages Vibe) : la session est
    // en place, inutile de la recharger.
    if (ApiService.getToken() === sessionToken) {
      applique.current = true;
      return;
    }
    applique.current = true;
    void loginWithToken(sessionToken).catch(() => {
      // Une session invalide se traduit par l'écran de connexion de Vibe :
      // AuthContext ne ferme la session que sur un vrai 401, jamais sur une
      // erreur réseau. Rien à signaler ici.
    });
  }, [sessionToken, loginWithToken]);

  return null;
}
