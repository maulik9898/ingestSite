import { axiosInstance } from "@/lib/axios";
import type { Crawl200Response, CrawlBody } from "common-types";

export const crawlSite = async (data: CrawlBody) => {
  const response = await axiosInstance.post<Crawl200Response>("/crawl", data, {
    timeout: 120000,
  });
  return response.data;
};
