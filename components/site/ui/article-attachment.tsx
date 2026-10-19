/**
 * Bouton de téléchargement du document joint à un article (dossier de presse,
 * PDF de l'annonce).
 *
 * C'est un `<a download>` et non un bouton piloté en JavaScript : le fichier est
 * un asset statique de même origine, donc l'attribut `download` suffit au
 * navigateur à l'enregistrer sous le nom éditorial. Pas de blob à charger en
 * mémoire, pas de route qui relirait le disque à chaque clic, et le lien reste
 * exploitable (copier, ouvrir dans un autre onglet) là où un `<button>` ne le
 * serait pas.
 */

import { DownloadIcon as Download } from "@mdevs/icons";
import type { NewsAttachment } from "@/lib/site/news";

export function ArticleAttachmentButton({
  attachment,
  className = "",
}: {
  attachment: NewsAttachment;
  className?: string;
}) {
  return (
    <div className={`mb-10 ${className}`.trim()}>
      <a
        className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-purple-600 text-white shadow-md hover:bg-purple-700 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none transition-all duration-300"
        download={attachment.fileName}
        href={attachment.url}
      >
        <Download className="w-5 h-5 shrink-0" />
        <span className="flex flex-col items-start leading-tight text-left">
          <span className="text-sm font-semibold">{attachment.label}</span>
          {attachment.detail && (
            <span className="text-xs font-medium text-white/75">
              {attachment.detail}
            </span>
          )}
        </span>
      </a>
    </div>
  );
}