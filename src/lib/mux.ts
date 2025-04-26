import Mux from "@mux/mux-node";

export const mux = new Mux({
  tokenId: process.env.MUX_TOKEN!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

