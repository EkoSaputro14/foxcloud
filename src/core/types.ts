// Core types and interfaces

export interface Env {
  UUID: string
  PROXY_IP: string
  UDP_RELAY_ENABLED?: string
  UDP_RELAY_HOST?: string
  UDP_RELAY_PORT?: string
}

export interface Header {
  version: number
  isUDP: boolean
  address: string
  port: number
  rawData: ArrayBuffer
}

export interface ProtocolConfig {
  TESTING_VERSION: number
  RELEASE_VERSION: number
  COMMAND_TCP: number
  COMMAND_UDP: number
  COMMAND_MUX: number
  ADDRESS_TYPE_IPV4: number
  ADDRESS_TYPE_DOMAIN: number
  ADDRESS_TYPE_IPV6: number
  RESPONSE_DATA: (v: number) => ArrayBuffer
}
