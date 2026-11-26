import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

export async function openAdminHtml() {
  const page = new URL("../admin-html.html", import.meta.url);
  console.log(`🌐 Vue locale : ${page.href}`);
  const tty =
    process.stdout.isTTY &&
    !process.env.NO_COLOR &&
    process.env.TERM !== "dumb";
  const frames = ["⠋", "⠙", "⠹", "⠸"];
  let frame = 0;
  const timer = tty
    ? setInterval(
        () =>
          process.stdout.write(
            `\r${frames[frame++ % frames.length]} Ouverture du navigateur…`
          ),
        100
      )
    : undefined;
  try {
    const opener =
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
          ? "explorer.exe"
          : "xdg-open";
    await promisify(execFile)(opener, [fileURLToPath(page)]);
  } catch {
    console.log(
      "\n📂 Si aucun navigateur ne s’est ouvert, ouvrez le lien ci-dessus."
    );
  } finally {
    clearInterval(timer);
    if (tty) process.stdout.write("\r\x1b[2K");
  }
}
