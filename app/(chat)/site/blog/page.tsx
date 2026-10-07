import { redirect } from "next/navigation";

export const metadata = {
  description: "Les dernières actualités de mDevsLabs.",
  title: "Blog",
};

export default function BlogPage() {
  redirect("/news");
}
