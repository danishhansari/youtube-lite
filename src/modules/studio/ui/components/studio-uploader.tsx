import { Button } from "@/components/ui/button";
import { VIDEO_UPLOADER } from "@/constants";
import MuxUploader, {
  MuxUploaderDrop,
  MuxUploaderFileSelect,
  MuxUploaderProgress,
  MuxUploaderStatus,
} from "@mux/mux-uploader-react";
import { UploadIcon } from "lucide-react";

interface StudioUploadProps {
  endpoint?: string | null;
  onSuccess: () => void;
}

export const StudioUploader = ({ endpoint, onSuccess }: StudioUploadProps) => {
  return (
    <div>
      <MuxUploader
        endpoint={endpoint}
        id={VIDEO_UPLOADER}
        className="hidden group/uploader"
        onSuccess={onSuccess}
      />

      <MuxUploaderDrop muxUploader={VIDEO_UPLOADER} className="group/drop">
        <div slot="heading" className="flex flex-col items-center gap-6">
          <div className="flex items-center justify-center gap-2 rounded-full bg-muted h-32 w-32">
            <UploadIcon className="text-muted-foreground size-10 group/drop-[&[active]]:animate-bounce transition-all duration-300" />
          </div>
          <div className="flex flex-col gap-2 text-center">
            <p className="text-sm">Drag and drop videos files to upload</p>
            <p className="text-xs text-muted-foreground">
              Your videos will be private until you publish them
            </p>
          </div>
          <MuxUploaderFileSelect muxUploader={VIDEO_UPLOADER}>
            <Button type="button" className="rounded-full">
              Select files
            </Button>
          </MuxUploaderFileSelect>
        </div>
        <span className="hidden" slot="separator"></span>
        <MuxUploaderStatus muxUploader={VIDEO_UPLOADER} className="text-sm" />
        <MuxUploaderProgress
          muxUploader={VIDEO_UPLOADER}
          className="text-sm"
          type="percentage"
        />

        <MuxUploaderProgress muxUploader={VIDEO_UPLOADER} type="bar" />
      </MuxUploaderDrop>
    </div>
  );
};
