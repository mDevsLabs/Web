import { useState } from "react";
import { toast } from "sonner";
import { CodeEditor } from "@/components/chat/code-editor";
import { Artifact } from "@/components/chat/create-artifact";
import {
  CopyIcon,
  DownloadIcon,
  PlayIcon,
  RedoIcon,
  UndoIcon,
} from "@/components/chat/icons";
import { SandboxPreview } from "@/components/chat/sandbox-preview";

export const htmlArtifact = new Artifact<"html">({
  actions: [
    {
      description: "Copy HTML",
      icon: <CopyIcon size={18} />,
      label: "Copy",
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success("Copié !");
      },
    },
    {
      description: "Télécharger le fichier HTML",
      icon: <DownloadIcon size={18} />,
      label: "Télécharger",
      onClick: ({ content }) => {
        const blob = new Blob([content], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mai-sandbox.html";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success("Fichier HTML téléchargé");
      },
    },
    {
      description: "View Previous version",
      icon: <UndoIcon size={18} />,
      isDisabled: ({ currentVersionIndex }) => currentVersionIndex === 0,
      onClick: ({ handleVersionChange }) => handleVersionChange("prev"),
    },
    {
      description: "View Next version",
      icon: <RedoIcon size={18} />,
      isDisabled: ({ isCurrentVersion }) => isCurrentVersion,
      onClick: ({ handleVersionChange }) => handleVersionChange("next"),
    },
  ],
  content(props) {
    const {
      content,
      mode,
      isCurrentVersion,
      getDocumentContentById,
      currentVersionIndex,
    } = props as any;
    const [view, setView] = useState<"split" | "code" | "preview">("split");

    if (mode === "diff") {
      const oldContent = getDocumentContentById(currentVersionIndex - 1) ?? "";
      const newContent = getDocumentContentById(currentVersionIndex) ?? "";
      // Simple diff fallback: show both
      return (
        <div className="p-4 grid grid-cols-2 gap-4 text-xs">
          <pre className="whitespace-pre-wrap bg-muted p-2 rounded overflow-auto">
            {oldContent.slice(0, 2000)}
          </pre>
          <pre className="whitespace-pre-wrap bg-primary/5 p-2 rounded overflow-auto">
            {newContent.slice(0, 2000)}
          </pre>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full p-2 gap-2">
        <div className="flex gap-1 border-b pb-2">
          <button
            className={`px-3 py-1 text-xs rounded ${view === "split" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setView("split")}
          >
            Split
          </button>
          <button
            className={`px-3 py-1 text-xs rounded ${view === "code" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setView("code")}
          >
            Code
          </button>
          <button
            className={`px-3 py-1 text-xs rounded ${view === "preview" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setView("preview")}
          >
            Preview Live
          </button>
        </div>
        <div
          className={`flex-1 grid gap-2 ${view === "split" ? "grid-cols-2" : "grid-cols-1"} min-h-[400px]`}
        >
          {(view === "split" || view === "code") && (
            <div className="border rounded overflow-hidden">
              <CodeEditor
                {...props}
                content={
                  isCurrentVersion
                    ? content
                    : getDocumentContentById(currentVersionIndex)
                }
              />
            </div>
          )}
          {(view === "split" || view === "preview") && (
            <div className="border rounded p-2 bg-background overflow-hidden flex flex-col">
              <SandboxPreview
                content={
                  isCurrentVersion
                    ? content
                    : getDocumentContentById(currentVersionIndex)
                }
              />
            </div>
          )}
        </div>
      </div>
    );
  },
  description:
    "Pages HTML/Tailwind/React interactives avec sandbox live (console, responsive, export).",
  kind: "html",
  onStreamPart: ({ streamPart, setArtifact }: any) => {
    if ((streamPart as any).type === "data-htmlDelta") {
      setArtifact((draft: any) => ({
        ...draft,
        content: (streamPart as any).data as string,
        isVisible:
          draft.status === "streaming" &&
          draft.content.length > 200 &&
          draft.content.length < 300
            ? true
            : draft.isVisible,
        status: "streaming",
      }));
    }
  },
  toolbar: [
    {
      description: "Télécharger la page HTML (aperçu sûr, hors origine applicative)",
      icon: <PlayIcon size={18} />,
      onClick: async (props: any) => {
        const c = props.content ?? "";
        // `window.open(URL.createObjectURL(blob))` faisait hériter au document
        // ouvert l'origine de l'application : le HTML (produit par le modèle ou
        // fourni par l'utilisateur) s'exécutait alors same-origin, avec accès à
        // window.opener, aux cookies et au stockage. Un téléchargement de
        // fichier conserve l'aperçu sans jamais donner cette origine.
        const blob = new Blob([c], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mai-sandbox.html";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success("Page HTML téléchargée");
      },
    },
  ],
});
