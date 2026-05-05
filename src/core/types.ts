// Core types and interfaces

export interface Env {
  UUID: string
  PROXY_IP: string
  /** Upstream DNS server IP/hostname used for DNS relay (UDP port 53). Default: 8.8.8.8 */
  DNS_SERVER_ADDRESS?: string
  /** Upstream DNS server port used for DNS relay. Default: 53 */
  DNS_SERVER_PORT?: string
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