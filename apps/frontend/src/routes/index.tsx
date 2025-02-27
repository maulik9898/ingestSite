import Crawl from "@/components/crawl/crawl";
import Scrape from "@/components/scrape/scrape";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
const IndexRouteSearchParams = z.object({
  mode: z.enum(["scrape", "crawl"]).default("scrape"),
});

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: zodValidator(IndexRouteSearchParams),
});

function Index() {
  const navigate = Route.useNavigate();
  const { mode } = Route.useSearch();
  return (
    <div className="flex h-[calc(100dvh-5rem)] w-full flex-col overflow-hidden">
      <Tabs defaultValue={mode} className="flex h-full flex-col">
        <div className="flex justify-center py-4">
          <TabsList className="flex gap-2 h-12 px-2 py-1">
            <TabsTrigger
              className="px-4 py-2"
              onClick={() =>
                navigate({
                  to: "/",
                  search: {
                    mode: "scrape",
                  },
                })
              }
              value="scrape"
            >
              <span className="font-semibold text-md">Scrape</span>
              <span className="text-muted-foreground text-xs">
                (Single Page)
              </span>
            </TabsTrigger>
            <TabsTrigger
              className="px-4 py-2"
              onClick={() =>
                navigate({
                  to: "/",
                  search: {
                    mode: "crawl",
                  },
                })
              }
              value="crawl"
            >
              <span className="font-semibold text-md">Crawl</span>
              <span className="text-muted-foreground text-xs">
                (Multiple Pages)
              </span>
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="flex-1 min-h-0">
          <TabsContent className="h-full m-0" value="scrape">
            <Scrape />
          </TabsContent>
          <TabsContent className="h-full m-0" value="crawl">
            <Crawl />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
