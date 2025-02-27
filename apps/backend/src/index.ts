import env from "@/config/env";
import server from "@/lib/server";
import "@/test";
import { randomUUID } from "node:crypto";
import GracefulServer from "@gquittet/graceful-server";
import Fastify from "fastify";

async function init() {
  const fastify = Fastify({
    logger: {
      level: env.log.level,
      redact: ["headers.authorization"],
    },
    genReqId: (req) => {
      // header best practice: don't use "x-" https://www.rfc-editor.org/info/rfc6648 and keep it lowercase
      return (req.headers["request-id"] as string) ?? randomUUID();
    },
    ignoreDuplicateSlashes: true,
  });

  await server(fastify);

  const gracefulServer = GracefulServer(fastify.server);

  gracefulServer.on(GracefulServer.READY, () => {
    fastify.log.info("Server is ready");
  });

  gracefulServer.on(GracefulServer.SHUTTING_DOWN, () => {
    fastify.log.info("Server is shutting down");
  });

  gracefulServer.on(GracefulServer.SHUTDOWN, (error) => {
    fastify.log.info("Server is down because of", error.message);
  });

  try {
    await fastify.listen({ port: env.server.port });
    gracefulServer.setReady();
  } catch (error) {
    fastify.log.error(error);
    // eslint-disable-next-line n/no-process-exit,unicorn/no-process-exit
    process.exit(1);
  }
}

init();
