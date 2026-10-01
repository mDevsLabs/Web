import type { ApiErrorCode } from "@/lib/api/error-codes";

// Messages français par défaut associés aux codes d'erreur API.
// Toute réponse d'erreur utilisateur doit être en français.
export const DEFAULT_MESSAGES_FR: Record<ApiErrorCode, string> = {
  access_denied: "Vous n'avez pas l'autorisation d'accéder à cette ressource.",
  auth_required: "Votre session a expiré. Veuillez vous reconnecter à mAI.",
  bot_detected:
    "Accès refusé. Veuillez réessayer depuis un navigateur standard.",
  conflict: "Cette ressource existe déjà.",
  database_error:
    "Une erreur est survenue lors de l'accès à la base de données.",
  internal_error: "Une erreur inattendue est survenue. Veuillez réessayer.",
  invalid_credentials: "Identifiants invalides.",
  invalid_request:
    "La requête n'a pas pu être traitée. Veuillez vérifier vos données.",
  mcp_required:
    "Configurez d'abord les serveurs MCP requis par cette compétence.",
  model_access_denied:
    "Ce modèle n'est pas disponible avec votre forfait actuel.",
  not_found: "La ressource demandée est introuvable.",
  payload_too_large:
    "Le fichier est trop volumineux. La taille maximale autorisée est de 50 Mo.",
  plan_required: "Cette fonctionnalité nécessite un forfait Plus, Pro ou Max.",
  quota_exceeded:
    "Votre quota est épuisé. Mettez à niveau votre forfait pour continuer.",
  rate_limited:
    "Trop de tentatives. Veuillez réessayer dans quelques instants.",
  service_unavailable:
    "Impossible de joindre le serveur mAI. Veuillez vérifier votre connexion.",
  unsupported_media_type:
    "Type de fichier non pris en charge (image, PDF ou texte uniquement).",
  upstream_error:
    "Le service mAI a rencontré une erreur. Veuillez réessayer plus tard.",
};

export function messageForApiCode(code: ApiErrorCode): string {
  return DEFAULT_MESSAGES_FR[code];
}
