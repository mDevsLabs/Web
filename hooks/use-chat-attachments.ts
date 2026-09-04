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
        toast.success(`Fichier Cloud importé : ${parsed.name}`);
      }
    } catch {}
  }, [setAttachments]);

  // Vider les pièces jointes si le modèle sélectionné ne supporte pas les fichiers
  useEffect(() => {
    if (!hasStrictCaps) return;
    if (!hasVisionSupport && attachments.length > 0) {
      setAttachments([]);
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
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/files/upload`,
          {
            body: formData,
            method: "POST",
          }
        );

        if (response.ok) {
          const data = await response.json();
          const { url, pathname, contentType } = data;

          return {
            contentType,
            name: pathname,
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

      if (files.length > 0) {
        const remainingSlots = MAX_FILES_PER_MESSAGE - attachments.length;
        if (remainingSlots <= 0) {
          toast.error(`Maximum ${MAX_FILES_PER_MESSAGE} fichiers par message.`);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        }
        if (files.length > remainingSlots) {
          toast.error(
            `Maximum ${MAX_FILES_PER_MESSAGE} fichiers par message. Seuls ${remainingSlots} fichier(s) ont été ajoutés.`
          );
        }
        const accepted = files.slice(0, Math.max(remainingSlots, 0));
        const oversized = accepted.find(
          (file) => uploadedBytesRef.current + file.size > MAX_TOTAL_SIZE_BYTES
        );
        if (oversized) {
          toast.error(
            "Limite de 50 Mo par message dépassée. Retirez des pièces jointes ou choisissez des fichiers plus légers."
          );
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        }
      }

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment): attachment is Attachment => attachment !== undefined
        );
        uploadedBytesRef.current += uploadedAttachments.reduce(
          (total, attachment, index) =>
            attachment === undefined
              ? total
              : total + (files[index]?.size ?? 0),
          0
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch {
        toast.error("Échec lors du téléversement des fichiers");
      } finally {
        setUploadQueue([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [
      setAttachments,
      uploadFile,
      hasVisionSupport,
      hasStrictCaps,
      attachments.length,
    ]
  );

  const handleCloudAttachments = useCallback(
    (newAttachments: Attachment[]) => {
      if (!hasVisionSupport && hasStrictCaps) {
        toast.error(
          "Ce modèle ne prend pas en charge l'importation de fichiers."
        );
        return;
      }
      setAttachments((curr) => [...curr, ...newAttachments]);
    },
    [setAttachments, hasVisionSupport, hasStrictCaps]
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
      setUploadQueue((prev) => [...prev, "Image collée"]);

      try {
        const uploadPromises = imageItems
          .map((item) => item.getAsFile())
          .filter((file): file is File => file !== null)
          .map((file) => uploadFile(file));

        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment): attachment is Attachment =>
            Boolean(attachment && attachment.url && attachment.contentType)
        );

        setAttachments((curr) => [
          ...curr,
          ...(successfullyUploadedAttachments as Attachment[]),
        ]);
      } catch {
        toast.error("Échec du téléversement de l'image collée");
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, uploadFile, hasVisionSupport, hasStrictCaps]
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
      setAttachments((current) =>
        current.filter((_, i) => i !== indexToRemove)
      );
    },
    [setAttachments]
  );

  const resetUploadedBytes = useCallback(() => {
    uploadedBytesRef.current = 0;
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
