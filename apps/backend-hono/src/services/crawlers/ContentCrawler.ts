import type { CrawlConfig } from "common-types";

import {
  BaseCrawler,
  type CrawlerResult,
} from "@/services/crawlers/BaseCrawler";
import { type AdaptivePlaywrightCrawlerOptions, Sitemap } from "crawlee";
import { type AdaptivePlaywrightCrawlerContext, RequestQueue } from "crawlee";

interface CrawlData {
  url: string;
}

export class ContentCrawler extends BaseCrawler<CrawlData, CrawlConfig> {
  protected async handleRequest({
    request,
    enqueueLinks,
    pushData,
  }: AdaptivePlaywrightCrawlerContext) {
    console.info(`Processing URL: ${request.url}`);
    await pushData({ url: request.url });

    await enqueueLinks({
      strategy: "same-hostname",
      globs: [`${this.config.url}/**`],
    });
  }

  public async execute(
    options?: Partial<AdaptivePlaywrightCrawlerOptions>,
  ): Promise<CrawlerResult<CrawlData>> {
    const uniqueSuffix = Date.now().toString();
    const requestQueue = await RequestQueue.open(`queue-${uniqueSuffix}`);
    try {
      const urlObject = new URL(this.config.url);
      const { urls } = await Sitemap.tryCommonNames(urlObject.origin);
      console.info(`Loaded ${urls.length} URLs from the sitemap.`);

      const mergedUrls = [...urls, this.config.url];
      const filteredUrls = Array.from(
        new Set(mergedUrls.filter((url) => url.startsWith(this.config.url))),
      );

      await requestQueue.addRequestsBatched(filteredUrls);

      const updatedOptions = {
        ...options,
        requestQueue,
      };

      await this.initCrawler(updatedOptions);
      const stats = await this.crawler.run([], {
        purgeRequestQueue: true,
      });

      const results = await this.getCrawlerResults();
      return {
        items: results,
        stats: {
          failedRequests: stats.requestsFailed,
          crawlingTime: stats.crawlerRuntimeMillis,
          pagesProcessed: stats.requestsTotal,
        },
      };
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      console.log("Cleanup");
      await requestQueue.drop();
      await this.cleanupCrawler();
    }
  }
}
