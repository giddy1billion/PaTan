import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  // Public layout with navigation and footer
  layout("routes/layout.tsx", [
    // Homepage
    index("routes/_index/route.tsx"),

    // Public Profiles
    route("u/:username", "routes/u.$username.tsx"),
    route("stories/:storyId", "routes/stories.$storyId.tsx"),

    // Static Pages
    route("about", "routes/about.tsx"),
    route("guidelines", "routes/guidelines.tsx"),
    route("help", "routes/help.tsx"),
    route("privacy", "routes/privacy.tsx"),
    route("data-deletion", "routes/data-deletion.tsx"),
    route("terms", "routes/terms.tsx"),
    route("accessibility", "routes/accessibility.tsx"),
    
    // SEO Landing Pages
    route("stories-of-hope", "routes/stories-of-hope.tsx"),
    route("gratitude-stories", "routes/gratitude-stories.tsx"),
    route("overcoming-adversity", "routes/overcoming-adversity.tsx"),
    route("stories-of-transformation", "routes/stories-of-transformation.tsx"),
    route("inspirational-testimonies", "routes/inspirational-testimonies.tsx"),
    route("personal-growth-stories", "routes/personal-growth-stories.tsx"),
    route("healing-and-resilience", "routes/healing-and-resilience.tsx"),
  ]),

  // Authenticated application layout
  layout("routes/authenticated-layout.tsx", [
    route("dashboard", "routes/dashboard.tsx"),
    route("profile", "routes/profile.tsx"),
      route("profile/settings", "routes/profile.edit.tsx"),
      route("profile/edit", "routes/profile.redirect.tsx"),
    route("security/auth-audit", "routes/security.auth-audit.tsx"),

    // Discovery & Stories
    route("discover", "routes/discover.tsx"),
    route("stories/new", "routes/stories.new.tsx"),

    // Thematic Journeys
    route("journeys", "routes/journeys/index.tsx"),
    route("journeys/:slug", "routes/journeys.$slug.tsx"),

    // Aspirations
    route("aspirations", "routes/aspirations/index.tsx"),
    route("aspirations/new", "routes/aspirations.new.tsx"),
    route("aspirations/:id", "routes/aspirations.$id.tsx"),

    // Community
    route("community", "routes/community.tsx"),
  ]),
  
  // Auth routes (no nav/footer)
  route("oauth/callback", "routes/auth/oauth.callback.tsx"),
  route("oauth/:provider", "routes/auth/oauth.$provider.tsx"),
  route("auth/verify-email", "routes/auth/verify-email.tsx"),
  route("auth/mfa", "routes/auth/mfa.tsx"),
  route("logout", "routes/auth/logout.tsx"),
  route("login", "routes/auth/login.tsx"),
  route("signup", "routes/auth/signup.tsx"),
  route("forgot-password", "routes/auth/forgot-password.tsx"),
  route("reset-password", "routes/auth/reset-password.tsx"),
  route("onboarding", "routes/onboarding.layout.tsx", [
    route("profile", "routes/onboarding.profile.tsx"),
    route("interests", "routes/onboarding.interests.tsx"),
  ]),
] satisfies RouteConfig;
