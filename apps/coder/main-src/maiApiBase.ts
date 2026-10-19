// Base de l'API mAI, partagée par le compte, le provider système et les
// requêtes de modèles. mAI Desktop peut imposer un autre environnement
// (préversion, backend local) : la valeur ne doit donc jamais être recopiée en
// dur dans un autre module, sinon le provider authentifié et la synchronisation
// des modèles finissent sur deux hôtes différents.
export const MAI_API_BASE = (
  process.env.MAI_API_BASE ||
  process.env.MAI_API_URL ||
  "https://mai.val.run"
).replace(/\/+$/, "");

export const MAI_API_V1_BASE = `${MAI_API_BASE}/v1`;
