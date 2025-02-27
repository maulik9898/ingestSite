import { cleanHtml } from "@/utils/htmlCleaner";
import type { ScrapeConfig, ScrapedData } from "common-types";
import type {
  AdaptivePlaywrightCrawlerContext,
  AdaptivePlaywrightCrawlerOptions,
} from "crawlee";
import TurndownService from "turndown";
import { BaseCrawler, type CrawlerResult } from "./BaseCrawler";

export class ContentScraper extends BaseCrawler<ScrapedData, ScrapeConfig> {
  protected async handleRequest({
    request,
    pushData,
    parseWithCheerio,
  }: AdaptivePlaywrightCrawlerContext) {
    console.info(`Processing URL: ${request.url}`);
    const $ = await parseWithCheerio();

    const html = cleanHtml($);
    const turndownService = new TurndownService({
      codeBlockStyle: "fenced",
    });
    const markdown = turndownService.turndown(html);

    await pushData({
      url: request.url,
      html,
      markdown,
    });
  }

  public async execute(
    options?: Partial<AdaptivePlaywrightCrawlerOptions>,
  ): Promise<CrawlerResult<ScrapedData>> {
    try {
      await this.initCrawler(options);
      const stats = await this.crawler.run(this.config.urls);
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
      if (error instanceof Error) {
        console.error({ msg: "Scrape failed", error: error.message });
      } else {
        console.error({ msg: "Scrape failed", error });
      }
      throw error;
    } finally {
      await this.cleanupCrawler();
    }
  }
}
