import { defineConfig } from "prisma/config"
import { existsSync } from "fs"
import { config as loadEnv } from "dotenv"

if (existsSync(".env.local")) loadEnv({ path: ".env.local" })
loadEnv()

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
})
