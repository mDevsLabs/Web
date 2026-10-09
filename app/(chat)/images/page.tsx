// Les anciens liens ouvrent explicitement le mode Image.
import { redirect } from "next/navigation";
export default async function ImagesPage() {
  redirect("/creation?mode=image");
}
