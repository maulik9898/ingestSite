import { cleanHtml } from "@/utils/htmlCleaner";
import type {
  CrawlerType,
  GenericCrawlerResult,
  GenericCrawlerStats,
} from "common-types";
import {
  CheerioCrawler,
  type CheerioCrawlingContext,
  type CheerioRoot,
  LogLevel,
  PlaywrightCrawler,
  type PlaywrightCrawlingContext,
  RequestQueue,
  Sitemap,
  log,
} from "crawlee";

import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import rehypeRemoveComments from "rehype-remove-comments";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

export interface GenericCrawlerConfig {
  /**
   * Which crawler to use. You can extend this to 'adaptive' etc. if you like.
   */
  crawlerType: CrawlerType;
  /**
   * The list of URLs to start with.
   */
  urls: string[];
  /**
   * If true, we attempt to keep following links on the same domain
   */
  doCrawl?: boolean;
  /**
   * If true, we scrape page content (HTML, markdown, etc.)
   */
  scrapeContent?: boolean;
  /**
   * Maximum depth, pages, etc. (Optional)
   */
  maxDepth?: number;
  maxRequestsPerCrawl?: number;
  /**
   * Additional Cheerio/Playwright crawler options, if needed
   */
  crawlerOptions?: Record<string, unknown>;
}

/**
 * Minimal info we push for each page. Extend as needed.
 */

/**
 * Single interface that your route handlers / services can call.
 * It hides the underlying Cheerio/Playwright difference.
 */
export class GenericCrawler {
  // The underlying internal crawler instance (CheerioCrawler or PlaywrightCrawler)
  private crawlerInstance: CheerioCrawler | PlaywrightCrawler;

  constructor(private readonly config: GenericCrawlerConfig) {
    log.setLevel(LogLevel.DEBUG);

    // Decide which low-level crawler to instantiate:
    switch (this.config.crawlerType) {
      case "basic":
        this.crawlerInstance = new CheerioCrawler({
          maxRequestsPerCrawl: this.config.maxRequestsPerCrawl,
          // Provide a “unified” request handler:
          requestHandler: this.handleRequestCheerio.bind(this),
          failedRequestHandler: async ({ request }) => {
            log.error(
              `Request for ${request.url} failed too many times (Cheerio).`,
            );
          },
          // ...spread any custom crawlerOptions if you want
          ...(this.config.crawlerOptions ?? {}),
        });
        break;

      case "advance":
        this.crawlerInstance = new PlaywrightCrawler({
          maxRequestsPerCrawl: this.config.maxRequestsPerCrawl,
          requestHandler: this.handleRequestPlaywright.bind(this),
          failedRequestHandler: async ({ request }) => {
            log.error(
              `Request for ${request.url} failed too many times (Playwright).`,
            );
          },
          // ...spread any custom crawlerOptions if you want
          ...(this.config.crawlerOptions ?? {}),
        });
        break;

      default:
        throw new Error(`Unknown crawlerType: ${this.config.crawlerType}`);
    }
  }

  private async transformHtmlToMarkdown($: CheerioRoot): Promise<string> {
    const html = cleanHtml($);
    const markdown = await unified()
      .use(rehypeParse, { fragment: true })
      .use(rehypeRemoveComments)
      .use(rehypeRemark)
      .use(remarkGfm)
      .use(remarkStringify)
      .process(html);
    return String(markdown);
  }

  /**
   * Request handler for the Cheerio-based crawler.
   * We have access to context.$ for HTML parsing, context.body, etc.
   */
  private async handleRequestCheerio(
    ctx: CheerioCrawlingContext,
  ): Promise<void> {
    const { request, $, enqueueLinks, pushData } = ctx;
    log.debug(`(Cheerio) Processing: ${request.url}`);

    const result: GenericCrawlerResult = { url: request.url };

    if (this.config.scrapeContent && $) {
      result.markdown = await this.transformHtmlToMarkdown($);
    }

    // Always push the data we gathered.
    await pushData(result);

    // If doCrawl is set, enqueue links from the same domain.
    if (this.config.doCrawl) {
      await enqueueLinks({
        strategy: "same-hostname",
        globs: [`${this.config.urls[0]}/**`],
      });
    }
  }

  /**
   * Request handler for the Playwright-based crawler.
   * We have a real browser page, so we can evaluate JavaScript if needed.
   */
  private async handleRequestPlaywright(
    ctx: PlaywrightCrawlingContext,
  ): Promise<void> {
    const { request, enqueueLinks, pushData, parseWithCheerio } = ctx;
    log.debug(`(Playwright) Processing: ${request.url}`);

    const result: GenericCrawlerResult = { url: request.url };

    if (this.config.scrapeContent) {
      // For example, get the HTML with page.content()
      const $ = await parseWithCheerio();
      result.markdown = await this.transformHtmlToMarkdown($);
      // Optionally do more complex transformations here if needed
    }

    await pushData(result);

    if (this.config.doCrawl) {
      await enqueueLinks({
        strategy: "same-hostname",
        globs: [`${this.config.urls[0]}/**`],
      });
    }
  }

  /**
   * A top-level method to start crawling all configured URLs.
   */
  public async execute(): Promise<{
    data: GenericCrawlerResult[];
    stats: GenericCrawlerStats;
  }> {
    const { urls } = this.config;
    const uniqueSuffix = Date.now().toString();
    const requestQueue = await RequestQueue.open(`queue-${uniqueSuffix}`);

    try {
      let finalUrls = [...urls];
      // If we are crawling the entire site, try to load from the sitemap
      if (this.config.doCrawl && urls.length === 1) {
        const baseUrl = urls[0];
        const urlObject = new URL(baseUrl);
        const { urls: siteMapUrls } = await Sitemap.tryCommonNames(
          urlObject.origin,
        );
        log.info(`Loaded ${siteMapUrls.length} URLs from the sitemap.`);

        // Filter domain
        const validUrls = siteMapUrls.filter((u) =>
          u.startsWith(urlObject.toString()),
        );
        finalUrls = Array.from(new Set([...validUrls, ...finalUrls]));
      }

      // Add initial requests
      await requestQueue.addRequestsBatched(finalUrls);

      this.crawlerInstance.requestQueue = requestQueue;

      // Run the crawler
      const stats = await this.crawlerInstance.run([], {
        purgeRequestQueue: true,
      });

      // Gather results
      const results = await this.crawlerInstance.getData();

      return {
        data: results.items as GenericCrawlerResult[],
        stats: {
          pagesProcessed: stats.requestsTotal,
          failedRequests: stats.requestsFailed,
          crawlingTime: stats.crawlerRuntimeMillis,
        },
      };
    } catch (error) {
      log.error(`WebsiteCrawler failed ${error}`);
      throw error;
    } finally {
      await requestQueue.drop();
      await this.cleanupCrawler();
    }
  }

  protected async cleanupCrawler() {
    if (this.crawlerInstance) {
      const data = await this.crawlerInstance.getDataset();
      await data.drop();
      await this.crawlerInstance.teardown();
    }
  }
}
