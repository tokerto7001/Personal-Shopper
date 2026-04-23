# Personal Shopper

An AI-powered personal shopping assistant built with a multi-agent architecture. Users converse naturally to find products — the system extracts their intent, queries a vector database, and returns only genuinely relevant results.

## Architecture

The system is composed of four specialized agents that collaborate on every request:

```
User Request
     │
     ▼
┌─────────────────┐
│   Orchestrator  │  Decides: reply directly, or route to intent pipeline?
└────────┬────────┘
         │ shopping intent detected
         ▼
┌─────────────────────┐
│  Intent Recognizer  │  Extracts filters (color, size, price) + search query
└──────────┬──────────┘
           │ needs clarification?
           ├──── yes ──► ask user, save session, return
           │
           │ no
           ▼
┌──────────────────────────┐
│  Qdrant Vector Search    │  Semantic search + structured filter matching
└────────────┬─────────────┘
             ▼
┌─────────────────────┐
│  Products Reviewer  │  Filters out false positives — only returns truly relevant products
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Memorization Agent │  Summarizes + persists conversation to Redis
└─────────────────────┘
```

### Agents

| Agent | Model | Responsibility |
|---|---|---|
| **Orchestrator** | gpt-4o-mini | Routes between direct reply and shopping pipeline |
| **Intent Recognizer** | gpt-4o-mini | Extracts structured filters and a semantic search query from conversation |
| **Products Reviewer** | gpt-4o-mini | Cross-checks vector search results against user intent, removes false positives |
| **Memorization Agent** | gpt-4o-mini | Compresses message history into a dense summary when it exceeds 8 messages |

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **API Server:** Express 5
- **AI:** OpenAI API (`gpt-4o-mini` for agents, `text-embedding-3-small` for embeddings)
- **Vector DB:** Qdrant (semantic product search, cosine similarity, score threshold 0.40)
- **Session Store:** Redis (30-day TTL, keyed by session UUID)

## Project Structure

```
.
├── index.ts                  # Express server entry point
├── types.d.ts                # Shared TypeScript interfaces
├── products.json             # Product catalog (seed data)
├── ai/
│   ├── index.ts              # OpenAI client (createChatCompletion, createEmbedding)
│   └── agents/
│       ├── prompts.ts        # All system prompts
│       ├── orchestrator.ts   # Main agent + session management
│       ├── intentRecognizer.ts
│       ├── productsReviewer.ts
│       └── memory.ts         # Memorization / context summarization agent
├── db/
│   ├── qdrant.ts             # Qdrant client, collection setup, vector search
│   └── redis.ts              # Redis client, session get/set
└── scripts/
    └── insertProducts.ts     # One-time script to embed and upsert products into Qdrant
```

## Prerequisites

- Node.js 18+
- A running [Qdrant](https://qdrant.tech/) instance
- A running [Redis](https://redis.io/) instance
- An OpenAI API key

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create a `.env` file in the project root:

   ```env
   OPENAI_API_KEY=your_openai_api_key
   QDRANT_URL=http://localhost:6333
   REDIS_URL=redis://localhost:6379
   PORT=8000
   ```

3. **Seed the vector database**

   This embeds every product in `products.json` and upserts them into Qdrant. Run once (or after updating the product catalog):

   ```bash
   npm run insert-products
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

   The server starts on `http://localhost:8000`.

## API

### `GET /`

Send a message to the personal shopper.

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `question` | string | Yes | The user's message |
| `sessionId` | string | No | Session UUID from a previous response. Omit to start a new session. |

**Response — direct reply (non-shopping intent)**

```json
{
  "message": "I can only help you with your shopping experience.",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response — products found**

```json
{
  "products": [
    {
      "id": 12,
      "title": "Classic White Sneakers",
      "description": "...",
      "category": "mens_shoes",
      "color": "white",
      "price": 89.99,
      "size": "42",
      "tags": ["casual", "summer"],
      "image": "..."
    }
  ],
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response — clarification needed**

```json
{
  "message": "What size and color are you looking for?",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Pass the returned `sessionId` in subsequent requests to continue the conversation in the same session.

## Product Filters

The Intent Recognizer can extract the following filters from natural language:

| Filter | Type | Example values |
|---|---|---|
| `color` | `string[]` | `black`, `white`, `navy`, `red`, `multicolor` ... |
| `size` | `string[]` | `M`, `L`, `XL`, `42`, `10` ... |
| `price` | `number[]` | `[0, 100]` (min, max range) |

Filters are optional — users can search without specifying any. Multiple values per filter are supported (e.g. "blue or black").

## Session Management

Each conversation is identified by a `sessionId` (UUID). Sessions are stored in Redis with a 30-day TTL.

When a session's message history exceeds 8 messages, the Memorization Agent summarizes the conversation into a compact context string. This keeps the prompt size bounded while preserving relevant shopping context (preferences, filters, decisions) across long conversations.

## Scripts

| Script | Command | Description |
|---|---|---|
| Start dev server | `npm run dev` | Runs `ts-node-dev index.ts` with hot reload |
| Seed products | `npm run insert-products` | Embeds and upserts `products.json` into Qdrant |
