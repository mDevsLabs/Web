import type { Metadata } from "next";
import { UserPluginForm } from "../../../user-plugin-form";

export const metadata: Metadata = { title: "Nouveau plugin | mAI" };

export default async function NewUserPluginPage() {
  return <UserPluginForm />;
}
