# Security Implementation

This document outlines the security measures implemented in this Next.js application to protect API endpoints and ensure secure operation.

## Overview

The application implements multiple layers of security:

1. **Domain Validation** - CORS protection based on allowed domains
2. **Rate Limiting** - Per-IP request limits to prevent abuse
3. **API Key Authentication** - Optional API key protection for sensitive endpoints
4. **Request Logging** - Monitoring and logging of all API requests
5. **Security Headers** - Standard security headers on all responses

## Configuration

### Required Environment Variables

```bash
# Required: Your app's domain for CORS validation
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Optional: API key for scraping endpoints
API_SECRET_KEY=your-secret-api-key-here
```

### Security Features by Endpoint

| Endpoint            | Rate Limit | API Key Required | CORS Protected |
| ------------------- | ---------- | ---------------- | -------------- |
| `/api/repositories` | 30/min     | No               | Yes            |
| `/api/stats`        | 60/min     | No               | Yes            |
| `/api/paper`        | 10/min     | Yes\*            | No\*\*         |
| `/api/paper/detail` | 10/min     | Yes\*            | No\*\*         |
| `/api/trending`     | 10/min     | Yes\*            | No\*\*         |
| `/api/ossinsight`   | 10/min     | Yes\*            | No\*\*         |

\*API key required only if `API_SECRET_KEY` is set in environment
\*\*CORS disabled for server-to-server scraping calls

## Rate Limiting

The application implements in-memory rate limiting with the following limits:

- **General endpoints**: 100 requests per minute per IP
- **Search endpoints**: 30 requests per minute per IP
- **Scraping endpoints**: 10 requests per minute per IP
- **Stats endpoint**: 60 requests per minute per IP

Rate limit headers are included in responses:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Domain Validation

CORS protection is enforced based on the `NEXT_PUBLIC_APP_URL` environment variable:

- Requests must originate from the configured domain
- Subdomains are automatically allowed (e.g., `api.yourdomain.com`)
- Development mode allows `localhost` and `127.0.0.1`
- Direct API calls (no origin/referer) are allowed in development only

## API Key Authentication

Scraping endpoints can be protected with an API key:

1. Set `API_SECRET_KEY` in your environment variables
2. Include the key in requests: `X-API-Key: your-secret-api-key-here`
3. If no API key is configured, endpoints remain public

## Security Headers

All API responses include security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Access-Control-Allow-Origin: [configured-domain]`

## Monitoring and Logging

All API requests are logged with:

- HTTP method and endpoint
- Client IP address
- Origin/referer information
- Timestamp

Failed security checks are logged as warnings:

- Invalid origin attempts
- Rate limit violations
- Invalid API key attempts

## Production Recommendations

1. **Set NEXT_PUBLIC_APP_URL**: Always configure your production domain
2. **Use API Keys**: Set `API_SECRET_KEY` for scraping endpoint protection
3. **Monitor Logs**: Watch for security violations and unusual patterns
4. **Consider Redis**: For high-traffic applications, replace in-memory rate limiting with Redis
5. **Enable HTTPS**: Ensure all traffic uses HTTPS in production
6. **Database Security**: Use Supabase RLS policies for additional data protection

## Development vs Production

### Development Mode

- Allows requests from `localhost` and `127.0.0.1`
- More permissive CORS policy
- Detailed error messages
- Direct API access allowed

### Production Mode

- Strict domain validation
- Limited error information
- No direct API access without proper origin
- Enhanced security logging

## Troubleshooting

### Common Issues

**403 Forbidden - Invalid Origin**

- Check `NEXT_PUBLIC_APP_URL` is correctly set
- Ensure requests come from the configured domain
- Verify subdomain configuration if needed

**429 Too Many Requests**

- Rate limit exceeded, wait for reset time
- Check `X-RateLimit-Reset` header for reset timestamp
- Consider implementing client-side rate limiting

**401 Unauthorized - Invalid API Key**

- Verify `X-API-Key` header is included
- Check API key matches `API_SECRET_KEY` environment variable
- Ensure API key is required for the endpoint

## Security Updates

This security implementation should be regularly reviewed and updated:

1. Monitor for new security vulnerabilities
2. Update rate limits based on usage patterns
3. Review and rotate API keys regularly
4. Audit security logs for suspicious activity
5. Keep dependencies updated for security patches
