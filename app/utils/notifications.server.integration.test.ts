import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/utils/db.server", () => ({
  db: {
    user: {
      findMany: vi.fn(),
    },
    userPreference: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

import {
  createMentionNotifications,
  createNotification,
} from "~/utils/notifications.server";
import { db } from "~/utils/db.server";

describe("Notification delivery preference gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.notification.create).mockResolvedValue({
      id: "notif-1",
      userId: "user-1",
      actorId: "actor-1",
    } as any);
    vi.mocked(db.notification.createMany).mockResolvedValue({ count: 2 } as any);
  });

  it("defers immediate email to digest for digest-eligible email types when digest is not realtime", async () => {
    vi.mocked(db.userPreference.findMany).mockResolvedValue([
      {
        userId: "user-1",
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        digestFrequency: "daily",
      },
    ] as any);

    await createNotification({
      userId: "user-1",
      actorId: "actor-1",
      type: "COMMUNITY_UPDATE",
      title: "Community update",
      body: "There is a new community update.",
      resourceId: "resource-1",
      resourceType: "report",
    });

    expect(db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "COMMUNITY_UPDATE",
          data: expect.objectContaining({
            delivery: expect.objectContaining({
              inApp: true,
              emailEligible: false,
              pushEligible: true,
              smsEligible: false,
              digestFrequency: "daily",
              emailDeferredToDigest: true,
            }),
          }),
        }),
      }),
    );
  });

  it("respects disabled push toggle and keeps in-app delivery", async () => {
    vi.mocked(db.userPreference.findMany).mockResolvedValue([
      {
        userId: "user-2",
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: false,
        digestFrequency: "realtime",
      },
    ] as any);

    await createNotification({
      userId: "user-2",
      actorId: "actor-2",
      type: "MESSAGE",
      title: "New message",
      body: "You received a message.",
      resourceId: "actor-2",
      resourceType: "message",
    });

    expect(db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "MESSAGE",
          data: expect.objectContaining({
            delivery: expect.objectContaining({
              inApp: true,
              emailEligible: true,
              pushEligible: false,
              smsEligible: false,
              digestFrequency: "realtime",
              emailDeferredToDigest: false,
            }),
          }),
        }),
      }),
    );
  });

  it("applies per-recipient preference gates for mention notifications", async () => {
    vi.mocked(db.userPreference.findMany).mockResolvedValue([
      {
        userId: "user-a",
        emailNotifications: false,
        pushNotifications: true,
        smsNotifications: false,
        digestFrequency: "daily",
      },
      {
        userId: "user-b",
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: false,
        digestFrequency: "realtime",
      },
    ] as any);

    await createMentionNotifications({
      mentionedUserIds: ["user-a", "user-b"],
      actorId: "actor-3",
      title: "You were mentioned",
      body: "Mention body",
      resourceId: "story-1",
      resourceType: "story",
    });

    expect(db.notification.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: "user-a",
            type: "MENTION",
            data: expect.objectContaining({
              delivery: expect.objectContaining({
                emailEligible: false,
                pushEligible: true,
              }),
            }),
          }),
          expect.objectContaining({
            userId: "user-b",
            type: "MENTION",
            data: expect.objectContaining({
              delivery: expect.objectContaining({
                emailEligible: true,
                pushEligible: false,
              }),
            }),
          }),
        ]),
      }),
    );
  });
});
