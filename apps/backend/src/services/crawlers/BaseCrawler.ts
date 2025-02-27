import {
  AdaptivePlaywrightCrawler,
  type AdaptivePlaywrightCrawlerContext,
  type AdaptivePlaywrightCrawlerOptions,
  LogLevel,
  log,
} from "crawlee";

log.setLevel(LogLevel.INFO);

export interface CrawlerResult<T> {
  items: T[];
  stats: {
    pagesProcessed: number;
    failedRequests: number;
    crawlingTime: number;
  };
}

export abstract class BaseCrawler<T, TConfig> {
  protected crawler!: AdaptivePlaywrightCrawler;

  constructor(protected readonly config: TConfig) {}

  protected async initCrawler(
    options?: Partial<AdaptivePlaywrightCrawlerOptions>,
  ) {
    this.crawler = new AdaptivePlaywrightCrawler({
      requestHandler: this.handleRequest.bind(this),
      ...options,
    });
  }

  protected abstract handleRequest(
    context: AdaptivePlaywrightCrawlerContext,
  ): Promise<void>;

  protected async cleanupCrawler() {
    if (this.crawler) {
      const data = await this.crawler.getDataset();
      await data.drop();
      await this.crawler.teardown();
    }
  }

  protected async getCrawlerResults(): Promise<T[]> {
    const { items } = await this.crawler.getData();
    return items;
  }

  public abstract execute(): Promise<CrawlerResult<T>>;
}
