import { toast } from "sonner";
import { CodeEditor } from "@/components/chat/code-editor";
import { Artifact } from "@/components/chat/create-artifact";
import {
  CopyIcon,
  LogsIcon,
  MessageIcon,
  RedoIcon,
  UndoIcon,
} from "@/components/chat/icons";

type Metadata = {
  outputs: unknown[];
};

const codeArtifactContent: Artifact<"code", Metadata>["content"] =
  function CodeArtifactContent({ metadata, ...props }) {
    return (
      <>
        <div className="relative min-h-[200px]">
          <CodeEditor {...props} />
        </div>

        {metadata?.outputs && metadata.outputs.length > 0 ? (
          <pre className="bg-muted/40 p-3 text-xs text-muted-foreground">
            {JSON.stringify(metadata.outputs, null, 2)}
          </pre>
        ) : null}
      </>
    );
  };

export const codeArtifact = new Artifact<"code", Metadata>({
  actions: [
    {
      description: "Voir la version précédente",
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
      description: "Voir la version suivante",
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
      description: "Copier le code dans le presse-papiers",
      icon: <CopyIcon size={18} />,
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success("Code copié dans le presse-papiers !");
      },
    },
  ],
  content: codeArtifactContent,
  description: "Utile pour générer du code.",
  initialize: ({ setMetadata }) => {
    setMetadata({
      outputs: [],
    });
  },
  kind: "code",
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === "data-codeDelta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.data,
        isVisible:
          draftArtifact.status === "streaming" &&
          draftArtifact.content.length > 300 &&
          draftArtifact.content.length < 310
            ? true
            : draftArtifact.isVisible,
        status: "streaming",
      }));
    }
  },
  toolbar: [
    {
      description: "Ajouter des commentaires",
      icon: <MessageIcon />,
      onClick: ({ sendMessage }) => {
        sendMessage({
          parts: [
            {
              text: "Ajoute des commentaires à cet extrait de code pour faciliter sa compréhension",
              type: "text",
            },
          ],
          role: "user",
        });
      },
    },
    {
      description: "Ajouter des journaux",
      icon: <LogsIcon />,
      onClick: ({ sendMessage }) => {
        sendMessage({
          parts: [
            {
              text: "Ajoute des journaux à cet extrait de code pour faciliter le débogage",
              type: "text",
            },
          ],
          role: "user",
        });
      },
    },
  ],
});
