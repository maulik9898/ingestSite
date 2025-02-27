import { GenericCrawler } from "@/services/crawlers/GenericCrawler";
import { ScrapeSchema } from "common-types";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

export const ScrapeRoute: FastifyPluginAsyncZod = async (fastify, _) => {
  fastify.get(
    "/scrape",
    {
      schema: ScrapeSchema,
    },
    async (req, reply) => {
      try {
        const crawlService = new GenericCrawler({
          urls: [req.query.url],
          doCrawl: false,
          scrapeContent: true,
          crawlerType: req.query.crawlerType,
        });
        const { data, stats } = await crawlService.execute();
        return {
          success: true,
          data: {
            result: data[0],
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
