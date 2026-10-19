import { notFound } from "next/navigation";
import { WakiesThemeProvider } from "@/components/wakies/ThemeProvider";
import { WakiesWorkspace } from "@/components/wakies/workspace-app";
import "@/components/wakies/wakies.css";
import "@/components/wakies/wakies-editor.css";
import "@/components/wakies/wakies-host.css";
import "@/components/wakies/wakies-ui.css";
export const instant = false;
export default async function Preview() {
  if (
    process.env.NODE_ENV !== "development" &&
    process.env.WAKIES_UI_PREVIEW !== "1"
  )
    notFound();
  return (
    <div
      className="wakies-root"
      style={{ height: "100dvh", overflow: "hidden" }}
    >
      <WakiesThemeProvider>
        <WakiesWorkspace />
      </WakiesThemeProvider>
    </div>
  );
}
