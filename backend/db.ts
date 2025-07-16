import sqlite3 from "sqlite3"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function getDb() {
  const dbPath = path.resolve(__dirname, "./prisma/dev.db")
  console.log("📁 DB file path:", dbPath)

  return new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("❌ Failed to open DB:", err.message)
    } else {
      console.log("✅ Connected to SQLite database.")
    }
  })
}
