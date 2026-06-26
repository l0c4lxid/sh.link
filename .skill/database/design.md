# Database Design: sh.link (sisolo.my.id)

This document defines the MongoDB database design, collections, schemas, and indexing for the link shortener application.

## Collections

### 1. `users`
Stores user authentication details, roles, and profiles.

#### Schema
```json
{
  "_id": "ObjectId",
  "email": "string (unique, lowercase)",
  "passwordHash": "string (SHA-256 hashed password)",
  "role": "string ('admin' | 'user')",
  "name": "string",
  "createdAt": "Date"
}
```

#### Indexes
- `{ email: 1 }` (Unique)

---

### 2. `links`
Stores shortened URL segments, destinations, owners, and click details.

#### Schema
```json
{
  "_id": "ObjectId",
  "slug": "string (unique, lowercase)",
  "dest": "string (full target URL)",
  "domain": "string (default: 'sisolo.my.id')",
  "status": "string ('active' | 'expired')",
  "clicks": "number (total click counter)",
  "createdAt": "Date",
  "userId": "ObjectId | string (reference to users._id, null for system-created links)",
  "clickStats": {
    "total": "number",
    "lastDate": "string (YYYY-MM-DD)",
    "todayCount": "number",
    "history": [
      {
        "date": "string (YYYY-MM-DD)",
        "count": "number"
      }
    ]
  }
}
```

#### Indexes
- `{ slug: 1 }` (Unique)
- `{ userId: 1 }` (For listing user-specific links)
- `{ createdAt: -1 }` (For ordering recent links)
