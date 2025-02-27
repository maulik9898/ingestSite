import { GenericCrawler } from "@/services/crawlers/GenericCrawler";
import { CrawlSchema } from "common-types";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

/**
 * Crawl route handler for processing web crawling requests.
 * Supports crawling a website starting from a given URL and extracting content.
 * @param fastify - The Fastify instance
 * @param _ - Unused options parameter
 * @returns Promise that resolves when route is registered
 */
export const CrawlRoute: FastifyPluginAsyncZod = async (fastify, _) => {
  /**
   * GET endpoint for initiating a web crawl
   * @route GET /crawl
   * @param {object} req.body - The crawl request parameters
   * @param {string} req.body.url - Starting URL to crawl
   * @param {number} [req.body.maxDepth] - Maximum depth to crawl
   * @param {number} [req.body.maxPages] - Maximum pages to crawl
   * @returns {Promise<object>} Crawl results and stats
   * @throws {Error} If crawl fails
   */
  fastify.get(
    "/crawl",
    {
      schema: CrawlSchema,
      config: {},
    },
    async (req, reply) => {
      try {
        const crawlService = new GenericCrawler({
          urls: [req.query.url],
          maxDepth: req.query.maxDepth,
          crawlerType: req.query.crawlerType,
          maxRequestsPerCrawl: req.query.maxPages,
          doCrawl: true,
          scrapeContent: true,
        });

        const { data, stats } = await crawlService.execute();

        return {
          success: true,
          url: req.query.url,
          data: {
            results: data,
            stats: stats,
          },
        };
      } catch (error) {
        req.log.error(error);
        reply.code(400).send({
          code: "CRAWL_ERROR",
          error: "Bad Request",
          message: "error",
        });
      }
    },
  );
};
