import { axiosInstance } from "@/lib/axios";
import type { CrawlerType, Scrape200Response } from "common-types";

export const scrapeSite = async (url: string, crawlerType: CrawlerType = "basic") => {
  const response = await axiosInstance.get<Scrape200Response>("/scrape", {
    params: {
      url,
      crawlerType
    },
    timeout: 60000,
  });

  return response.data;
};
