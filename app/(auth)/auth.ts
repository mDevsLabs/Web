import { getMaiUser } from "@/lib/auth/session";

export type UserType = "regular";

export async function auth() {
  const user = await getMaiUser();
  if (!user) {
    return null;
  }

  return {
    user: {
      email: user.email,
      id: user.id || user.email,
      image: user.avatarUrl,
      name: user.username,
      tier: user.tier,
      type: "regular" as UserType,
    },
  };
}

export const GET = async () => new Response("Not used", { status: 404 });
export const POST = async () => new Response("Not used", { status: 404 });

export const handlers = { GET, POST };
export const signIn = async () => {};
export const signOut = async () => {};
