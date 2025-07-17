import Fastify from "fastify"
import cors from "@fastify/cors"
import { lolRoutes } from "./src/routes/lol"

const app = Fastify()

// 🔓 CORS (autorise React à appeler l'API)
await app.register(cors, {
  origin: "*",
})

// 📦 Enregistre les routes League of Legends
await app.register(lolRoutes)

// 🚀 Lancement du serveur
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001

app.listen({ port: PORT, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error("❌ Failed to start server:", err)
    process.exit(1)
  }
  console.log(`🚀 Fastify server running at ${address}`)
})
