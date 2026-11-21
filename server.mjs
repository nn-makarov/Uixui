import { createServer } from "node:http"
import { createHmac, randomBytes } from "node:crypto"
import next from "next"

const DIRECT_IP_HEADER = "x-cleaning-direct-ip"
const DIRECT_IP_SIGNATURE_HEADER = "x-cleaning-direct-ip-signature"
const internalClientIpToken = randomBytes(32).toString("base64url")
process.env.INTERNAL_CLIENT_IP_TOKEN = internalClientIpToken

function readOption(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

const dev = process.argv.includes("--dev")
const hostname = readOption("hostname", process.env.APP_HOST || "0.0.0.0")
const port = Number(readOption("port", process.env.APP_PORT || "3000"))

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("APP_PORT/--port должен быть целым числом от 1 до 65535")
}

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

await app.prepare()

const server = createServer(async (req, res) => {
  for (const headerName of Object.keys(req.headers)) {
    const normalized = headerName.toLowerCase()
    if (normalized === DIRECT_IP_HEADER || normalized === DIRECT_IP_SIGNATURE_HEADER) {
      delete req.headers[headerName]
    }
  }

  if (req.socket.remoteAddress) {
    const directIp = req.socket.remoteAddress
    req.headers[DIRECT_IP_HEADER] = directIp
    req.headers[DIRECT_IP_SIGNATURE_HEADER] = createHmac("sha256", internalClientIpToken)
      .update(directIp)
      .digest("hex")
  }

  try {
    await handle(req, res)
  } catch (error) {
    console.error("Ошибка обработки HTTP-запроса:", error)
    if (!res.headersSent) res.statusCode = 500
    res.end("Internal Server Error")
  }
})

server.listen(port, hostname, () => {
  console.log(`> Cleaning App ready on http://${hostname}:${port}`)
})

function shutdown() {
  server.close(() => process.exit(0))
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
