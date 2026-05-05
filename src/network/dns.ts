import { connect } from 'cloudflare:sockets'
import { safeCloseWebSocket } from '../utils/helpers'
import { Protocol } from '../constants/protocol'
import type { Header } from '../protocols/index'
import type { Env } from '../core/types'

const DEFAULT_DNS_ADDRESS = '8.8.8.8'
const DEFAULT_DNS_PORT = 53

/**
 * Relays a DNS query (UDP port 53) to a configurable upstream DNS server.
 * The upstream address and port are read from env vars DNS_SERVER_ADDRESS /
 * DNS_SERVER_PORT, falling back to 8.8.8.8:53 when not set.
 *
 * @param ws     - Client WebSocket connection
 * @param header - Parsed VLESS header
 * @param env    - Worker environment (for DNS_SERVER_ADDRESS / DNS_SERVER_PORT)
 */
export async function processDNS(ws: WebSocket, header: Header, env?: Env) {
  const dnsAddress = env?.DNS_SERVER_ADDRESS?.trim() || DEFAULT_DNS_ADDRESS
  const dnsPort = env?.DNS_SERVER_PORT ? (parseInt(env.DNS_SERVER_PORT, 10) || DEFAULT_DNS_PORT) : DEFAULT_DNS_PORT

  const socket = connect({
    hostname: dnsAddress,
    port: dnsPort,
  })
  const writer = socket.writable.getWriter()
  await writer.write(header.rawData)
  ws.addEventListener('message', async (event) => {
    await writer.write(event.data)
  })
  ws.addEventListener('close', async () => {
    await socket.close()
  })
  ws.addEventListener('error', async () => {
    await socket.close()
  })
  const reader = socket.readable.getReader()
  const { done, value } = await reader.read()
  if (done) {
    throw Error('connection was done')
  }
  reader.releaseLock()
  ws.send(
    await new Blob([
      Protocol.RESPONSE_DATA(header.version),
      value,
    ]).arrayBuffer(),
  )

  await socket.readable.pipeTo(
    new WritableStream({
      write(chunk) {
        ws.send(chunk)
      },
      abort() {
        safeCloseWebSocket(ws)
      },
      close() {
        safeCloseWebSocket(ws)
      },
    }),
  )
}
