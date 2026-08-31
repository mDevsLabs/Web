// 100 messages d'accueil personnalisés avec {username} — sans emoji
// Utilisation : template.replace("{username}", username)

export const GREETINGS_WITH_USERNAME: string[] = [
  "Salut {username}, que puis-je faire pour toi ?",
  "Bonjour {username}, tu penses à quoi !",
  "Hey {username}, prêt à attaquer la journée ?",
  "Coucou {username}, on s'y met ensemble ?",
  "Bienvenue {username}, dis-moi ce que tu as en tête",
  "Salut {username}, quelle est ta priorité aujourd'hui ?",
  "Bonjour {username}, comment puis-je t'aider ?",
  "Hello {username}, on explore quoi aujourd'hui ?",
  "Salut {username}, besoin d'un coup de main ?",
  "Bonjour {username}, quelle idée veux-tu concrétiser ?",
  "Hey {username}, on commence par quoi ?",
  "Coucou {username}, je suis prêt quand tu l'es",
  "Salut {username}, parlons de ton projet du moment",
  "Bonjour {username}, que souhaites-tu accomplir ?",
  "Hello {username}, je t'écoute attentivement",
  "Salut {username}, quelle question t'amène ici ?",
  "Bonjour {username}, on avance sur quel sujet ?",
  "Hey {username}, quelle mission te motive aujourd'hui ?",
  "Coucou {username}, prêt à créer quelque chose de bien ?",
  "Salut {username}, dis-moi tout, je suis là",
  "Bonjour {username}, comment rendre ta journée plus simple ?",
  "Hello {username}, quel défi veux-tu relever ?",
  "Salut {username}, on passe en mode productif ?",
  "Bonjour {username}, quelle tâche je peux alléger ?",
  "Hey {username}, tu veux brainstormer ou exécuter ?",
  "Coucou {username}, quelle bonne idée veux-tu développer ?",
  "Salut {username}, je suis prêt à t'accompagner",
  "Bonjour {username}, quelle décision veux-tu éclairer ?",
  "Hello {username}, on structure tes idées ?",
  "Salut {username}, quel sujet te trotte dans la tête ?",
  "Bonjour {username}, que veux-tu apprendre aujourd'hui ?",
  "Hey {username}, on donne vie à quelle idée ?",
  "Coucou {username}, besoin d'inspiration ou d'action ?",
  "Salut {username}, comment puis-je te faire gagner du temps ?",
  "Bonjour {username}, quelle question veux-tu approfondir ?",
  "Hello {username}, prêt à transformer une idée en plan ?",
  "Salut {username}, on clarifie tes priorités ?",
  "Bonjour {username}, quelle opportunité veux-tu saisir ?",
  "Hey {username}, je suis là pour t'aider à avancer",
  "Coucou {username}, on vise quel objectif aujourd'hui ?",
  "Salut {username}, quel texte veux-tu rédiger ensemble ?",
  "Bonjour {username}, besoin d'analyser ou de créer ?",
  "Hello {username}, quelle recherche veux-tu lancer ?",
  "Salut {username}, on optimise ton workflow ?",
  "Bonjour {username}, quelle notion veux-tu éclaircir ?",
  "Hey {username}, prêt à passer à l'action ?",
  "Coucou {username}, quelle histoire veux-tu raconter ?",
  "Salut {username}, comment t'aider à décider ?",
  "Bonjour {username}, quelle stratégie veux-tu bâtir ?",
  "Hello {username}, on pose les bases de ton projet ?",
  "Salut {username}, quelle compétence veux-tu progresser ?",
  "Bonjour {username}, quel problème veux-tu résoudre ?",
  "Hey {username}, on fait le point sur tes idées ?",
  "Coucou {username}, quelle création veux-tu lancer ?",
  "Salut {username}, je peux t'aider à structurer ou rédiger",
  "Bonjour {username}, quelle analyse veux-tu approfondir ?",
  "Hello {username}, on prépare ton prochain pas ?",
  "Salut {username}, quelle information cherches-tu ?",
  "Bonjour {username}, comment puis-je t'inspirer aujourd'hui ?",
  "Hey {username}, quelle tâche veux-tu déléguer ?",
  "Coucou {username}, prêt à explorer de nouvelles pistes ?",
  "Salut {username}, on rend tes idées plus claires ?",
  "Bonjour {username}, quelle synthèse veux-tu obtenir ?",
  "Hello {username}, on planifie ta journée ?",
  "Salut {username}, quel document veux-tu préparer ?",
  "Bonjour {username}, quelle question mérite une réponse claire ?",
  "Hey {username}, on cherche ensemble la meilleure approche ?",
  "Coucou {username}, quelle nouveauté veux-tu tester ?",
  "Salut {username}, je suis prêt à réfléchir avec toi",
  "Bonjour {username}, quelle ambition veux-tu concrétiser ?",
  "Hello {username}, on affine ton message ?",
  "Salut {username}, quelle explication veux-tu simplifier ?",
  "Bonjour {username}, comment t'aider à y voir plus clair ?",
  "Hey {username}, quelle idée veux-tu challenger ?",
  "Coucou {username}, on construit ton plan d'action ?",
  "Salut {username}, quelle ressource veux-tu organiser ?",
  "Bonjour {username}, prêt à gagner en clarté ?",
  "Hello {username}, quelle décision veux-tu préparer ?",
  "Salut {username}, on décortique ton sujet du jour ?",
  "Bonjour {username}, quelle tâche te prend trop de temps ?",
  "Hey {username}, on imagine la suite ensemble ?",
  "Coucou {username}, quelle piste veux-tu explorer d'abord ?",
  "Salut {username}, comment puis-je t'être utile maintenant ?",
  "Bonjour {username}, quelle idée veux-tu rendre concrète ?",
  "Hello {username}, on éclaircit tes objectifs ?",
  "Salut {username}, quel projet veux-tu faire avancer ?",
  "Bonjour {username}, besoin d'un résumé ou d'une création ?",
  "Hey {username}, on trouve la meilleure formulation ?",
  "Coucou {username}, quelle question te ferait avancer ?",
  "Salut {username}, prêt à transformer tes notes en action ?",
  "Bonjour {username}, quelle vision veux-tu partager ?",
  "Hello {username}, on priorise tes tâches ?",
  "Salut {username}, quelle recherche veux-tu approfondir ?",
  "Bonjour {username}, comment veux-tu commencer ?",
  "Hey {username}, quelle solution veux-tu explorer ?",
  "Coucou {username}, on donne du rythme à ton projet ?",
  "Salut {username}, quelle clarification te serait utile ?",
  "Bonjour {username}, prêt à passer une bonne session ensemble ?",
  "Hello {username}, quelle idée veux-tu structurer aujourd'hui ?",
  "Salut {username}, on met tes pensées en ordre ?",
];

export const FALLBACK_GREETING = "Comment puis-je vous aider aujourd'hui ?";

export function isValidUsername(username: string | null | undefined): boolean {
  if (!username) return false;
  const trimmed = username.trim();
  if (!trimmed) return false;
  if (trimmed.toLowerCase() === "utilisateur") return false;
  if (trimmed.toLowerCase() === "guest") return false;
  return true;
}

export function formatGreeting(template: string, username: string): string {
  return template.replaceAll("{username}", username);
}

export function getRandomGreeting(username?: string | null): string {
  const idx = Math.floor(Math.random() * GREETINGS_WITH_USERNAME.length);
  const template = GREETINGS_WITH_USERNAME[idx] ?? FALLBACK_GREETING;
  if (isValidUsername(username)) {
    return formatGreeting(template, username!.trim());
  }
  return FALLBACK_GREETING;
}
