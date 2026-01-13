# n8n Automation Setup Guide

This document provides step-by-step instructions for setting up n8n automation workflows to handle repository ingestion and enrichment.

## Overview

The automation system consists of:

1. **Repository Ingestion** - Runs every 1 hour to process new repositories
2. **Repository Enrichment** - Runs every 5 minutes to enrich repositories with AI-generated content
3. **Health Monitoring** - Endpoint for monitoring system health
4. **Status Tracking** - Endpoint for tracking automation progress

## API Endpoints

All automation endpoints require an API key (`X-API-Key` header) and are located at:

Base URL: `https://yourdomain.com/api/automation/`

### 1. Health Check

- **Endpoint**: `GET /api/automation/health`
- **Purpose**: Check system health and configuration
- **Headers**: `X-API-Key: your-api-key`

### 2. Status Check

- **Endpoint**: `GET /api/automation/status`
- **Purpose**: Get current automation statistics
- **Headers**: `X-API-Key: your-api-key`

### 3. Repository Ingestion

- **Endpoint**: `POST /api/automation/ingest`
- **Purpose**: Process repositories that need ingestion
- **Headers**: `X-API-Key: your-api-key`
- **Schedule**: Every 1 hour

### 4. Repository Enrichment

- **Endpoint**: `POST /api/automation/enrich`
- **Purpose**: Enrich repositories with AI-generated content
- **Headers**: `X-API-Key: your-api-key`
- **Schedule**: Every 5 minutes

## n8n Workflow Configurations

### Workflow 1: Repository Ingestion (Hourly)

```json
{
  "name": "Repository Ingestion - Hourly",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours",
              "hoursInterval": 1
            }
          ]
        }
      },
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "url": "https://yourdomain.com/api/automation/ingest",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-API-Key",
              "value": "={{$credentials.apiKey}}"
            }
          ]
        },
        "options": {
          "timeout": 300000
        }
      },
      "name": "Trigger Ingestion",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [460, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$json.success}}",
              "value2": true
            }
          ]
        }
      },
      "name": "Check Success",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [680, 300]
    },
    {
      "parameters": {
        "message": "✅ Repository ingestion completed successfully!\n\nProcessed: {{$json.processed}}\nErrors: {{$json.errors}}\nTimestamp: {{$json.timestamp}}"
      },
      "name": "Success Notification",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [900, 200]
    },
    {
      "parameters": {
        "message": "❌ Repository ingestion failed!\n\nError: {{$json.error}}\nTimestamp: {{$json.timestamp}}"
      },
      "name": "Error Notification",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [900, 400]
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [
        [
          {
            "node": "Trigger Ingestion",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Trigger Ingestion": {
      "main": [
        [
          {
            "node": "Check Success",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Check Success": {
      "main": [
        [
          {
            "node": "Success Notification",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Error Notification",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### Workflow 2: Repository Enrichment (Every 5 minutes)

```json
{
  "name": "Repository Enrichment - 5min",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "minutes",
              "minutesInterval": 5
            }
          ]
        }
      },
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "url": "https://yourdomain.com/api/automation/status",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-API-Key",
              "value": "={{$credentials.apiKey}}"
            }
          ]
        }
      },
      "name": "Check Status",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [460, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$json.nextActions.shouldRunEnrichment}}",
              "value2": true
            }
          ]
        }
      },
      "name": "Should Run Enrichment?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [680, 300]
    },
    {
      "parameters": {
        "url": "https://yourdomain.com/api/automation/enrich",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-API-Key",
              "value": "={{$credentials.apiKey}}"
            }
          ]
        },
        "options": {
          "timeout": 300000
        }
      },
      "name": "Trigger Enrichment",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [900, 200]
    },
    {
      "parameters": {
        "message": "ℹ️ No repositories need enrichment at this time."
      },
      "name": "Skip Notification",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [900, 400]
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [
        [
          {
            "node": "Check Status",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Check Status": {
      "main": [
        [
          {
            "node": "Should Run Enrichment?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Should Run Enrichment?": {
      "main": [
        [
          {
            "node": "Trigger Enrichment",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Skip Notification",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### Workflow 3: Health Monitoring (Every 15 minutes)

```json
{
  "name": "Health Monitor - 15min",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "minutes",
              "minutesInterval": 15
            }
          ]
        }
      },
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "url": "https://yourdomain.com/api/automation/health",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-API-Key",
              "value": "={{$credentials.apiKey}}"
            }
          ]
        }
      },
      "name": "Health Check",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [460, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.status}}",
              "value2": "healthy"
            }
          ]
        }
      },
      "name": "Is Healthy?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [680, 300]
    },
    {
      "parameters": {
        "message": "🚨 System health check failed!\n\nStatus: {{$json.status}}\nError: {{$json.error}}\nMissing env vars: {{$json.environment.missingEnvVars}}"
      },
      "name": "Alert Notification",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [900, 400]
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [
        [
          {
            "node": "Health Check",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Health Check": {
      "main": [
        [
          {
            "node": "Is Healthy?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Is Healthy?": {
      "main": [
        [],
        [
          {
            "node": "Alert Notification",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## Setup Instructions

### 1. Create API Key Credential in n8n

1. Go to n8n credentials section
2. Create a new credential of type "Generic Credential"
3. Name it "Spy API Key"
4. Add field: `apiKey` with your `API_SECRET_KEY` value

### 2. Import Workflows

1. Copy each workflow JSON above
2. In n8n, go to Workflows
3. Click "Import from JSON"
4. Paste the workflow JSON
5. Update the domain URL in HTTP Request nodes
6. Set the credential to "Spy API Key"
7. Activate the workflow

### 3. Environment Variables

Ensure these environment variables are set in your application:

```bash
# Required for automation
API_SECRET_KEY=your-secret-api-key-here
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Database connection
SUPABASE_DATABASE_HOST=your-host
SUPABASE_DATABASE_NAME=postgres
SUPABASE_DATABASE_USER=your-user
SUPABASE_DATABASE_PASSWORD=your-password
SUPABASE_DATABASE_PORT=5432

# External APIs
GITHUB_TOKEN=your-github-token
OPENAI_API_KEY=your-openai-key
OPENAI_API_URL=https://api.upstage.ai/v1/chat/completions
OPENAI_API_MODEL=solar-mini
```

### 4. Testing

Test each endpoint manually first:

```bash
# Health check
curl -X GET "https://yourdomain.com/api/automation/health" \
  -H "X-API-Key: your-api-key"

# Status check
curl -X GET "https://yourdomain.com/api/automation/status" \
  -H "X-API-Key: your-api-key"

# Test ingestion
curl -X POST "https://yourdomain.com/api/automation/ingest" \
  -H "X-API-Key: your-api-key"

# Test enrichment
curl -X POST "https://yourdomain.com/api/automation/enrich" \
  -H "X-API-Key: your-api-key"
```

## Monitoring and Troubleshooting

### Common Issues

1. **API Key Authentication Failed**

   - Verify `API_SECRET_KEY` is set in environment
   - Check n8n credential configuration
   - Ensure `X-API-Key` header is included

2. **Database Connection Failed**

   - Verify all `SUPABASE_DATABASE_*` variables are set
   - Test database connectivity

3. **GitHub Rate Limit**

   - Ensure `GITHUB_TOKEN` is set for higher limits
   - Monitor GitHub API usage

4. **OpenAI/Upstage API Errors**
   - Verify `OPENAI_API_KEY` is valid
   - Check API quota and billing
   - Monitor rate limits

### Logs

Check application logs for detailed error information:

- Ingestion logs: Look for "Repository ingestion" messages
- Enrichment logs: Look for "Repository enrichment" messages
- API errors: Check for HTTP error codes and messages

### Performance

- **Ingestion**: Processes ~20 repositories per hour (3-second delays)
- **Enrichment**: Processes ~12 repositories per hour (5-minute intervals)
- **Rate Limits**: Respects GitHub (60/hour) and OpenAI limits

## Scaling Considerations

For high-volume processing:

1. **Increase API Limits**: Use GitHub Apps or OpenAI paid tiers
2. **Parallel Processing**: Modify scripts to process multiple repositories concurrently
3. **Queue System**: Implement Redis-based job queues
4. **Database Optimization**: Add indexes for automation queries
5. **Monitoring**: Add detailed metrics and alerting
