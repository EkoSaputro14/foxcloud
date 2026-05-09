import { processHeader } from '../protocols/index'
import { processTCP } from './tcp'
import { safeCloseWebSocket } from '../utils/helpers'
import { processDNS } from './dns'
import { processUDPRelay } from './udp'

import type { Env } from '../core/types'

/**
 * Decodes early data from base64url encoding
 * @param earlyData - Base64url encoded string
 * @returns Decoded ArrayBuffer
 */
function decodeEarlyData(earlyData: string): ArrayBuffer {
  earlyData = earlyData.replace(/-/g, '+').replace(/_/g, '/')
  const binaryStr = atob(earlyData)
  const buffer = new ArrayBuffer(binaryStr.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < binaryStr.length; i++) {
    view[i] = binaryStr.charCodeAt(i)
  }
  return buffer
}

/**
 * Gets the initial header from WebSocket connection
 * @param ws - WebSocket connection
 * @param earlyData - Early data from Sec-WebSocket-Protocol header
 * @returns Promise resolving to ArrayBuffer of header data
 */
function getHeader(
  ws: WebSocket,
  earlyData: string | null,
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    if (earlyData) {
      try {
        const data = decodeEarlyData(earlyData)
        resolve(data)
      } catch (err) {
        reject(err)
      }
    }

    const handleMsg = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        reject('invalid data')
      } else {
        resolve(event.data)
      }
      ws.removeEventListener('message', handleMsg)
      ws.removeEventListener('error', handleErr)
    }

    const handleErr = (event: Event) => {
      // @ts-ignore
      reject(event.error || 'WebSocket error')
      ws.removeEventListener('message', handleMsg)
      ws.removeEventListener('error', handleErr)
    }

    ws.addEventListener('message', handleMsg)
    ws.addEventListener('error', handleErr)

    setTimeout(() => {
      reject('timeout')
      ws.removeEventListener('message', handleMsg)
      ws.removeEventListener('error', handleErr)
    }, 10000)
  })
}

/**
 * Processes incoming WebSocket connections
 * @param request - Incoming request
 * @param env - Environment variables
 * @returns Response with WebSocket upgrade
 */
export function processWebSocket(request: Request, env: Env): Response {
  const uuids = env.UUID.split(',').filter((v) => v !== '')
  const proxyIPs = env.PROXY_IP.split(',').filter((v) => v !== '')
  const udpRelayEnabled = env.UDP_RELAY_ENABLED?.toLowerCase() === 'true'
  const udpRelayHost = env.UDP_RELAY_HOST || 'udp-relay.hobihaus.space'
  const udpRelayPort = Number.parseInt(env.UDP_RELAY_PORT || '7300', 10)

  const [client, server] = Object.values(new WebSocketPair())
  if (server === undefined) {
    throw 'WebSocket server not defined'
  }
  if (client === undefined) {
    throw 'WebSocket client not defined'
  }

  server.accept()

  getHeader(server, request.headers.get('Sec-WebSocket-Protocol'))
    .then((v) => processHeader(v, uuids))
    .then(async (header) => {
      if (header.isUDP) {
        if (header.port === 53) {
          await processDNS(server, header)
        } else {
          if (!udpRelayEnabled) {
            throw Error('UDP transport is unsupported')
          }
          await processUDPRelay(server, header, {
            host: udpRelayHost,
            port:
              Number.isNaN(udpRelayPort) || udpRelayPort <= 0
                ? 7300
                : udpRelayPort,
          })
        }
        return
      }

      await processTCP(server, header, proxyIPs)
    })
    .catch((err) => {
      console.error(err)
      safeCloseWebSocket(server)
    })

  return new Response(null, {
    status: 101,
    webSocket: client,
  })
}
