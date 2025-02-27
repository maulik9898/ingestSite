import { GenericCrawler } from "@/services/crawlers/GenericCrawler";
import { MapSchema } from "common-types";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

export const MapRoute: FastifyPluginAsyncZod = async (fastify) => {
  // POST /api/map
  fastify.post(
    "/map",
    {
      schema: MapSchema,
      config: {
        rateLimit: {
          max: 2,
          allowList: ["127.0.0.1"],
          timeWindow: "1 minute",
        },
      },
    },
    async (req, reply) => {
      try {
        // Here, we only want the site’s link structure, no scraping
        const crawler = new GenericCrawler({
          crawlerType: "basic",
          urls: [req.body.url],
          maxDepth: req.body.maxDepth,
          maxRequestsPerCrawl: req.body.maxPages,
          doCrawl: true,
          scrapeContent: false, // Important for “map” only
        });

        const { data, stats } = await crawler.execute();

        return {
          success: true,
          url: req.body.url,
          data: {
            urls: data.map((item) => item.url),
            stats: stats,
          },
        };
      } catch (error) {
        req.log.error(error);
        reply.code(400).send({
          code: "MAP_ERROR",
          error: "Bad Request",
          message: "Unable to gather site map.",
        });
      }
    },
  );
};
