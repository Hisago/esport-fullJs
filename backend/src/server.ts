import Fastify from "fastify"
import cors from "@fastify/cors"
import dotenv from "dotenv"
import { lolRoutes } from "./routes/lol.js"

// 🔧 Charge les variables .env
dotenv.config()

const app = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: true,
        ignore: "pid,hostname",
      },
    },
  },
})

// 🔓 CORS (autorise React à appeler l'API)
await app.register(cors, {
  origin: "*",
})

// 📦 Enregistre les routes League of Legends
await app.register(lolRoutes)

// 🔥 Démarrage du serveur
const port = Number(process.env.PORT) || 3001

app.listen({ port, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    app.log.error(err, "❌ Failed to start server")
    process.exit(1)
  }
  app.log.info(`🚀 Fastify server running at ${address}`)
})
