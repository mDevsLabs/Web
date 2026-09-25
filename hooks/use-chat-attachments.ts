import {
  type ChangeEvent,
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { apiEndpoints } from "@/lib/client/api-endpoints";
import { MAI_PENDING_ATTACHMENT_KEY } from "@/lib/constants";
import type { Attachment } from "@/lib/types";

export const MAX_FILES_PER_MESSAGE = 4;
export const MAX_TOTAL_SIZE_BYTES = 50 * 1024 * 1024; // 50 Mo

export interface UseChatAttachmentsOptions {
  attachments: Attachment[];
  hasStrictCaps: boolean;
  hasVisionSupport: boolean;
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
}

export function useChatAttachments({
  attachments,
  setAttachments,
  hasVisionSupport,
  hasStrictCaps,
  textareaRef,
}: UseChatAttachmentsOptions) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedBytesRef = useRef(0);
  const uploadedFileSizesRef = useRef(new Map<string, number>());
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);

  // Handoff Cloud -> Chat via sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(MAI_PENDING_ATTACHMENT_KEY);
      if (!raw) return;
      sessionStorage.removeItem(MAI_PENDING_ATTACHMENT_KEY);
      const parsed = JSON.parse(raw) as Attachment;
      if (parsed?.url && parsed?.name) {
        setAttachments((curr) => {
          if (curr.some((a) => a.url === parsed.url)) return curr;
          return [...curr, parsed];
        });
        if (typeof parsed.size === "number") {
          uploadedFileSizesRef.current.set(parsed.url, parsed.size);
          uploadedBytesRef.current += parsed.size;
        }
        toast.success(`Fichier Cloud importé : ${parsed.name}`);
      }
    } catch {}
  }, [setAttachments]);

  // Vider les pièces jointes si le modèle sélectionné ne supporte pas les fichiers
  useEffect(() => {
    if (!hasStrictCaps) return;
    if (!hasVisionSupport && attachments.length > 0) {
      setAttachments([]);
      uploadedBytesRef.current = 0;
      uploadedFileSizesRef.current.clear();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.error(
        "Pièces jointes retirées : ce modèle ne prend pas en charge les fichiers/images."
      );
    }
  }, [hasVisionSupport, hasStrictCaps, attachments.length, setAttachments]);

  const uploadFile = useCallback(
    async (file: File): Promise<Attachment | undefined> => {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(apiEndpoints.fileUpload(), {
          body: formData,
          method: "POST",
        });

        if (response.ok) {
          const data = await response.json();
          const { url, pathname, contentType } = data;

          return {
            contentType,
            name: file.name || pathname || "fichier",
            size: file.size,
            url,
          };
        }
        const { error } = await response.json();
        toast.error(error || "Échec de l'envoi du fichier");
      } catch {
        toast.error(
          "Impossible de téléverser le fichier, veuillez réessayer !"
        );
      }
    },
    []
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        return;
      }

      const remainingSlots = MAX_FILES_PER_MESSAGE - attachments.length;
      if (remainingSlots <= 0) {
        toast.error(`Maximum ${MAX_FILES_PER_MESSAGE} fichiers par message.`);
        return;
      }

      const candidates = files.slice(0, remainingSlots);
      if (files.length > candidates.length) {
        toast.error(
          `Maximum ${MAX_FILES_PER_MESSAGE} fichiers par message. Seuls ${candidates.length} fichier(s) seront ajoutés.`
        );
      }

      let projectedBytes = uploadedBytesRef.current;
      const accepted: File[] = [];
      let rejectedForSize = 0;
      for (const file of candidates) {
        if (projectedBytes + file.size > MAX_TOTAL_SIZE_BYTES) {
          rejectedForSize += 1;
          continue;
        }
        accepted.push(file);
        projectedBytes += file.size;
      }

      if (rejectedForSize > 0) {
        toast.error(
          `${rejectedForSize} fichier(s) dépassent la limite de 50 Mo par message.`
        );
      }
      if (accepted.length === 0) {
        return;
      }

      setUploadQueue(accepted.map((file) => file.name));
      try {
        const results = await Promise.all(
          accepted.map(async (file) => ({
            attachment: await uploadFile(file),
            file,
          }))
        );
        const successfullyUploaded = results.flatMap(({ attachment, file }) => {
          if (!attachment) {
            return [];
          }
          uploadedFileSizesRef.current.set(attachment.url, file.size);
          uploadedBytesRef.current += file.size;
          return [attachment];
        });

        if (successfullyUploaded.length > 0) {
          setAttachments((currentAttachments) => [
            ...currentAttachments,
            ...successfullyUploaded,
          ]);
        }
      } catch {
        toast.error("Échec lors du téléversement des fichiers");
      } finally {
        setUploadQueue([]);
      }
    },
    [attachments.length, setAttachments, uploadFile]
  );

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (!hasVisionSupport && hasStrictCaps) {
        toast.error(
          "Ce modèle ne prend pas en charge l'importation de fichiers."
        );
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      const files = Array.from(event.target.files || []);
      try {
        await uploadFiles(files);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [hasStrictCaps, hasVisionSupport, uploadFiles]
  );

  const handleCloudAttachments = useCallback(
    (newAttachments: Attachment[]) => {
      if (!hasVisionSupport && hasStrictCaps) {
        toast.error(
          "Ce modèle ne prend pas en charge l'importation de fichiers."
        );
        return;
      }

      const remainingSlots = MAX_FILES_PER_MESSAGE - attachments.length;
      if (remainingSlots <= 0) {
        toast.error(`Maximum ${MAX_FILES_PER_MESSAGE} fichiers par message.`);
        return;
      }

      const candidates = newAttachments.slice(0, remainingSlots);
      const accepted: Attachment[] = [];
      let projectedBytes = uploadedBytesRef.current;
      let rejectedForSize = 0;
      for (const attachment of candidates) {
        if (
          typeof attachment.size === "number" &&
          projectedBytes + attachment.size > MAX_TOTAL_SIZE_BYTES
        ) {
          rejectedForSize += 1;
          continue;
        }
        accepted.push(attachment);
        if (typeof attachment.size === "number") {
          projectedBytes += attachment.size;
        }
      }

      if (newAttachments.length > candidates.length) {
        toast.error(
          `Maximum ${MAX_FILES_PER_MESSAGE} fichiers par message. Seuls ${candidates.length} fichier(s) seront ajoutés.`
        );
      }
      if (rejectedForSize > 0) {
        toast.error(
          `${rejectedForSize} fichier(s) Cloud dépassent la limite de 50 Mo par message.`
        );
      }
      if (accepted.length === 0) {
        return;
      }

      for (const attachment of accepted) {
        if (typeof attachment.size === "number") {
          uploadedFileSizesRef.current.set(attachment.url, attachment.size);
        }
      }
      uploadedBytesRef.current = projectedBytes;
      setAttachments((curr) => [...curr, ...accepted]);
    },
    [attachments.length, hasStrictCaps, hasVisionSupport, setAttachments]
  );

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      if (!hasVisionSupport && hasStrictCaps) {
        const itemsCheck = event.clipboardData?.items;
        if (itemsCheck) {
          const hasImages = Array.from(itemsCheck).some((i) =>
            i.type.startsWith("image/")
          );
          if (hasImages) {
            event.preventDefault();
            toast.error(
              "Ce modèle ne prend pas en charge les images. Changez de modèle pour coller des fichiers."
            );
            return;
          }
        }
        return;
      }
      const items = event.clipboardData?.items;
      if (!items) return;

      const imageItems = Array.from(items).filter((item) =>
        item.type.startsWith("image/")
      );
      if (imageItems.length === 0) return;

      event.preventDefault();
      const imageFiles = imageItems
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null);
      await uploadFiles(imageFiles);
    },
    [hasStrictCaps, hasVisionSupport, uploadFiles]
  );

  useEffect(() => {
    const textarea = textareaRef?.current;
    if (!textarea) return;

    const onPaste = (e: ClipboardEvent) => handlePaste(e);
    textarea.addEventListener("paste", onPaste);
    return () => {
      textarea.removeEventListener("paste", onPaste);
    };
  }, [handlePaste, textareaRef]);

  const removeAttachment = useCallback(
    (indexToRemove: number) => {
      const removed = attachments[indexToRemove];
      if (removed) {
        const size = uploadedFileSizesRef.current.get(removed.url);
        if (typeof size === "number") {
          uploadedBytesRef.current = Math.max(
            0,
            uploadedBytesRef.current - size
          );
          uploadedFileSizesRef.current.delete(removed.url);
        }
      }
      setAttachments((current) =>
        current.filter((_, i) => i !== indexToRemove)
      );
    },
    [attachments, setAttachments]
  );

  const resetUploadedBytes = useCallback(() => {
    uploadedBytesRef.current = 0;
    uploadedFileSizesRef.current.clear();
  }, []);

  return {
    fileInputRef,
    handleCloudAttachments,
    handleFileChange,
    removeAttachment,
    resetUploadedBytes,
    uploadQueue,
  };
}
