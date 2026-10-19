"use client";

/** Une seule alerte par réponse et par compte, même avec plusieurs onglets. */
export interface BrowserReply {
  conversationId: string;
  id: string;
  muted: boolean;
  preview: string;
  seq: number;
  title: string;
}

export async function alerterUneFois(scope: string, item: BrowserReply) {
  if (
    item.muted ||
    typeof Notification === "undefined" ||
    Notification.permission !== "granted"
  )
    return;
  const annoncer = () => {
    const cle = `wakies-notifications:${scope}`;
    try {
      const derniere = Number(localStorage.getItem(cle) ?? 0);
      if (Number.isFinite(derniere) && derniere >= item.seq) return;
      const notification = new Notification(`Wakies · ${item.title}`, {
        body: item.preview || "Une nouvelle réponse vous attend.",
        tag: `${cle}:${item.id}`,
      });
      localStorage.setItem(cle, String(item.seq));
      notification.onclick = () => {
        window.focus();
        window.dispatchEvent(
          new CustomEvent("wakies-open-conversation", {
            detail: item.conversationId,
          })
        );
        notification.close();
      };
    } catch {
      // Une permission ou un stockage indisponible ne bloque jamais le chat.
    }
  };
  try {
    if (navigator.locks)
      await navigator.locks.request(`wakies-notifications:${scope}`, annoncer);
    else annoncer();
  } catch {
    // Certains contextes privés refusent le verrou : le tag reste utilisable.
    annoncer();
  }
}
