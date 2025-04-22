import { trpc } from "@/trpc/server";

export default async function Home() {
  void trpc.hello.prefetch({ text: "Hi there" });
  return <>Client is trying to say</>;
}
