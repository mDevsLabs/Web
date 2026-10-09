import { getChangelogs } from "@/lib/site/changelog";
import ChangelogView from "../changelog-view";

export const metadata = {
  description: "Notes de version du projet mSearch.",
  title: "mAI | Changelog mSearch",
};

export default async function MsearchChangelogPage() {
  const changelogs = getChangelogs();

  return <ChangelogView changelogs={changelogs} filterProject="msearch" />;
}
