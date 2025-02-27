import type { FastifySchema } from "fastify";
import { z } from "zod";
import {
  CrawlerTypeSchema,
  Error400Schema,
  GenericCrawlerResultSchema,
  GenericCrawlerStatsSchema,
  type InferRequestType,
} from "./common";

export const ScrapeConfigSchema = z.object({
  url: z.string().url(),
  includeTags: z.array(z.string()).optional(),
  excludeTags: z.array(z.string()).optional(),
  onlyMainContent: z.boolean().optional(),
});

export const ScrapeQuerySchema = z.object({
  url: z.string().url(),
  crawlerType: CrawlerTypeSchema.optional().default("basic"),
});

export const ScrapeResultSchema = z.object({
  result: GenericCrawlerResultSchema,
  stats: GenericCrawlerStatsSchema,
});

export const Scrape200ResponseSchema = z.object({
  success: z.boolean(),
  data: ScrapeResultSchema,
});

export const ScrapeSchema = {
  querystring: ScrapeQuerySchema,
  response: {
    200: Scrape200ResponseSchema,
    400: Error400Schema,
  },
} satisfies FastifySchema;

export type ScrapeConfig = z.infer<typeof ScrapeConfigSchema>;
export type ScrapeResult = z.infer<typeof ScrapeResultSchema>;
export type Scrape200Response = z.infer<typeof Scrape200ResponseSchema>;
export type ScrapeRequest = InferRequestType<typeof ScrapeSchema>;
export type ScrapeQuery = z.infer<typeof ScrapeQuerySchema>;
