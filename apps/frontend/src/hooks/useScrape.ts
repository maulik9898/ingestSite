import { scrapeSite } from "@/api/scrape";
import { useMutation } from "@tanstack/react-query";
import type { CrawlerType, Scrape200Response } from "common-types";

interface ScrapeParams {
  url: string;
  crawlerType?: CrawlerType;
}

export const useScrape = () => {
  return useMutation<Scrape200Response, Error, ScrapeParams>({
    mutationFn: ({ url, crawlerType = "basic" }) => scrapeSite(url, crawlerType),
  });
};
