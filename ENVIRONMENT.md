# Environment Configuration

This document explains how to configure and run the MedAssist application in different environments.

## Environment Files

### Development Environment (`.env.development`)
- **Purpose**: Local development with debugging enabled
- **API URL**: `http://localhost:9009`
- **Debug Mode**: Enabled
- **Hot Reload**: Enabled
- **Source Maps**: Enabled

### Production Environment (`.env.production`)
- **Purpose**: Production deployment with optimizations
- **API URL**: `https://api.medassist.com`
- **Debug Mode**: Disabled
- **Analytics**: Enabled
- **Security**: Enhanced

## Available Scripts

### Development
```bash
# Start development server (default)
npm run dev

# Start with development environment
npm run start
npm run start:local
```

### Production
```bash
# Start with production environment
npm run start:prod

# Build for production
npm run build:prod
```

## Environment Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `VITE_APP_ENV` | development | production | Environment identifier |
| `VITE_API_BASE_URL` | http://localhost:9009 | https://api.medassist.com | API base URL |
| `VITE_APP_NAME` | MedAssist Development | MedAssist | Application name |
| `VITE_DEBUG_MODE` | true | false | Enable debug features |
| `VITE_LOG_LEVEL` | debug | error | Logging level |
| `VITE_API_TIMEOUT` | 30000 | 15000 | API request timeout (ms) |
| `VITE_API_RETRY_ATTEMPTS` | 3 | 2 | API retry attempts |
| `VITE_ENABLE_DEBUG_TOOLS` | true | false | Enable debug tools |
| `VITE_ENABLE_MOCK_DATA` | false | false | Enable mock data |
| `VITE_ENABLE_ANALYTICS` | false | true | Enable analytics |
| `VITE_HOT_RELOAD` | true | false | Enable hot reload |
| `VITE_SOURCE_MAPS` | true | false | Enable source maps |
| `VITE_ENABLE_HTTPS_ONLY` | false | true | Force HTTPS |
| `VITE_ENABLE_CSP` | false | true | Content Security Policy |

## Usage Examples

### Start Local Development
```bash
npm run start:local
# or
npm run start
```

### Start Production Mode
```bash
npm run start:prod
```

### Build for Production
```bash
npm run build:prod
```

## Custom Environment

To create a custom environment:

1. Copy `.env.example` to `.env.custom`
2. Update the variables as needed
3. Run with: `vite --mode custom`

## Security Notes

- Never commit `.env` files with sensitive data
- Use `.env.example` as a template
- Production environment has enhanced security settings
- API URLs should be HTTPS in production

## Troubleshooting

### Environment Not Loading
- Ensure the file is named correctly (`.env.development`, `.env.production`)
- Check that the mode matches the environment file name
- Restart the development server after changing environment files

### API Connection Issues
- Verify the `VITE_API_BASE_URL` is correct
- Check that the API server is running
- Ensure CORS is configured on the API server
