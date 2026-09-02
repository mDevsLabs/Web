import {
  ArchiveIcon,
  CodeIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  MusicIcon,
  VideoIcon,
} from "lucide-react";
import Image from "next/image";
import type { Attachment } from "@/lib/types";
import { Spinner } from "../ui/spinner";
import { CrossSmallIcon } from "./icons";

function getAttachmentIcon(contentType?: string, name?: string) {
  const ct = (contentType || "").toLowerCase();
  const n = (name || "").toLowerCase();
  if (ct.includes("pdf") || n.endsWith(".pdf")) {
    return <FileTextIcon className="size-6 text-red-500" />;
  }
  if (
    ct.includes("sheet") ||
    ct.includes("excel") ||
    n.endsWith(".csv") ||
    n.endsWith(".xlsx")
  ) {
    return <FileSpreadsheetIcon className="size-6 text-green-500" />;
  }
  if (ct.includes("video") || /\.(mp4|webm|mov)$/i.test(n)) {
    return <VideoIcon className="size-6 text-purple-500" />;
  }
  if (ct.includes("audio") || /\.(mp3|wav|ogg)$/i.test(n)) {
    return <MusicIcon className="size-6 text-pink-500" />;
  }
  if (
    ct.includes("zip") ||
    ct.includes("tar") ||
    /\.(zip|rar|7z|tar|gz)$/i.test(n)
  ) {
    return <ArchiveIcon className="size-6 text-amber-500" />;
  }
  if (
    ct.includes("javascript") ||
    ct.includes("typescript") ||
    ct.includes("json") ||
    /\.(ts|tsx|js|jsx|py|json|html|css|sql|sh)$/i.test(n)
  ) {
    return <CodeIcon className="size-6 text-emerald-500" />;
  }
  return <FileIcon className="size-6 text-muted-foreground" />;
}

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
  onRemove,
}: {
  attachment: Attachment;
  isUploading?: boolean;
  onRemove?: () => void;
}) => {
  const { name, url, contentType } = attachment;

  return (
    <div
      className="group relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-card/60 backdrop-blur-xs shadow-xs"
      data-testid="input-attachment-preview"
    >
      {contentType?.startsWith("image") && url ? (
        <Image
          alt={name ?? "attachment"}
          className="size-full object-cover"
          height={96}
          src={url}
          width={96}
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center p-2 text-center gap-1">
          {getAttachmentIcon(contentType, name)}
          <span className="text-[10px] text-muted-foreground font-medium truncate max-w-full px-1">
            {name || "Fichier"}
          </span>
        </div>
      )}

      {isUploading ? (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-sm"
          data-testid="input-attachment-loader"
        >
          <Spinner className="size-5" />
        </div>
      ) : null}

      {onRemove && !isUploading && (
        <button
          className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 backdrop-blur-sm transition-opacity hover:bg-black/80"
          onClick={onRemove}
          type="button"
        >
          <CrossSmallIcon size={10} />
        </button>
      )}
    </div>
  );
};
