import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useScrape } from "@/hooks/useScrape";
import { CopyIcon, LucideLoader2 } from "lucide-react";
import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

export default function Scrape() {
  const { mutate, isPending } = useScrape();
  const [url, setUrl] = useState("");
  const [markdown, setMarkdown] = useState<string | undefined>();

  const handleOnclick = () => {
    mutate(
      { url },
      {
        onSuccess: (data) => {
          setMarkdown(data.data.result.markdown);
        },
        onError: (error) => {
          console.error(error);
          setMarkdown(undefined);
        },
      },
    );
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(markdown || "")
      .then(() => {
        toast.success("Content copied to clipboard successfully");
      })
      .catch(() => toast.error("Failed to copy content to clipboard"));
  };

  return (
    <div className="flex h-full flex-col gap-8 p-4">
      <div className="flex w-full flex-col sm:flex-row items-end gap-4 max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg mx-auto">
        <div className="grid w-full items-center gap-1.5">
          <Label className="font-medium" htmlFor="url">
            URL
          </Label>
          <Input
            onChange={(e) => setUrl(e.target.value)}
            type="url"
            value={url}
            className="w-full"
            id="url"
          />
        </div>
        <Button
          onClick={handleOnclick}
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          {isPending && <LucideLoader2 className="animate-spin" />}
          Run
        </Button>
      </div>
      {markdown && (
        <div className="flex-1 min-h-0 w-full relative mx-auto max-w-full lg:max-w-5xl">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="absolute top-2 right-2">
                <Button
                  onClick={handleCopy}
                  variant="ghost"
                  className="h-8 w-8 px-0"
                >
                  <CopyIcon />
                  <span className="sr-only">Copy</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="h-full overflow-auto  rounded-md border border-dashed bg-accent/80">
            <div className=" p-4 max-w-full block  lg:max-w-5xl">
              <div className="prose dark:prose-invert max-w-min">
                <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
