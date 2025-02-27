import { axiosInstance } from "@/lib/axios";
import type { Crawl200Response, CrawlQuery } from "common-types";

export const crawlSite = async (queryString: CrawlQuery) => {
  const response = await axiosInstance.get<Crawl200Response>("/crawl", {
    params: queryString,
    timeout: 120000,
  });
  return response.data;
};
