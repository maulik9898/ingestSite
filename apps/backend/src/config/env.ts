import { z } from "zod";

enum NodeEnv {
  development = "development",
  production = "production",
  test = "test",
}

export enum LogLevel {
  debug = "debug",
  info = "info",
  warn = "warn",
  error = "error",
}

const EnvSchema = z.object({
  LOG_LEVEL: z.nativeEnum(LogLevel).default(LogLevel.debug),
  NODE_ENV: z.nativeEnum(NodeEnv).default(NodeEnv.development),
  HOST: z.string().default("localhost"),
  PORT: z.coerce.number().default(3000),
});

const env = EnvSchema.parse(process.env);

export default {
  nodeEnv: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === NodeEnv.development,
  isProduction: env.NODE_ENV === NodeEnv.production,
  version: process.env.npm_package_version ?? "0.0.0",
  log: {
    level: env.LOG_LEVEL,
  },
  server: {
    host: env.HOST,
    port: env.PORT,
  },
};
