import { toast } from "sonner";
import { Artifact } from "@/components/chat/create-artifact";
import {
  CopyIcon,
  DownloadIcon,
  RedoIcon,
  UndoIcon,
} from "@/components/chat/icons";
import { ImageEditor } from "@/components/chat/image-editor";
import { copyImageToClipboard, downloadImage } from "@/lib/utils";

export const imageArtifact = new Artifact({
  actions: [
    {
      description: "View Previous version",
      icon: <UndoIcon size={18} />,
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }

        return false;
      },
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("prev");
      },
    },
    {
      description: "View Next version",
      icon: <RedoIcon size={18} />,
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }

        return false;
      },
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("next");
      },
    },
    {
      description: "Download image",
      icon: <DownloadIcon size={18} />,
      onClick: ({ content }) => {
        downloadImage(content, "mai-image.png");
        toast.success("Téléchargement de l'image lancé !");
      },
    },
    {
      description: "Copy image to clipboard",
      icon: <CopyIcon size={18} />,
      onClick: async ({ content }) => {
        const success = await copyImageToClipboard(content);
        if (success) {
          toast.success("Image copiée dans le presse-papier !");
        } else {
          toast.error("Impossible de copier l'image.");
        }
      },
    },
  ],
  content: ImageEditor,
  description: "Useful for image generation",
  kind: "image",
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === "data-imageDelta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.data,
        isVisible: true,
        status: "idle",
      }));
    }
  },
  toolbar: [],
});
