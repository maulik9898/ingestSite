import { axiosInstance } from "@/lib/axios";
import type { Scrape200Response } from "common-types";

export const scrapeSite = async (url: string) => {
  const response = await axiosInstance.post<Scrape200Response>(
    "/scrape",
    {
      url,
    },
    { timeout: 60000 },
  );

  return response.data;
};
