import { sendHtmlEmail } from "./email.ts";

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  return await sendHtmlEmail(options.to, options.subject, options.html);
}

// Le studio est optionnel; son absence ne doit pas bloquer l'administration.
export async function runNewsletterStudio() {
  const url = new URL("./newsletter-send.ts", import.meta.url);
  try {
    const fs = await import("node:fs");
    if (!fs.existsSync(url)) {
      console.log(
        " Le module newsletter-send.ts n'est pas installé dans ce dépôt."
      );
      return;
    }
    const studio = await import(url.href);
    await studio.runNewsletterStudio();
  } catch (error) {
    console.error(
      " Studio newsletter:",
      error instanceof Error ? error.message : error
    );
  }
}
