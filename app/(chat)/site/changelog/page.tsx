import { getChangelogs } from "@/lib/site/changelog";
import ChangelogView from "./changelog-view";

export const metadata = {
  description: "Notes de version des projets mDevsLabs.",
  title: "Notes de version",
};

export default async function ChangelogPage() {
  const changelogs = getChangelogs();

  return <ChangelogView changelogs={changelogs} />;
}
