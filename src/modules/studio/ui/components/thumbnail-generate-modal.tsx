import { ResponsiveModal } from "@/components/responsive-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/trpc/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TRPCClientErrorLike } from "@trpc/client";
import { AppRouter } from "@/trpc/routers/_app";

interface ThumbnailGenerateModelProps {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  prompt: z.string().min(10),
});

export const ThumbnailGenerateModal = ({
  videoId,
  open,
  onOpenChange,
}: ThumbnailGenerateModelProps) => {
  const utils = trpc.useUtils();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const generateThumbnail = trpc.studio.generateThumbnail.useMutation({
    onSuccess: () => {
      toast.success("Background job started", {
        description: "This may take some time",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (err: TRPCClientErrorLike<AppRouter>) => {
      console.error(err);
      toast.error("Something went wrong");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    generateThumbnail.mutate({
      prompt: values.prompt,
      id: videoId,
    });
  };

  return (
    <ResponsiveModal
      title="Upload a thumbnail"
      open={open}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="resize-none"
                    cols={30}
                    rows={5}
                    placeholder="A description of wanted thumbnail"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit">Generate</Button>
          </div>
        </form>
      </Form>
    </ResponsiveModal>
  );
};
