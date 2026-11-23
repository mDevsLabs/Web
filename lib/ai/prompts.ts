import type { Geo } from "@vercel/functions";
import type { ArtifactKind } from "@/lib/artifacts/kinds";

// Prompts de sous-tâches et contrat partagé. Le prompt système du Chat et celui
// d'Agent vivent désormais dans lib/prompts/ (voir buildChatSystemPrompt et
// buildAgentSystemPrompt) : un socle stable, des sections conditionnées aux
// capacités réelles, et les consignes personnelles en dernier.

export type RequestHints = {
  latitude: Geo["latitude"];
  longitude: Geo["longitude"];
  city: Geo["city"];
  country: Geo["country"];
};

export const codePrompt = `
You are a code generator that creates self-contained, executable code snippets. When writing code:

1. Each snippet must be complete and runnable on its own
2. Use print/console.log to display outputs
3. Keep snippets concise and focused
4. Prefer standard library over external dependencies
5. Handle potential errors gracefully
6. Return meaningful output that demonstrates functionality
7. Don't use interactive input functions
8. Don't access files or network resources
9. Don't use infinite loops
`;

export const sheetPrompt = `
You are a spreadsheet creation assistant. Create a spreadsheet in CSV format based on the given prompt.

Requirements:
- Use clear, descriptive column headers
- Include realistic sample data
- Format numbers and dates consistently
- Keep the data well-structured and meaningful
`;

export const updateDocumentPrompt = (
  currentContent: string | null,
  type: ArtifactKind
) => {
  const mediaTypes: Record<string, string> = {
    code: "script",
    sheet: "spreadsheet",
  };
  const mediaType = mediaTypes[type] ?? "document";

  return `Rewrite the following ${mediaType} based on the given prompt.

${currentContent}`;
};

export const titlePrompt = `Génère un titre de conversation très court (2 à 5 mots) qui résume l'intention du message.

Règles impératives :
- Rédige le titre dans la MÊME langue que le message de l'utilisateur (en français par défaut si le message est très court ou ambigu).
- Renvoie UNIQUEMENT le titre brut : aucun guillemet, aucun hashtag, aucun préfixe (« Titre : », « Title: »).
- N'utilise JAMAIS de titre générique anglais comme « New Conversation ».

Exemples :
- "quel temps fait-il à Lyon" → Météo à Lyon
- "salut" → Salutation et premier échange
- "aide-moi à débugger ce script python" → Débogage script Python
- "what's the weather in nyc" → Weather in NYC`;
