import { axiosInstance } from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import type { Crawl200Response, CrawlBody } from "common-types";

export const useCrawl = () => {
  return useMutation<Crawl200Response, Error, CrawlBody>({
    mutationFn: (data) =>
      axiosInstance.post("/crawl", data).then((res) => res.data),
  });
};
