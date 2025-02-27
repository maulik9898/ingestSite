import { serve } from "@hono/node-server";
import { Crawl200ResponseSchema, CrawlBodySchema } from "common-types";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import { apiReference } from "@scalar/hono-api-reference";
import { openAPISpecs } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { ContentCrawler } from "./services/crawlers/ContentCrawler";

const app = new Hono();

app.get(
  "/docs",
  apiReference({
    theme: "saturn",
    spec: { url: "/openapi" },
  }),
);

app.get(
  "/openapi",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "Ingest API",
        version: "1.0.0",
        description: "Ingest.site API",
      },
      servers: [{ url: "http://localhost:3000", description: "Local Server" }],
    },
  }),
);

app.post(
  "/crawl",
  describeRoute({
    description: "Crawl a URL",
    validateResponse: true,
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(Crawl200ResponseSchema),
          },
        },
      },
    },
  }),
  zValidator("json", CrawlBodySchema),
  async (c) => {
    try {
      const crawlService = new ContentCrawler(c.req.valid("json"));
      const result = await crawlService.execute();
      return c.json(
        {
          success: true,
          url: c.req.valid("json"),
          data: {
            urls: result.items.map((item) => item.url),
            stats: result.stats,
          },
        },
        200,
        {
          "Content-Type": "application/json",
        },
      );
    } catch (error) {
      console.error(error);
      return c.json(
        {
          success: false,
          error: error,
        },
        500,
      );
    }
  },
);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://${info.address}:${info.port}`);
  },
);
