import { DEFAULT_LIMIT } from "@/constants";
import { StudioView } from "@/modules/studio/views/studio-view";
import { HydrateClient, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic";

const Page = async () => {
  void trpc.videos.getMany.prefetchInfinite({
    limit: DEFAULT_LIMIT,
  });

  return (
    <HydrateClient>
      <StudioView />
    </HydrateClient>
  );
};

export default Page;
