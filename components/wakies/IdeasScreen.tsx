/** Le moteur source s'appuie sur ses workers et connecteurs. Ne pas présenter de suggestions inventées comme des données personnelles. */
export function IdeasScreen({
  onGoals,
  onMemories,
}: {
  onGoals: () => void;
  onMemories: () => void;
}) {
  return (
    <main className="main-content muse-screen">
      <header className="page-heading">
        <div>
          <h1>Un peu d’inspiration</h1>
          <p>
            Les suggestions automatiques fondées sur vos sources ne sont pas
            encore configurées.
          </p>
        </div>
      </header>
      <article className="muse-card">
        <h2>Partir de ce qui compte pour vous</h2>
        <p>
          Vous pouvez déjà organiser vos objectifs et partager vos préférences
          avec vos Wakies. Aucune messagerie externe ni calendrier n’est
          connecté automatiquement.
        </p>
        <div className="muse-links">
          <button onClick={onGoals} type="button">
            Mes objectifs
          </button>
          <button onClick={onMemories} type="button">
            Mes mémoires
          </button>
        </div>
      </article>
    </main>
  );
}
