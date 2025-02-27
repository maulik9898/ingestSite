import type { FastifyRequest, FastifySchema } from "fastify";
import { z } from "zod";

export type InferRequestType<T extends FastifySchema> = FastifyRequest<{
  Body: T["body"] extends z.ZodType ? z.infer<T["body"]> : never;
  Querystring: T["querystring"] extends z.ZodType
    ? z.infer<T["querystring"]>
    : never;
  Params: T["params"] extends z.ZodType ? z.infer<T["params"]> : never;
  Headers: T["headers"] extends z.ZodType ? z.infer<T["headers"]> : never;
}>;

export const Error400Schema = z.object({
  code: z.string().min(1).max(255),
  error: z.string().min(1).max(255),
  message: z.string().min(1).max(255),
});

export const GenericCrawlerResultSchema = z.object({
  url: z.string().url(),
  markdown: z.string().optional(),
});

export const GenericCrawlerStatsSchema = z.object({
  pagesProcessed: z.number(),
  failedRequests: z.number(),
  crawlingTime: z.number(),
});

export const CrawlerTypeSchema = z.enum(["basic", "advance"]);

export type GenericCrawlerStats = z.infer<typeof GenericCrawlerStatsSchema>;
export type GenericCrawlerResult = z.infer<typeof GenericCrawlerResultSchema>;
export type CrawlerType = z.infer<typeof CrawlerTypeSchema>;
