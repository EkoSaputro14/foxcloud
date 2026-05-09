import { connect } from 'cloudflare:sockets'
import { Protocol } from '../constants/protocol'
import { safeCloseWebSocket } from '../utils/helpers'

import type { Header } from '../protocols/index'

interface UDPRelayConfig {
  host: string
  port: number
}

async function buildRelayPacket(
  address: string,
  port: number,
  payload: ArrayBuffer,
): Promise<ArrayBuffer> {
  return await new Blob([`udp:${address}:${port}|`, payload]).arrayBuffer()
}

export async function processUDPRelay(
  ws: WebSocket,
  header: Header,
  config: UDPRelayConfig,
) {
  console.log(
    `Using UDP relay for ${header.address}:${header.port} via ${config.host}:${config.port}`,
  )

  const socket = connect({
    hostname: config.host,
    port: config.port,
  })

  const writer = socket.writable.getWriter()
  const writeRelayPacket = async (payload: ArrayBuffer) => {
    await writer.write(
      await buildRelayPacket(header.address, header.port, payload),
    )
  }

  await writeRelayPacket(header.rawData)

  const onMessage = async (event: MessageEvent) => {
    if (typeof event.data === 'string') {
      return
    }
    if (event.data instanceof Blob) {
      await writeRelayPacket(await event.data.arrayBuffer())
      return
    }
    await writeRelayPacket(event.data)
  }

  const closeSocket = async () => {
    ws.removeEventListener('message', onMessage)
    ws.removeEventListener('close', closeSocket)
    ws.removeEventListener('error', closeSocket)
    writer.releaseLock()
    await socket.close()
  }

  ws.addEventListener('message', onMessage)
  ws.addEventListener('close', closeSocket)
  ws.addEventListener('error', closeSocket)

  const reader = socket.readable.getReader()
  const { done, value } = await reader.read()
  if (done) {
    throw Error('udp relay connection was done')
  }
  reader.releaseLock()

  ws.send(
    await new Blob([Protocol.RESPONSE_DATA(header.version), value]).arrayBuffer(),
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
