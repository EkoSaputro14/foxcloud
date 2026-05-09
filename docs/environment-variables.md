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

### UDP_RELAY_ENABLED

Enable UDP relay for non-DNS UDP traffic (for example QUIC/HTTP3 on port 443).

**Format**: `true` or `false` (string)
**Default**: `false`
**Example**:
```
UDP_RELAY_ENABLED = "true"
```

### UDP_RELAY_HOST

Relay server hostname used when `UDP_RELAY_ENABLED` is `true`.

**Format**: Hostname
**Default**: `udp-relay.hobihaus.space`
**Example**:
```
UDP_RELAY_HOST = "udp-relay.hobihaus.space"
```

### UDP_RELAY_PORT

Relay server TCP port used when `UDP_RELAY_ENABLED` is `true`.

**Format**: Port number (string)
**Default**: `7300`
**Example**:
```
UDP_RELAY_PORT = "7300"
```

## Setting Environment Variables

### Method 1: Wrangler CLI (Recommended)

```bash
wrangler secret put UUID
# Enter your UUID when prompted

wrangler secret put PROXY_IP
# Enter your proxy IP(s) when prompted

wrangler secret put UDP_RELAY_ENABLED
# Enter true to enable UDP relay

wrangler secret put UDP_RELAY_HOST
# Enter relay host (optional, default is udp-relay.hobihaus.space)

wrangler secret put UDP_RELAY_PORT
# Enter relay port (optional, default is 7300)
```

### Method 2: wrangler.toml

Add to your `wrangler.toml`:
```toml
[vars]
UUID = "your-uuid-here"
PROXY_IP = "proxy-ip:port"
UDP_RELAY_ENABLED = "false"
# UDP_RELAY_HOST = "udp-relay.hobihaus.space"
# UDP_RELAY_PORT = "7300"
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

### UDP Relay Issues

If UDP traffic (non-53) fails:
1. Verify `UDP_RELAY_ENABLED` is set to `true`
2. Verify `UDP_RELAY_HOST` and `UDP_RELAY_PORT` are reachable
3. Check Worker logs for UDP relay connection errors
