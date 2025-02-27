import { z } from "zod";
import { Error400Schema } from "./common";
import { GenericCrawlerStatsSchema } from "./common";

// If you need the same body fields as “crawl,” you can reuse them or define new ones.
export const MapBodySchema = z.object({
  url: z.string().url(),
  maxDepth: z.number().int().min(1).optional(),
  maxPages: z.number().int().min(1).optional(),
});

export const Map200ResponseSchema = z.object({
  success: z.boolean(),
  url: z.string().url(),
  data: z.object({
    urls: z.array(z.string().url()),
    stats: GenericCrawlerStatsSchema,
  }),
});

export const MapSchema = {
  body: MapBodySchema,
  response: {
    200: Map200ResponseSchema,
    400: Error400Schema,
  },
} as const;

export type Map200Response = z.infer<typeof Map200ResponseSchema>;
export type MapBody = z.infer<typeof MapBodySchema>;
