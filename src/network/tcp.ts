import { connect } from 'cloudflare:sockets'
import { Protocol } from '../constants/protocol'
import { safeCloseWebSocket } from '../utils/helpers'
import type { Header } from '../protocols/index'

async function retry(
  version: number,
  rawData: ArrayBuffer,
  ws: WebSocket,
  proxyIPs: string[],
): Promise<Socket | undefined> {
  for (const proxyIP of proxyIPs) {
    try {
      const socket = await dial(proxyIP, version, rawData, ws)
      return socket
    } catch (err) {
      console.error(err)
      continue
    }
  }
}

async function dial(
  remote: SocketAddress | string,
  version: number,
  rawData: ArrayBuffer,
  ws: WebSocket,
): Promise<Socket> {
  let messageFn = null
  let closeFn = null
  let errorFn = null
  try {
    const socket = connect(remote)
    const writer = socket.writable.getWriter()
    await writer.write(rawData)
    messageFn = async (event: MessageEvent) => {
      await writer.write(event.data)
    }
    closeFn = async () => {
      await socket.close()
    }
    errorFn = async () => {
      await socket.close()
    }
    ws.addEventListener('message', messageFn)
    ws.addEventListener('close', closeFn)
    ws.addEventListener('error', errorFn)

    const reader = socket.readable.getReader()
    const { done, value } = await reader.read()
    if (done) {
      throw Error('connection was done')
    }
    reader.releaseLock()
    ws.send(
      await new Blob([Protocol.RESPONSE_DATA(version), value]).arrayBuffer(),
    )
    return socket
  } catch (err) {
    if (messageFn) {
      ws.removeEventListener('message', messageFn)
    }
    if (closeFn) {
      ws.removeEventListener('close', closeFn)
    }
    if (errorFn) {
      ws.removeEventListener('error', errorFn)
    }
    throw err
  }
}

export async function processTCP(
  ws: WebSocket,
  header: Header,
  proxyIPs: string[],
) {
  let socket: Socket | undefined
  try {
    // Keep domain hostnames for upstream dialing so TLS SNI is preserved.
    socket = await dial(
      { hostname: header.address, port: header.port },
      header.version,
      header.rawData,
      ws,
    )
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    socket = await retry(header.version, header.rawData, ws, proxyIPs)
  }
  if (socket === undefined) {
    throw Error(
      `cannot connect to hostname: ${header.address}, port: ${header.port}`,
    )
  }
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
