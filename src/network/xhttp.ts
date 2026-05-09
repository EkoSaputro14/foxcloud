import { connect } from 'cloudflare:sockets'
import { Protocol } from '../constants/protocol'
import { processHeader } from '../protocols/index'
import { splitAndFilter } from '../utils/array'

import type { Env } from '../core/types'
import type { Header } from '../protocols/index'

const MAX_HEADER_SIZE = 8192

function concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.byteLength + b.byteLength)
  result.set(a, 0)
  result.set(b, a.byteLength)
  return result
}

function isIncompleteHeaderError(error: unknown, size: number): boolean {
  if (size >= MAX_HEADER_SIZE) {
    return false
  }
  if (error instanceof RangeError) {
    return true
  }
  return error instanceof Error && error.message === 'invalid protocol header'
}

async function readHeader(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  uuids: string[],
): Promise<Header> {
  let buffered = new Uint8Array(0)

  while (buffered.byteLength <= MAX_HEADER_SIZE) {
    const { done, value } = await reader.read()
    if (done || value === undefined) {
      throw Error('request body ended before protocol header')
    }

    buffered = concatUint8Arrays(buffered, value)
    const payload = buffered.buffer.slice(
      buffered.byteOffset,
      buffered.byteOffset + buffered.byteLength,
    )

    try {
      return processHeader(payload, uuids)
    } catch (error) {
      if (isIncompleteHeaderError(error, buffered.byteLength)) {
        continue
      }
      throw error
    }
  }

  throw Error('protocol header exceeds maximum allowed size')
}

interface DialResult {
  socket: Socket
  firstChunk: Uint8Array
}

async function dial(
  remote: SocketAddress | string,
  header: Header,
): Promise<DialResult> {
  const socket = connect(remote)
  try {
    const writer = socket.writable.getWriter()
    try {
      if (header.rawData.byteLength > 0) {
        await writer.write(new Uint8Array(header.rawData))
      }
    } finally {
      writer.releaseLock()
    }

    const reader = socket.readable.getReader()
    const { done, value } = await reader.read()
    reader.releaseLock()

    if (done || value === undefined) {
      await socket.close()
      throw Error('connection was done')
    }

    return { socket, firstChunk: value }
  } catch (error) {
    try {
      await socket.close()
    } catch {
      // no-op
    }
    throw error
  }
}

async function dialWithRetry(
  header: Header,
  proxyIPs: string[],
): Promise<DialResult> {
  try {
    return await dial(
      { hostname: header.address, port: header.port },
      header,
    )
  } catch (primaryError) {
    console.error(primaryError)
  }

  for (const proxyIP of proxyIPs) {
    try {
      return await dial(proxyIP, header)
    } catch (retryError) {
      console.error(retryError)
    }
  }

  throw Error(
    `cannot connect to hostname: ${header.address}, port: ${header.port}`,
  )
}

async function pipeUplink(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  socket: Socket,
): Promise<void> {
  const writer = socket.writable.getWriter()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      if (value !== undefined && value.byteLength > 0) {
        await writer.write(value)
      }
    }
    await writer.close()
  } finally {
    writer.releaseLock()
  }
}

async function pipeDownlink(
  socket: Socket,
  firstChunk: Uint8Array,
  version: number,
  writable: WritableStream<Uint8Array>,
): Promise<void> {
  const writer = writable.getWriter()
  try {
    const responsePrefix = new Uint8Array(Protocol.RESPONSE_DATA(version))
    await writer.write(concatUint8Arrays(responsePrefix, firstChunk))
    await socket.readable.pipeTo(
      new WritableStream({
        write: async (chunk: Uint8Array) => {
          await writer.write(chunk)
        },
      }),
    )
    await writer.close()
  } catch (error) {
    try {
      await writer.abort(error)
    } catch {
      // no-op
    }
    throw error
  } finally {
    writer.releaseLock()
  }
}

function isClientInputError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes('protocol header') ||
    error.message.includes('invalid protocol version') ||
    error.message.includes('invalid user') ||
    error.message.includes('unsupported command') ||
    error.message.includes('invalid address type') ||
    error.message.includes('UDP transport is unsupported')
  )
}

/**
 * Processes XHTTP transport requests (HTTP/2 streaming tunnel)
 */
export async function processXHTTP(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  try {
    if (request.body === null) {
      return new Response('xhttp request body is required', { status: 400 })
    }

    const uuids = splitAndFilter(env.UUID, ',')
    const proxyIPs = splitAndFilter(env.PROXY_IP, ',')
    const requestReader = request.body.getReader()

    const header = await readHeader(requestReader, uuids)
    if (header.isUDP) {
      return new Response('UDP transport is unsupported for xhttp', {
        status: 400,
      })
    }

    const { socket, firstChunk } = await dialWithRetry(header, proxyIPs)
    const stream = new TransformStream<Uint8Array, Uint8Array>()

    const tunnelPromise = Promise.allSettled([
      pipeUplink(requestReader, socket),
      pipeDownlink(socket, firstChunk, header.version, stream.writable),
    ]).then(async () => {
      try {
        await socket.close()
      } catch {
        // no-op
      }
    })

    ctx.waitUntil(tunnelPromise)

    return new Response(stream.readable, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('xhttp error:', error)
    if (isClientInputError(error)) {
      return new Response('invalid xhttp request', { status: 400 })
    }
    return new Response('xhttp tunnel failure', { status: 502 })
  }
}
