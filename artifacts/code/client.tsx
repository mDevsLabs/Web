import { toast } from "sonner";
import { CodeDiffView } from "@/components/chat/code-diff-view";
import { CodeEditor } from "@/components/chat/code-editor";
import { Artifact } from "@/components/chat/create-artifact";
import {
  CopyIcon,
  DeltaIcon,
  LogsIcon,
  MessageIcon,
  RedoIcon,
  UndoIcon,
} from "@/components/chat/icons";

type Metadata = {
  outputs: unknown[];
};

const codeArtifactContent: Artifact<"code", Metadata>["content"] =
  function CodeArtifactContent({
    metadata,
    mode,
    status,
    content,
    isCurrentVersion,
    currentVersionIndex,
    onSaveContent,
    getDocumentContentById,
    isLoading,
    ...props
  }) {
    if (isLoading) {
      return (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Chargement du code...
        </div>
      );
    }

    if (mode === "diff") {
      const prevContent = getDocumentContentById(currentVersionIndex - 1);
      return (
        <div className="relative min-h-[300px] p-2">
          <CodeDiffView
            language={(props as any).language || "code"}
            newContent={content}
            oldContent={prevContent}
          />
        </div>
      );
    }

    return (
      <>
        <div className="relative min-h-[200px]">
          <CodeEditor
            content={content}
            currentVersionIndex={currentVersionIndex}
            isCurrentVersion={isCurrentVersion}
            onSaveContent={onSaveContent}
            status={status}
            suggestions={props.suggestions}
          />
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
      description: "Basculer la comparaison (Diff)",
      icon: <DeltaIcon size={18} />,
      isDisabled: ({ currentVersionIndex }) => currentVersionIndex === 0,
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("toggle");
      },
    },
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
        isVisible: true,
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
