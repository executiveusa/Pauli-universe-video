# Pauli Universe API Documentation

## Overview

The Pauli Universe API provides endpoints for video generation, gaming, and content creation.

## Base URLs

- **Cinema API**: `https://cinema.pauli-universe.app/api`
- **Game API**: `https://game.pauli-universe.app/api`
- **Engine API**: `https://engine.pauli-universe.app/api`
- **Podcast API**: `https://podcast.pauli-universe.app/api`

## Authentication

All API requests require Bearer token authentication:

```bash
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### Cinema Studio

#### Generate Video

```http
POST /api/generate
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

```json
{
  "characterId": "uuid",
  "prompt": "Cinematic scene prompt with at least 10 characters",
  "duration": 20
}
```

Response (`200`):

```json
{
  "success": true,
  "jobId": "job-uuid",
  "videoUrl": "https://cdn.pauli-universe.com/videos/job-uuid.mp4",
  "status": "processing",
  "udecScore": 0,
  "cost": 0,
  "metadata": {
    "characterId": "uuid",
    "prompt": "Cinematic scene prompt with at least 10 characters",
    "duration": 20
  }
}
```

### Where's Pauli? Game

#### Start Game

```http
POST /api/game/start
Content-Type: application/json

{
  "userId": "string",
  "difficulty": 3
}

Response:
{
  "gameId": "uuid",
  "videoId": "uuid",
  "difficulty": 3,
  "maxHints": 3
}
```

#### Submit Guess

```http
POST /api/game/guess
Content-Type: application/json

{
  "gameId": "uuid",
  "guess": "string"
}

Response:
{
  "correct": true,
  "score": 250,
  "rank": 15
}
```

#### Get Leaderboard

```http
GET /api/game/leaderboard?limit=100

Response:
[
  {
    "rank": 1,
    "username": "player1",
    "score": 5000,
    "difficulty": 9
  }
]
```

### Creator Engine

#### Create Project

```http
POST /api/engine/projects
Content-Type: application/json

{
  "creatorId": "uuid",
  "name": "My Project",
  "description": "string"
}

Response:
{
  "projectId": "uuid",
  "creatorId": "uuid",
  "name": "My Project"
}
```

#### Create Character

```http
POST /api/engine/characters
Content-Type: application/json

{
  "projectId": "uuid",
  "name": "string",
  "description": "string"
}

Response:
{
  "characterId": "uuid",
  "projectId": "uuid",
  "name": "string"
}
```

#### Schedule Episode

```http
POST /api/engine/schedule
Content-Type: application/json

{
  "projectId": "uuid",
  "frequency": "daily|weekly|biweekly|monthly",
  "dayOfWeek": 0
}

Response:
{
  "scheduleId": "uuid",
  "nextRun": "2026-04-15T09:00:00Z"
}
```

### Bigsaws Podcast

#### Generate Episode

```http
POST /api/podcast/generate
Content-Type: application/json

{
  "topic": "string",
  "length": 30,
  "guests": ["string"]
}

Response:
{
  "episodeId": "uuid",
  "audioUrl": "string",
  "duration": 30,
  "transcript": "string"
}
```

#### Get RSS Feed

```http
GET /api/podcast/feed

Response: application/rss+xml
```

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

Common status codes:

- `200`: Success
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `500`: Server error

## Rate Limiting

- **Free tier**: 100 requests/hour
- **Pro tier**: 1000 requests/hour
- **Enterprise**: Unlimited

Headers:

```text
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1702650000
```

## Webhooks

Subscribe to events:

```http
POST /api/webhooks/subscribe
{
  "event": "video.generated|game.completed|order.paid",
  "url": "https://your-domain.com/webhook"
}
```

Webhook payload:

```json
{
  "event": "video.generated",
  "timestamp": "2026-04-15T10:30:00Z",
  "data": { ... }
}
```

## SDKs

- JavaScript/TypeScript: `@pauli/sdk`
- Python: `pauli-universe`
- Go: `pauli-go`

## Support

For API issues, contact: api@pauli-universe.app
