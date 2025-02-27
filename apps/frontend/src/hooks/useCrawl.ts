import { crawlSite } from "@/api/crawl";
import { useMutation } from "@tanstack/react-query";
import type { Crawl200Response, CrawlQuery } from "common-types";

export const useCrawl = () => {
  return useMutation<Crawl200Response, Error, CrawlQuery>({
    mutationFn: (data) => crawlSite(data),
  });
};
