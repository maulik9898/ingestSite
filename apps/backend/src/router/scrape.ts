import { GenericCrawler } from "@/services/crawlers/GenericCrawler";
import { ScrapeSchema } from "common-types";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

export const ScrapeRoute: FastifyPluginAsyncZod = async (fastify, _) => {
  fastify.post(
    "/scrape",
    {
      schema: ScrapeSchema,
      config: {
        rateLimit: {
          max: 20,
          timeWindow: "1 minute",
          whitelist: ["127.0.0.1", "::1"],
        },
      },
    },
    async (req, reply) => {
      try {
        const crawlService = new GenericCrawler({
          urls: [req.body.url],
          doCrawl: false,
          scrapeContent: true,
          crawlerType: "basic",
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
