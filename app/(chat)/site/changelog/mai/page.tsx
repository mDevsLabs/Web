import { getChangelogs } from "@/lib/site/changelog";
import ChangelogView from "../changelog-view";

export const metadata = {
  description: "Notes de version du projet mAI.",
  title: "mAI | Changelog mAI",
};

export default async function MaiChangelogPage() {
  const changelogs = getChangelogs();

  return <ChangelogView changelogs={changelogs} filterProject="mai" />;
}
