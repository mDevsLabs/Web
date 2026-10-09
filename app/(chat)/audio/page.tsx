// Les anciens liens ouvrent explicitement le mode Audio.
import { redirect } from "next/navigation";
export default async function AudioPage() {
  redirect("/creation?mode=audio");
}
