import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().nonempty(),
    GITHUB_TOKEN: z.string().optional(),
  },
  runtimeEnv: {
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  },
  emptyStringAsUndefined: true,
});