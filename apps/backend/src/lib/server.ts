import env from "@/config/env";
import Cors from "@fastify/cors";
import Helmet from "@fastify/helmet";

import fastifySwagger from "@fastify/swagger";
import UnderPressure from "@fastify/under-pressure";
import ScalarApiReference from "@scalar/fastify-api-reference";
import { toNodeHandler } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import {
  type ZodTypeProvider,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { auth } from "./auth";

import { CrawlRoute } from "@/router/crawl";
import { MapRoute } from "@/router/map";
import { ScrapeRoute } from "@/router/scrape";

export default async function createServer(fastify: FastifyInstance) {
  // Set sensible default security headers
  await fastify.register(Helmet, {
    global: true,
    // The following settings are needed for graphiql, see https://github.com/graphql/graphql-playground/issues/1283
    contentSecurityPolicy: !env.isDevelopment,
    crossOriginEmbedderPolicy: !env.isDevelopment,
  });

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Enables the use of CORS in a Fastify application.
  // https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
  await fastify.register(Cors, {
    origin: false,
  });

  await fastify.register(import("@fastify/rate-limit"), {
    global: false, // don't apply these settings to all the routes of the context
  });
  await fastify.register((fastify) => {
    const authhandler = toNodeHandler(auth);

    fastify.addContentTypeParser(
      "application/json",
      (_request, _payload, done) => {
        done(null, null);
      },
    );

    fastify.all("/api/auth/*", async (request, reply) => {
      await authhandler(request.raw, reply.raw);
    });
  });
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Ingest.site",
        version: env.version,
      },
    },
    transform: jsonSchemaTransform,
  });

  await fastify.register(UnderPressure);

  await fastify.register(ScalarApiReference, {
    routePrefix: "/reference",
  });

  await fastify.register(CrawlRoute, { prefix: "/api" });
  await fastify.register(ScrapeRoute, { prefix: "/api" });
  await fastify.register(MapRoute, { prefix: "/api" });

  return fastify.withTypeProvider<ZodTypeProvider>();
}
