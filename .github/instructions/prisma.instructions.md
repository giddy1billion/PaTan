---
applyTo: "**/*.prisma,**/prisma/**"
description: "Prisma conventions for PaTan™: schema design, relations, naming, indexes"
---

# Prisma Conventions for PaTan™

## Writing Compliance

- Never use em dash or en dash punctuation in generated content.
- Use commas, periods, parentheses, or a colon instead.
- Apply this rule to schema docs, code comments, and developer guidance.

## Naming

- **Models**: PascalCase singular (`User`, `Story`, `Aspiration`)
- **Fields**: camelCase (`createdAt`, `userId`)
- **Database columns**: snake_case via `@map` (`created_at`, `user_id`)
- **Tables**: snake_case plural via `@@map` (`users`, `stories`)
- **Enums**: PascalCase with SCREAMING_SNAKE values

```prisma
model Story {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now()) @map("created_at")

  @@map("stories")
}

enum StoryStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

## ID Strategy

Use `cuid()` for all primary keys: URL-safe, sortable, no collisions:

```prisma
id String @id @default(cuid())
```

## Relations

Always define both sides explicitly with clear relation names:

```prisma
model User {
  id       String   @id @default(cuid())
  stories  Story[]  @relation("AuthorStories")
  savedStories Story[] @relation("SavedStories")
}

model Story {
  id       String @id @default(cuid())
  author   User   @relation("AuthorStories", fields: [authorId], references: [id])
  authorId String @map("author_id")
  savedBy  User[] @relation("SavedStories")
}
```

## Indexes

Add indexes for:

- Foreign keys (Prisma adds automatically)
- Frequently filtered fields
- Composite queries

```prisma
model Story {
  // ... fields

  @@index([status, createdAt(sort: Desc)])
  @@index([categoryId])
}
```

## Soft Deletes

Use `deletedAt` pattern for user content:

```prisma
model Story {
  deletedAt DateTime? @map("deleted_at")

  @@index([deletedAt])
}
```

## Timestamps

Always include audit timestamps:

```prisma
createdAt DateTime @default(now()) @map("created_at")
updatedAt DateTime @updatedAt @map("updated_at")
```

## PaTan™ Core Models

Reference these domain entities:

- `User`: accounts with profiles, preferences
- `Story`: testimonies with categories, tags, media
- `Aspiration`: goals/requests with status tracking
- `Engagement`: celebrate, uplift, empathy reactions
- `Comment`: threaded discussions
- `Collection`: curated story groups
- `ModerationReport`: flagged content tracking

## Enums for PaTan™

```prisma
enum StoryCategory {
  GRATITUDE
  INSPIRATION
  TRANSFORMATION
  HOPE_AND_FAITH
  HEALTH_AND_WELLNESS
  PROFESSIONAL_GROWTH
  RELATIONSHIPS
  SOCIAL_IMPACT
  OVERCOMING_ADVERSITY
  PERSONAL_TRIUMPH
  OTHER
}

enum EngagementType {
  CELEBRATE
  UPLIFT
  EMPATHY
}

enum AspirationStatus {
  PENDING
  IN_PROGRESS
  ACHIEVED
  GRANTED
  TRANSFORMED
}

enum PrivacyLevel {
  PUBLIC
  FOLLOWERS_ONLY
  PRIVATE
  ANONYMOUS
}
```
