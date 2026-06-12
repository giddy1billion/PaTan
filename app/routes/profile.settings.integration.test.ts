import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/utils/auth.server", () => ({
  requireUser: vi.fn(),
}));

vi.mock("~/utils/db.server", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    userPreference: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { loader as profileSettingsLoader, action as profileSettingsAction } from "~/routes/profile.edit";
import { requireUser } from "~/utils/auth.server";
import { db } from "~/utils/db.server";

function postRequest(url: string, params: Record<string, string>) {
  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
}

describe("Profile settings integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(requireUser).mockResolvedValue({
      id: "user-1",
      email: "user1@example.com",
      provider: "local",
    });

    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: "user-1",
      username: "userone",
      displayName: "User One",
      bio: null,
      country: null,
      city: null,
      pronouns: null,
      profilePhotoUrl: null,
      coverPhotoUrl: null,
      personalInterests: [],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    } as any);
  });

  it("loads profile settings with safe defaults when preference columns are missing", async () => {
    vi.mocked(db.userPreference.findUnique).mockRejectedValue(
      new Error("PrismaClientKnownRequestError P2022: The column does not exist in the current database."),
    );

    const result = await profileSettingsLoader({
      request: new Request("http://localhost/profile/settings"),
      params: {},
      context: {},
    } as any);

    expect((result as any).profile.username).toBe("userone");
    expect((result as any).safety).toEqual({
      anonymousPublishingDefault: false,
      defaultStoryVisibility: "PUBLIC",
      defaultAspirationVisibility: "PUBLIC",
    });
    expect((result as any).visibility).toEqual({
      bio: true,
      location: true,
      pronouns: true,
      interests: true,
      stories: true,
      aspirations: true,
    });
    expect((result as any).notificationSettings).toEqual({
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      digestFrequency: "daily",
    });

    // Paired assertion: loader defaults must be safely consumable by the route component.
    expect(() => {
      const data = result as any;
      const anonymousDefault =
        (data.safety.anonymousPublishingDefault ? "on" : "off") === "on";
      const defaultStoryVisibility =
        data.safety.defaultStoryVisibility === "FOLLOWERS_ONLY"
          ? "FOLLOWERS_ONLY"
          : data.safety.defaultStoryVisibility === "PRIVATE"
            ? "PRIVATE"
            : "PUBLIC";
      const defaultAspirationVisibility =
        data.safety.defaultAspirationVisibility === "FOLLOWERS_ONLY"
          ? "FOLLOWERS_ONLY"
          : data.safety.defaultAspirationVisibility === "PRIVATE"
            ? "PRIVATE"
            : "PUBLIC";
      const publicVisibility = {
        bio: (data.visibility.bio ? "on" : "off") === "on",
        location: (data.visibility.location ? "on" : "off") === "on",
        pronouns: (data.visibility.pronouns ? "on" : "off") === "on",
        interests: (data.visibility.interests ? "on" : "off") === "on",
        stories: (data.visibility.stories ? "on" : "off") === "on",
        aspirations: (data.visibility.aspirations ? "on" : "off") === "on",
      };

      expect(anonymousDefault).toBe(false);
      expect(defaultStoryVisibility).toBe("PUBLIC");
      expect(defaultAspirationVisibility).toBe("PUBLIC");
      expect(publicVisibility).toEqual({
        bio: true,
        location: true,
        pronouns: true,
        interests: true,
        stories: true,
        aspirations: true,
      });
    }).not.toThrow();
  });

  it("renders profile settings when both safety and visibility reads fail in one loader request", async () => {
    vi.mocked(db.userPreference.findUnique)
      .mockRejectedValueOnce(
        new Error("PrismaClientKnownRequestError P2022: The column does not exist in the current database."),
      )
      .mockRejectedValueOnce(
        new Error("PrismaClientKnownRequestError P2021: The table does not exist in the current database."),
      );

    const result = await profileSettingsLoader({
      request: new Request("http://localhost/profile/settings"),
      params: {},
      context: {},
    } as any);

    expect(db.user.findUnique).toHaveBeenCalledTimes(1);
    expect(db.userPreference.findUnique).toHaveBeenCalledTimes(3);
    expect((result as any).profile.username).toBe("userone");
    expect((result as any).safety).toEqual({
      anonymousPublishingDefault: false,
      defaultStoryVisibility: "PUBLIC",
      defaultAspirationVisibility: "PUBLIC",
    });
    expect((result as any).visibility).toEqual({
      bio: true,
      location: true,
      pronouns: true,
      interests: true,
      stories: true,
      aspirations: true,
    });
    expect((result as any).notificationSettings).toEqual({
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      digestFrequency: "daily",
    });
  });

  it("saves profile even during preference schema compatibility errors", async () => {
    vi.mocked(db.user.update).mockResolvedValue({
      id: "user-1",
      username: "userone",
      bio: "Updated bio",
      country: "Kenya",
      city: "Nairobi",
      pronouns: "they/them",
      profilePhotoUrl: null,
      coverPhotoUrl: null,
      personalInterests: ["Gratitude"],
      updatedAt: new Date("2026-06-12T00:00:00.000Z"),
    } as any);

    vi.mocked(db.userPreference.findUnique).mockRejectedValue(
      new Error("PrismaClientKnownRequestError P2021: The table does not exist in the current database."),
    );
    vi.mocked(db.userPreference.upsert).mockRejectedValue(
      new Error("PrismaClientKnownRequestError P2022: The column does not exist in the current database."),
    );

    const request = postRequest("http://localhost/profile/settings", {
      bio: "Updated bio",
      country: "Kenya",
      city: "Nairobi",
      pronouns: "they/them",
      profilePhotoUrl: "",
      coverPhotoUrl: "",
      interests: "Gratitude",
      anonymousPublishingDefault: "on",
      defaultStoryVisibility: "PUBLIC",
      defaultAspirationVisibility: "PUBLIC",
      showBio: "on",
      showLocation: "on",
      showPronouns: "on",
      showInterests: "on",
      showStories: "on",
      showAspirations: "on",
    });

    const result = await profileSettingsAction({
      request,
      params: {},
      context: {},
    } as any);

    expect(db.user.update).toHaveBeenCalled();
    expect(result).toEqual({ success: "Profile updated successfully." });
  });
});
