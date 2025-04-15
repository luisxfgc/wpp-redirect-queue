import { auth } from "@clerk/nextjs/server";

export default async function handler() {
  const { userId } = await auth();
  return new Response(JSON.stringify({ userId }), {
    headers: { "Content-Type": "application/json" },
  });
} 