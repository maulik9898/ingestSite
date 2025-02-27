import type { FastifySchema } from "fastify";
import { z } from "zod";
import {
  CrawlerTypeSchema,
  Error400Schema,
  GenericCrawlerResultSchema,
  GenericCrawlerStatsSchema,
  type InferRequestType,
} from "./common";

export const CrawlConfigSchema = z.object({
  url: z.string().url(),
  maxDepth: z.number().int().min(1).optional(),
  maxPages: z.number().int().min(1).optional(),
});

export const CrawlBodySchema = z.object({
  url: z.string().url(),
  maxDepth: z.number().int().min(1).optional(),
  maxPages: z.number().int().min(1).optional(),
});

export const CrawlQuerySchema = z.object({
  url: z.string().url(),
  maxDepth: z.coerce.number().int().min(1).optional(),
  maxPages: z.coerce.number().int().min(1).optional(),
  crawlerType: CrawlerTypeSchema.optional().default("basic"),
});

export const CrawlResultSchema = z.object({
  results: z.array(GenericCrawlerResultSchema),
  stats: GenericCrawlerStatsSchema,
});

export const Crawl200ResponseSchema = z.object({
  success: z.boolean(),
  url: z.string().url(),
  data: CrawlResultSchema,
});

export const CrawlSchema = {
  querystring: CrawlQuerySchema,
  response: {
    200: Crawl200ResponseSchema,
    400: Error400Schema,
  },
} satisfies FastifySchema;

export type CrawlConfig = z.infer<typeof CrawlConfigSchema>;
export type CrawlQuery = z.infer<typeof CrawlQuerySchema>;
export type CrawlResult = z.infer<typeof CrawlResultSchema>;
export type Crawl200Response = z.infer<typeof Crawl200ResponseSchema>;

export type CrawlRequest = InferRequestType<typeof CrawlSchema>;
export type CrawlBody = z.infer<typeof CrawlBodySchema>;
