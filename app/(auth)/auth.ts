import { getMaiUser } from "@/lib/auth/session";

export type UserType = "regular";

export async function auth() {
  const user = await getMaiUser();
  if (!user) return null;

  return {
    user: {
      id: user.id || user.email,
      email: user.email,
      name: user.username,
      image: user.avatarUrl,
      type: "regular" as UserType,
      tier: user.tier,
    },
  };
}

export const GET = async () => new Response("Not used", { status: 404 });
export const POST = async () => new Response("Not used", { status: 404 });

export const handlers = { GET, POST };
export const signIn = async () => {};
export const signOut = async () => {};
