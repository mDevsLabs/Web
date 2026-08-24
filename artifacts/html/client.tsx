import { useState } from "react";
import { toast } from "sonner";
import { CodeEditor } from "@/components/chat/code-editor";
import { Artifact } from "@/components/chat/create-artifact";
import {
  CopyIcon,
  PlayIcon,
  RedoIcon,
  UndoIcon,
} from "@/components/chat/icons";

const HtmlPreview = ({ content }: { content: string }) => {
  const [key, setKey] = useState(0);
  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-muted-foreground">
          Aperçu Live
        </span>
        <button
          className="text-xs px-2 py-1 rounded border hover:bg-muted"
          onClick={() => setKey((k) => k + 1)}
        >
          Recharger
        </button>
      </div>
      <iframe
        className="w-full flex-1 min-h-[300px] rounded border bg-white"
        key={key}
        sandbox="allow-scripts allow-same-origin"
        srcDoc={content}
        title="HTML Preview"
      />
    </div>
  );
};

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
            Preview
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
            <div className="border rounded p-2 bg-white overflow-hidden flex flex-col">
              <HtmlPreview
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
  description: "Génération de pages HTML interactives avec aperçu live.",
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
      description: "Preview in new tab",
      icon: <PlayIcon size={18} />,
      onClick: async (props: any) => {
        const c = props.content ?? "";
        const blob = new Blob([c], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      },
    },
  ],
});
