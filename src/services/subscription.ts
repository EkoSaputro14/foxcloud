/**
 * Generates a VLESS subscription URL
 * @param uuid - User UUID
 * @param url - Request URL
 * @returns VLESS subscription URL as string
 */
export function generateSubscription(uuid: string, url: URL): string {
  return `vless://${uuid}@${url.hostname}:443?encryption=none&security=tls&sni=${url.hostname}&fp=chrome&type=ws&host=${url.hostname}&path=%2Fws&ed=4096#${url.hostname}`
}

/**
 * Generates a VLESS configuration object
 * @param uuid - User UUID
 * @param url - Request URL
 * @returns VLESS configuration object
 */
export function generateVlessConfig(uuid: string, url: URL): any {
  return {
    v: "2",
    ps: url.hostname,
    add: url.hostname,
    port: "443",
    id: uuid,
    aid: "0",
    net: "ws",
    type: "none",
    host: url.hostname,
    path: "/ws",
    tls: "tls",
    sni: url.hostname,
    fp: "chrome"
  }
}

/**
 * Generates all configuration formats as a single object
 * @param uuid - User UUID
 * @param url - Request URL
 * @returns Object containing all configuration formats
 */
export function generateAllConfigs(uuid: string, url: URL): any {
  return {
    vless: generateSubscription(uuid, url),
    vlessJson: generateVlessConfig(uuid, url)
  }
}