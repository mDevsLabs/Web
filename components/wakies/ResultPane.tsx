"use client";

import {
  ArrowDownToLine,
  ArrowUpRight,
  BookOpen,
  ExternalLink,
  Monitor,
  X,
} from "lucide-react";
import { useState } from "react";
import { ComputerPanel } from "@/components/wakies/ComputerPanel";
import { Mascot } from "@/components/wakies/Mascot";
import { Markdown } from "@/components/wakies/markdown";
import type { Result, Status, Wakie } from "@/lib/wakies/shared/types";
export function ResultPane({
  latest,
  status,
  wakieState,
  onClose,
  wakies,
  defaultWakieId,
}: {
  wakies: Wakie[];
  defaultWakieId: string;
  latest?: Result | null;
  status?: Status;
  wakieState: string;
  onClose: () => void;
}) {
  const [resultTab, setResultTab] = useState<"Brief" | "Computer">("Computer");
  const [computerWakieId, setComputerWakieId] = useState(defaultWakieId);
  const computerWakie =
    wakies.find((wakie) => wakie.id === computerWakieId) ??
    wakies.find((wakie) => wakie.id === defaultWakieId) ??
    wakies[0];
  return (
    <aside className="result-pane">
      <div className="pane-header">
        <div className="pane-tabs">
          <button
            className={resultTab === "Brief" ? "selected" : ""}
            onClick={() => setResultTab("Brief")}
          >
            <BookOpen size={15} />
            Synthèse
          </button>
          <button
            className={resultTab === "Computer" ? "selected" : ""}
            onClick={() => setResultTab("Computer")}
          >
            <Monitor size={15} /> Ordinateur de {computerWakie?.name ?? "Wakie"}
          </button>
        </div>
        <button
          aria-label="Fermer le panneau de résultat"
          className="icon-button"
          onClick={() => onClose()}
        >
          <X size={16} />
        </button>
      </div>
      {resultTab === "Computer" ? (
        <>
          <label className="computer-wakie-picker">
            Ordinateur de
            <select
              aria-label="Choisir l’ordinateur du Wakie"
              onChange={(event) => setComputerWakieId(event.target.value)}
              value={computerWakie?.id ?? ""}
            >
              {wakies.map((wakie) => (
                <option key={wakie.id} value={wakie.id}>
                  {wakie.name}
                </option>
              ))}
            </select>
          </label>
          {computerWakie ? (
            <ComputerPanel key={computerWakie.id} wakie={computerWakie} />
          ) : (
            <p className="computer-panel">
              Créez un Wakie pour lui donner un ordinateur.
            </p>
          )}
        </>
      ) : latest ? (
        <div className="result-content">
          <div className="result-meta">
            <span className="eyebrow">
              {latest.sample
                ? "EXEMPLE DE SYNTHÈSE FICTIVE"
                : "SYNTHÈSE DE RECHERCHE"}
            </span>
            <button
              aria-label="Télécharger la synthèse"
              className="icon-button"
              onClick={() => {
                const blob = new Blob(
                  [
                    latest.text +
                      "\n\nSources\n" +
                      latest.sources
                        .map((s) => `${s.title}: ${s.url}`)
                        .join("\n"),
                  ],
                  { type: "text/plain" }
                );
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = "wakies-brief.txt";
                anchor.click();
                URL.revokeObjectURL(url);
              }}
            >
              <ArrowDownToLine size={16} />
            </button>
          </div>
          {latest.sample && (
            <div className="sample-note">
              Exemple de ce que Wakie sait faire. Les constats et les sources
              ci-dessous sont inventés.
            </div>
          )}
          <article className="brief">
            <Markdown
              components={{
                a: ({ children, href }) => (
                  <a href={href} rel="noreferrer" target="_blank">
                    {children}
                  </a>
                ),
                img: ({ alt }) => (
                  <span>{alt ? `[Image : ${alt}]` : "[Image omise]"}</span>
                ),
              }}
            >
              {latest.text}
            </Markdown>
          </article>
          <section className="sources">
            <h3>
              Notes de sources <span>{latest.sources.length}</span>
            </h3>
            {latest.sources.map((source) =>
              latest.sample ? (
                <div className="source-card" key={source.url}>
                  <span className="source-icon">
                    <BookOpen size={15} />
                  </span>
                  <div>
                    <strong>{source.title}</strong>
                    <p>{source.excerpt}</p>
                    <small>Source fictive · lien non actif</small>
                  </div>
                </div>
              ) : (
                <a
                  className="source-card"
                  href={source.url}
                  key={source.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="source-icon">
                    <ExternalLink size={15} />
                  </span>
                  <div>
                    <strong>{source.title}</strong>
                    <p>{source.excerpt}</p>
                    <small>{new URL(source.url).hostname}</small>
                  </div>
                  <ArrowUpRight size={15} />
                </a>
              )
            )}
          </section>
        </div>
      ) : (
        <div className="pane-empty">
          <Mascot
            identity={defaultWakieId}
            name={wakies.find((wakie) => wakie.id === defaultWakieId)?.name}
            state={wakieState}
          />
          <h3>De la place pour vos conclusions.</h3>
          <p>
            {status === "failed"
              ? "Résolvez l’erreur et réessayez pour créer une synthèse de recherche."
              : "Votre synthèse et vos sources apparaîtront ici après une exécution réussie."}
          </p>
        </div>
      )}
    </aside>
  );
}
