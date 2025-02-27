import { scrapeSite } from "@/api/scrape";
import { useMutation } from "@tanstack/react-query";
import type { Scrape200Response, ScrapeBody } from "common-types";

export const useScrape = () => {
  return useMutation<Scrape200Response, Error, ScrapeBody>({
    mutationFn: ({ url }) => scrapeSite(url),
  });
};
