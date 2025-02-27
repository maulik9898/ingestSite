import TreeView, { type TreeViewItem } from "@/components/tree-view";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCrawl } from "@/hooks/useCrawl";
import { urlsToTree } from "@/lib/utils";
import { CopyIcon, File, Folder, LucideLoader2 } from "lucide-react";
import { useMemo, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";

export default function Crawl() {
  const { mutate, isPending } = useCrawl();
  const [url, setUrl] = useState("");
  const [treeData, setTreeData] = useState<TreeViewItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<string>("");
  const [contentMap, setContentMap] = useState<Map<string, string>>(new Map());

  const handleOnclick = () => {
    mutate(
      { url },
      {
        onSuccess: (data) => {
          // Convert URLs to tree structure
          const urls = data.data.results.map((result) => result.url);
          console.log("URLs ", urls);
          const tree = urlsToTree(urls);
          console.log("Tree ", tree);
          setTreeData(tree);

          // Create a map of URL to content for quick lookup
          const contentMap = new Map(
            data.data.results.map((result) => [
              result.url,
              result.markdown || "",
            ]),
          );
          setContentMap(contentMap);
        },
        onError: (error) => {
          console.error(error);
          toast.error("Failed to crawl website");
        },
      },
    );
  };

  const handleSelectionChange = (items: TreeViewItem[]) => {
    if (items.length === 1) {
      const selectedUrl = items[0].id;
      const content = contentMap.get(selectedUrl);
      if (content) {
        setSelectedContent(content);
      }
    }
  };

  const handleCheckChange = (item: TreeViewItem, checked: boolean) => {
    // Update tree data to reflect checked state
    setTreeData((prevData) => {
      const newData = [...prevData];

      const updateNodeChecked = (
        items: TreeViewItem[],
        targetId: string,
        isChecked: boolean,
      ) => {
        for (const node of items) {
          if (node.id === targetId) {
            node.checked = isChecked;
            // If it's a folder, update all children
            if (node.children) {
              const updateChildrenChecked = (children: TreeViewItem[]) => {
                for (const child of children) {
                  child.checked = isChecked;
                  if (child.children) {
                    updateChildrenChecked(child.children);
                  }
                }
              };
              updateChildrenChecked(node.children);
            }
            return true;
          }

          if (
            node.children &&
            updateNodeChecked(node.children, targetId, isChecked)
          ) {
            // After updating children, check if all children are checked/unchecked
            // to determine parent's state
            if (node.children.length > 0) {
              node.checked = node.children.every((child) => child.checked);
            }
            return true;
          }
        }
        return false;
      };

      updateNodeChecked(newData, item.id, checked);
      return newData;
    });
  };

  const checkedURLs = useMemo(() => {
    const urls = new Set<string>();
    const traverse = (node: TreeViewItem) => {
      if (node.checked && contentMap.has(node.id)) {
        urls.add(node.id);
      }
      node.children?.forEach(traverse);
    };
    for (const item of treeData) {
      traverse(item);
    }

    console.log("Selected ", urls);
    return urls;
  }, [treeData, contentMap]);

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

      <div>{checkedURLs.size} Selected</div>

      <ResizablePanelGroup
        className="border-dashed border w-full"
        direction="horizontal"
      >
        <ResizablePanel maxSize={30}>
          <ScrollArea className="w-full h-full">
            <TreeView
              data={treeData}
              className="border-none"
              title="Site Structure"
              showCheckboxes
              onCheckChange={handleCheckChange}
              iconMap={{
                file: <File className="h-4 w-4 text-orange-500" />,
                folder: <Folder className="h-4 w-4 text-blue-500" />,
              }}
              onSelectionChange={handleSelectionChange}
            />
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className="w-full relative bg-accent/80">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="absolute top-2 right-2">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedContent);
                  }}
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
          <div className="w-full overflow-auto h-full">
            <div className="prose block w-full  dark:prose-invert p-4  !max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>{selectedContent}</Markdown>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
