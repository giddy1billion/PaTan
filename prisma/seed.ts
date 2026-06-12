/**
 * PaTan™ Database Seed Script
 * Seeds initial data for categories, badges, and essential content
 */

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  // ============================================================================
  // SEED CATEGORIES
  // ============================================================================
  console.log("📂 Creating categories...");

  const categories = [
    {
      name: "Gratitude",
      slug: "gratitude",
      description: "Stories expressing thankfulness and appreciation for life's blessings",
      color: "#F59E0B",
      orderIndex: 1,
    },
    {
      name: "Inspiration",
      slug: "inspiration",
      description: "Uplifting stories that motivate and encourage others",
      color: "#8B5CF6",
      orderIndex: 2,
    },
    {
      name: "Transformation",
      slug: "transformation",
      description: "Personal journeys of growth and positive change",
      color: "#10B981",
      orderIndex: 3,
    },
    {
      name: "Hope and Faith",
      slug: "hope-and-faith",
      description: "Stories of spiritual growth, faith journeys, and finding hope",
      color: "#3B82F6",
      orderIndex: 4,
    },
    {
      name: "Health and Wellness",
      slug: "health-and-wellness",
      description: "Stories about physical, mental, and emotional healing",
      color: "#EC4899",
      orderIndex: 5,
    },
    {
      name: "Professional Growth",
      slug: "professional-growth",
      description: "Career development, entrepreneurship, and work-life lessons",
      color: "#6366F1",
      orderIndex: 6,
    },
    {
      name: "Relationships",
      slug: "relationships",
      description: "Stories about love, family, friendship, and human connection",
      color: "#EF4444",
      orderIndex: 7,
    },
    {
      name: "Social Impact",
      slug: "social-impact",
      description: "Community service, activism, and making a difference",
      color: "#14B8A6",
      orderIndex: 8,
    },
    {
      name: "Overcoming Adversity",
      slug: "overcoming-adversity",
      description: "Stories of resilience, perseverance, and triumph over challenges",
      color: "#F97316",
      orderIndex: 9,
    },
    {
      name: "Personal Triumph",
      slug: "personal-triumph",
      description: "Celebrating achievements and personal victories",
      color: "#84CC16",
      orderIndex: 10,
    },
    {
      name: "Other",
      slug: "other",
      description: "Stories that don't fit into other categories",
      color: "#6B7280",
      orderIndex: 99,
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }
  console.log(`   ✅ Created ${categories.length} categories\n`);

  // ============================================================================
  // SEED BADGES
  // ============================================================================
  console.log("🏆 Creating badges...");

  const badges = [
    {
      name: "Trusted Storyteller",
      slug: "trusted-storyteller",
      description: "Awarded to users who consistently share authentic, uplifting stories that inspire the community",
      iconUrl: "/badges/trusted-storyteller.svg",
      type: "STORYTELLER" as const,
      criteria: { storiesPublished: 10, averageRating: 4.5 },
      points: 100,
    },
    {
      name: "Hope Catalyst",
      slug: "hope-catalyst",
      description: "Recognized for spreading hope through meaningful engagement and supportive interactions",
      iconUrl: "/badges/hope-catalyst.svg",
      type: "HOPE_CATALYST" as const,
      criteria: { upliftsGiven: 50, empathyReactionsGiven: 100 },
      points: 75,
    },
    {
      name: "Community Encourager",
      slug: "community-encourager",
      description: "Celebrated for building connections and encouraging others in their journeys",
      iconUrl: "/badges/community-encourager.svg",
      type: "COMMUNITY_ENCOURAGER" as const,
      criteria: { commentsGiven: 100, supportGiven: 50 },
      points: 80,
    },
    {
      name: "Transformation Guide",
      slug: "transformation-guide",
      description: "Honored for sharing powerful transformation stories that guide others",
      iconUrl: "/badges/transformation-guide.svg",
      type: "TRANSFORMATION_GUIDE" as const,
      criteria: { transformationStoriesPublished: 5, impactScore: 500 },
      points: 150,
    },
    {
      name: "Trusted Contributor",
      slug: "trusted-contributor",
      description: "Recognized as a trusted member who contributes positively to the community",
      iconUrl: "/badges/trusted-contributor.svg",
      type: "TRUSTED_CONTRIBUTOR" as const,
      criteria: { accountAge: 90, positiveInteractions: 200 },
      points: 200,
    },
    {
      name: "First Story",
      slug: "first-story",
      description: "Welcome badge for publishing your first story on PaTan™",
      iconUrl: "/badges/first-story.svg",
      type: "MILESTONE" as const,
      criteria: { storiesPublished: 1 },
      points: 10,
    },
    {
      name: "Story Streak",
      slug: "story-streak",
      description: "Awarded for maintaining a consistent storytelling habit",
      iconUrl: "/badges/story-streak.svg",
      type: "MILESTONE" as const,
      criteria: { consecutiveWeeksActive: 4 },
      points: 50,
    },
    {
      name: "Gratitude Champion",
      slug: "gratitude-champion",
      description: "For those who lead with gratitude in their stories and reflections",
      iconUrl: "/badges/gratitude-champion.svg",
      type: "MILESTONE" as const,
      criteria: { gratitudeStoriesPublished: 10 },
      points: 60,
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: badge,
      create: badge,
    });
  }
  console.log(`   ✅ Created ${badges.length} badges\n`);

  // ============================================================================
  // SEED TAGS
  // ============================================================================
  console.log("🏷️  Creating initial tags...");

  const tags = [
    "hope",
    "faith",
    "gratitude",
    "healing",
    "resilience",
    "transformation",
    "family",
    "love",
    "forgiveness",
    "courage",
    "growth",
    "inspiration",
    "testimony",
    "overcoming",
    "blessing",
    "miracle",
    "journey",
    "reflection",
    "wisdom",
    "peace",
    "joy",
    "strength",
    "perseverance",
    "community",
    "support",
  ];

  for (const tagName of tags) {
    await prisma.tag.upsert({
      where: { slug: tagName },
      update: { name: tagName, slug: tagName },
      create: { name: tagName, slug: tagName },
    });
  }
  console.log(`   ✅ Created ${tags.length} tags\n`);

  console.log("✨ Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
