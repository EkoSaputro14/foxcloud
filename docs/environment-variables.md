# Environment Variables Configuration

FoxCloud requires specific environment variables to function properly. This guide explains each variable and how to configure them.

## Required Variables

### UUID

The UUID variable contains one or more user identifiers for VLESS authentication.

**Format**: Single UUID or comma-separated list of UUIDs
**Example**: 
```
UUID = "08dad8a6-8a6c-4424-9d63-62f3a9bf7f4f"
```
or
```
UUID = "08dad8a6-8a6c-4424-9d63-62f3a9bf7f4f,49d598ee-4dfc-4001-95ca-99a5b6002e3c"
```

**Generation**: Use a UUID generator to create secure identifiers:
- Linux: `cat /proc/sys/kernel/random/uuid`
- macOS: `uuidgen`
- Windows PowerShell: `New-Guid`
- Online: [UUID Generator](https://www.uuidgenerator.net/)

### PROXY_IP

The PROXY_IP variable contains one or more proxy server addresses.

**Format**: Single IP:port or comma-separated list of IP:port combinations
**Example**:
```
PROXY_IP = "172.66.45.9:443"
```
or
```
PROXY_IP = "172.66.45.9:443,104.18.128.25:443,162.159.136.94:443"
```

## Optional Variables

### DNS_SERVER_ADDRESS

The upstream DNS server IP or hostname used when the client sends UDP port-53 (DNS) queries through the proxy. Providing a reliable DNS server reduces client-side DNS EOF errors.

**Default**: `8.8.8.8` (Google Public DNS)
**Example**:
```
DNS_SERVER_ADDRESS = "1.1.1.1"
```

Popular choices:
| Provider | Address |
|---|---|
| Google (default) | `8.8.8.8` |
| Cloudflare | `1.1.1.1` |
| Quad9 | `9.9.9.9` |

### DNS_SERVER_PORT

The port of the upstream DNS server.

**Default**: `53`
**Example**:
```
DNS_SERVER_PORT = "53"
```

> **Note**: The Worker relays DNS queries over TCP to the upstream server, which is
> standard for DNS-over-TCP (RFC 7766). Most public DNS resolvers accept port 53 over TCP.

## Setting Environment Variables

### Method 1: Wrangler CLI (Recommended)

```bash
wrangler secret put UUID
# Enter your UUID when prompted

wrangler secret put PROXY_IP
# Enter your proxy IP(s) when prompted
```

### Method 2: wrangler.toml

Add to your `wrangler.toml`:
```toml
[vars]
UUID = "your-uuid-here"
PROXY_IP = "proxy-ip:port"

# Optional DNS relay settings
DNS_SERVER_ADDRESS = "8.8.8.8"
DNS_SERVER_PORT = "53"
```

### Method 3: Cloudflare Dashboard

1. Go to your Worker in Cloudflare Dashboard
2. Navigate to "Settings" → "Variables"
3. Add variables under "Environment Variables"

## Security Best Practices

1. **Use Wrangler Secrets**: For production, always use `wrangler secret put` rather than storing secrets in `wrangler.toml`
2. **Generate Secure UUIDs**: Use version 4 UUIDs for cryptographic security
3. **Limit Access**: Only provide UUIDs to trusted users
4. **Regular Rotation**: Rotate UUIDs periodically for enhanced security
5. **Validate IPs**: Ensure proxy IPs are valid and accessible

## Troubleshooting

### Variable Not Set

If you see errors about missing variables:
1. Verify variables are set using one of the methods above
2. Check that variable names match exactly (case-sensitive)
3. Redeploy your Worker after setting variables

### Invalid UUID Format

If connections fail:
1. Verify UUIDs are in the correct format (8-4-4-4-12 hexadecimal)
2. Ensure no extra spaces or characters
3. Check that UUIDs are properly comma-separated for multiple values

### Proxy Connection Issues

If proxy connections fail:
1. Verify proxy IPs are accessible from the internet
2. Check that ports are open and correctly specified
3. Ensure proxy servers support WebSocket connections
4. Test each proxy IP individually to identify issues

### DNS EOF Errors

If the client reports `dns: exchange failed … EOF`:
1. Set `DNS_SERVER_ADDRESS` to a reliable resolver such as `1.1.1.1` or `8.8.8.8`
2. Ensure the client v2rayN DNS settings use Bootstrap DNS `1.1.1.1` and Remote DoH `https://cloudflare-dns.com/dns-query`
3. In v2rayN configure the VLESS server with **WS path `/ws`** (with leading slash)
4. If DoH is blocked on the local network, disable custom DNS in the client and use System DNS as a fallback