"use client";

/** Accueil Wakies inspiré de l’écran Today d’OpenMuse, construit avec les données mAI existantes. */
import { ArrowUpRightIcon } from "@mdevs/icons/arrows/arrow-up-right";
import { MessageCircleIcon } from "@mdevs/icons/communication/message-circle";
import { FolderIcon } from "@mdevs/icons/files/folder";
import { SparklesIcon } from "@mdevs/icons/misc/sparkles";
import { CalendarDaysIcon } from "@mdevs/icons/time/calendar-days";
import { Button } from "@mdevs/ui/primitives/button";
import { Mascot } from "@/components/wakies/Mascot";
import type {
  Conversation,
  Space,
  Task,
  Wakie,
} from "@/lib/wakies/shared/types";

type TodayScreenProps = {
  busy: boolean;
  configured: boolean;
  conversations: Conversation[];
  onCreateConversation: (prompt?: string) => void;
  onOpenConversation: (conversation: Conversation) => void;
  onOpenSpace: (spaceId: string) => void;
  onSection: (
    section: "chat" | "goals" | "ideas" | "memories" | "tasks"
  ) => void;
  paused: boolean;
  spaces: Space[];
  tasks: Task[];
  wakies: Wakie[];
};

const SUGGESTIONS = [
  "Aidez-moi à organiser mes idées",
  "Aidez-moi à avancer sur une tâche",
  "Résumez une page que je vous partagerai",
];

export function TodayScreen({
  conversations,
  busy,
  configured,
  onCreateConversation,
  onOpenConversation,
  onOpenSpace,
  onSection,
  paused,
  spaces,
  tasks,
  wakies,
}: TodayScreenProps) {
  const conversationsRecentes = conversations.slice(0, 4);
  const tachesActives = tasks.filter(
    (task) =>
      task.status === "queued" ||
      task.status === "running" ||
      task.status === "paused"
  );
  const wakieParId = new Map(wakies.map((wakie) => [wakie.id, wakie]));

  return (
    <main className="muse-screen today-screen">
      <section className="today-hero">
        <div className="today-hero-copy">
          <span className="today-eyebrow">
            <SparklesIcon aria-hidden="true" size={15} />
            UN PEU DE CLARTÉ, CHAQUE JOUR
          </span>
          <h1>Votre journée, avec un peu plus d’espace.</h1>
          <p>
            Reprenez une conversation, confiez une prochaine étape à un Wakie ou
            posez simplement vos idées.
          </p>
          <div className="today-hero-actions">
            <Button
              disabled={!configured || busy}
              onClick={() => onCreateConversation()}
              type="button"
              variant="solid"
            >
              <MessageCircleIcon aria-hidden="true" size={17} />
              Nouvelle conversation
            </Button>
            <Button
              onClick={() => onSection("tasks")}
              type="button"
              variant="outline"
            >
              <CalendarDaysIcon aria-hidden="true" size={17} />
              Voir l’activité
            </Button>
          </div>
        </div>
        <div aria-label="État des Wakies" className="today-status">
          <span className={`today-status-dot${paused ? " is-paused" : ""}`} />
          <span>
            <strong>{paused ? "En pause" : "Prêts à vous aider"}</strong>
            <small>
              {paused
                ? "Reprenez-les quand vous le souhaitez."
                : `${wakies.length} ${wakies.length > 1 ? "Wakies" : "Wakie"} dans votre espace`}
            </small>
          </span>
        </div>
      </section>

      <div aria-label="Raccourcis" className="today-shortcuts">
        <Button
          className="today-shortcut"
          onClick={() => onSection("tasks")}
          type="button"
          variant="outline"
        >
          <span className="today-shortcut-icon">
            <CalendarDaysIcon aria-hidden="true" size={18} />
          </span>
          <span>
            <strong>Activité</strong>
            <small>
              {tachesActives.length
                ? `${tachesActives.length} tâche${tachesActives.length > 1 ? "s" : ""} à suivre`
                : "Vos tâches planifiées"}
            </small>
          </span>
          <ArrowUpRightIcon
            aria-hidden="true"
            className="today-shortcut-arrow"
            size={16}
          />
        </Button>
        <Button
          className="today-shortcut"
          onClick={() => onSection("goals")}
          type="button"
          variant="outline"
        >
          <span className="today-shortcut-icon">
            <SparklesIcon aria-hidden="true" size={18} />
          </span>
          <span>
            <strong>Objectifs</strong>
            <small>Vos pages et prochaines étapes</small>
          </span>
          <ArrowUpRightIcon
            aria-hidden="true"
            className="today-shortcut-arrow"
            size={16}
          />
        </Button>
        <Button
          className="today-shortcut"
          onClick={() => onSection("memories")}
          type="button"
          variant="outline"
        >
          <span className="today-shortcut-icon">
            <FolderIcon aria-hidden="true" size={18} />
          </span>
          <span>
            <strong>Mémoires</strong>
            <small>Le contexte que vous avez choisi</small>
          </span>
          <ArrowUpRightIcon
            aria-hidden="true"
            className="today-shortcut-arrow"
            size={16}
          />
        </Button>
      </div>

      <div className="today-panels">
        <section aria-labelledby="today-recent-title" className="today-panel">
          <div className="today-panel-heading">
            <div>
              <span className="today-eyebrow">REPRENDRE</span>
              <h2 id="today-recent-title">Vos conversations récentes</h2>
            </div>
            <Button
              onClick={() => onSection("chat")}
              type="button"
              variant="ghost"
            >
              Toutes les conversations
              <ArrowUpRightIcon aria-hidden="true" size={15} />
            </Button>
          </div>
          {conversationsRecentes.length ? (
            <ul className="today-conversation-list">
              {conversationsRecentes.map((conversation) => {
                const owner = wakieParId.get(conversation.wakieId);
                return (
                  <li key={conversation.id}>
                    <Button
                      className="today-conversation"
                      onClick={() => onOpenConversation(conversation)}
                      type="button"
                      variant="ghost"
                    >
                      <Mascot
                        avatar={owner?.avatar}
                        decorative
                        identity={owner?.id ?? conversation.wakieId}
                        name={owner?.name ?? "Wakie"}
                        small
                      />
                      <span className="today-conversation-copy">
                        <strong>{conversation.title}</strong>
                        <small>{owner?.name ?? "Wakie"}</small>
                      </span>
                      <ArrowUpRightIcon
                        aria-hidden="true"
                        className="today-shortcut-arrow"
                        size={16}
                      />
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="today-empty">
              <MessageCircleIcon aria-hidden="true" size={21} />
              <p>Vos prochaines idées peuvent commencer ici.</p>
              <Button
                disabled={!configured || busy}
                onClick={() => onCreateConversation()}
                type="button"
                variant="outline"
              >
                Démarrer une conversation
              </Button>
            </div>
          )}
          <div aria-label="Idées de départ" className="today-suggestions">
            {SUGGESTIONS.map((prompt) => (
              <Button
                disabled={!configured || busy}
                key={prompt}
                onClick={() => onCreateConversation(prompt)}
                type="button"
                variant="outline"
              >
                {prompt}
              </Button>
            ))}
          </div>
        </section>

        <section aria-labelledby="today-tasks-title" className="today-panel">
          <div className="today-panel-heading">
            <div>
              <span className="today-eyebrow">À SUIVRE</span>
              <h2 id="today-tasks-title">Tâches planifiées</h2>
            </div>
            <Button
              onClick={() => onSection("tasks")}
              type="button"
              variant="ghost"
            >
              Tout voir
              <ArrowUpRightIcon aria-hidden="true" size={15} />
            </Button>
          </div>
          {tachesActives.length ? (
            <ul className="today-task-list">
              {tachesActives.slice(0, 3).map((task) => (
                <li key={task.id}>
                  <Button
                    className="today-task"
                    onClick={() => onSection("tasks")}
                    type="button"
                    variant="ghost"
                  >
                    <span className={`today-task-mark is-${task.status}`} />
                    <span>
                      <strong>{task.prompt}</strong>
                      <small>
                        {task.status === "running"
                          ? "En cours"
                          : task.status === "paused"
                            ? "En pause"
                            : "À venir"}
                      </small>
                    </span>
                    <ArrowUpRightIcon
                      aria-hidden="true"
                      className="today-shortcut-arrow"
                      size={15}
                    />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="today-empty">
              <CalendarDaysIcon aria-hidden="true" size={20} />
              <p>Aucune tâche n’attend votre attention.</p>
              <Button
                onClick={() => onSection("tasks")}
                type="button"
                variant="outline"
              >
                Découvrir l’activité
              </Button>
            </div>
          )}
        </section>

        <section aria-labelledby="today-spaces-title" className="today-panel">
          <div className="today-panel-heading">
            <div>
              <span className="today-eyebrow">VOTRE ESPACE DE TRAVAIL</span>
              <h2 id="today-spaces-title">Espaces</h2>
            </div>
          </div>
          {spaces.length ? (
            <ul className="today-space-list">
              {spaces.slice(0, 4).map((space) => (
                <li key={space.id}>
                  <Button
                    className="today-space"
                    onClick={() => onOpenSpace(space.id)}
                    type="button"
                    variant="ghost"
                  >
                    <span className="today-space-icon">
                      <FolderIcon aria-hidden="true" size={17} />
                    </span>
                    <span>
                      <strong>{space.name}</strong>
                      <small>
                        {space.description || "Pages et conversations"}
                      </small>
                    </span>
                    <ArrowUpRightIcon
                      aria-hidden="true"
                      className="today-shortcut-arrow"
                      size={15}
                    />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="today-empty">
              <p>Créez un espace pour organiser vos pages.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
