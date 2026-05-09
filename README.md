# 🦊 FoxCloud - Edge Proxy for Cloudflare Workers

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare)](https://workers.cloudflare.com/)
[![License](https://img.shields.io/github/license/code3-dev/foxcloud)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/code3-dev/foxcloud)](https://github.com/code3-dev/foxcloud/releases)
[![Changelog](https://img.shields.io/badge/Changelog-CHANGELOG.md-blue)](CHANGELOG.md)
[![Deploy to Cloudflare Workers](https://github.com/code3-dev/foxcloud/actions/workflows/deploy.yml/badge.svg)](https://github.com/code3-dev/foxcloud/actions/workflows/deploy.yml)

FoxCloud is a high-performance VLESS proxy server built for Cloudflare Workers, designed to provide secure and fast internet access through Cloudflare's global network.

## 📚 Documentation

- [API Documentation](docs/api.md) - Endpoint reference and usage
- [Architecture](docs/architecture.md) - System design and components
- [Best Practices](docs/best-practices.md) - Security, performance, and maintenance guidelines
- [Cloudflare Limits](docs/cloudflare-limits.md) - Worker limits and quotas
- [Deployment Guide](docs/deployment.md) - Complete instructions for all deployment methods
- [Environment Variables](docs/environment-variables.md) - How to configure UUIDs and proxy IPs
- [FAQ](docs/faq.md) - Frequently asked questions
- [Project Structure](docs/project-structure.md) - Directory organization and file layout
- [Subscription Guide](docs/subscription-guide.md) - Using the subscription system with clients
- [Testing Guide](docs/testing.md) - How to test the application
- [Troubleshooting Guide](docs/troubleshooting.md) - Solutions to common issues
- [Upgrading Guide](docs/upgrading.md) - How to upgrade your deployment
- [Contributing Guide](CONTRIBUTING.md) - How to contribute to the project

## ✨ Features

- **Lightning Fast**: Powered by Cloudflare's global network with 200+ data centers
- **Secure**: Enterprise-grade encryption with TLS 1.3 support
- **Easy Deployment**: One-click deploy to Cloudflare Workers
- **Multi-Protocol**: VLESS support with WebSocket transport
- **Subscription Management**: Automatic configuration generation

## 🚀 Quick Start

### Method 1: Download Pre-built Worker (Recommended)

1. Download the latest `worker.js` from [Releases](https://github.com/code3-dev/foxcloud/releases)
2. Deploy to Cloudflare Workers:
   ```bash
   npm install -g wrangler
   wrangler deploy worker.js
   ```

### Method 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/code3-dev/foxcloud.git
cd foxcloud

# Install dependencies
npm install

# Configure environment variables
# Copy example configuration and edit:
cp wrangler.example.toml wrangler.toml
# Edit wrangler.toml with your UUIDs and proxy IPs

# Build the project
npm run build

# Deploy to Cloudflare Workers
npm run deploy
```

### Method 3: GitHub Actions (CI/CD)

1. Fork this repository
2. Set up Cloudflare credentials in repository secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. Enable GitHub Actions in repository settings
4. Push to `master` branch to trigger automatic deployment

## ⚙️ Environment Variables

FoxCloud requires the following environment variables to be configured in your Cloudflare Worker:

| Variable | Description | Example |
|---------|-------------|---------|
| `UUID` | Comma-separated list of user UUIDs | `08dad8a6-8a6c-4424-9d63-62f3a9bf7f4f,49d598ee-4dfc-4001-95ca-99a5b6002e3c` |
| `PROXY_IP` | Comma-separated list of proxy IPs with ports | `172.66.45.9:443,104.18.128.25:443,162.159.136.94:443` |

See the [Environment Variables Guide](docs/environment-variables.md) for detailed instructions on:
- Generating secure UUIDs
- Validating proxy IPs
- Setting variables via different methods
- Security best practices
- Troubleshooting common issues

See the [Status Page Template](docs/status-page-template.md) for information on implementing a public status page.

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Deploy to Cloudflare
npm run deploy
```

## 🔧 Configuration

### Customizing UUIDs

Generate secure UUIDs using:
```bash
# On Linux/macOS
cat /proc/sys/kernel/random/uuid

# On Windows PowerShell
New-Guid

# Using Node.js
node -e "console.log(require('crypto').randomUUID())"

# Using FoxCloud helper script
npm run generate-uuid
```

See the [scripts directory](scripts/) for additional utility scripts.

### Proxy IPs

FoxCloud supports multiple proxy IPs for load balancing. Add multiple IPs separated by commas:
```
PROXY_IP = "172.66.45.9:443,104.18.128.25:443,162.159.136.94:443"
```

Destination domains are dialed using their original hostname (not pre-resolved IPs) so TLS SNI remains correct for strict HTTPS endpoints.

## 📱 Client Configuration

After deployment, access your subscription configuration at:
```
https://your-worker.your-subdomain.workers.dev/sub
```

See the [Subscription Guide](docs/subscription-guide.md) for detailed instructions on:
- Configuring V2Ray compatible clients
- Setting up mobile clients
- Managing multiple UUIDs
- Troubleshooting connection issues

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Cloudflare Workers](https://workers.cloudflare.com/) for the amazing platform
- [VLESS Protocol](https://github.com/XTLS/Xray-core) for secure proxy technology
- All contributors who have helped shape FoxCloud

---

<p align="center">
  Made with 🦊 by the Hossein Pira & IRCF
</p>
