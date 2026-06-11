import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  // Main layout with navigation and footer
  layout("routes/layout.tsx", [
    // Homepage
    index("routes/_index/route.tsx"),
    
    // Discovery & Stories
    route("discover", "routes/discover.tsx"),
    route("stories/:storyId", "routes/stories.$storyId.tsx"),
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
    
    // Static Pages
    route("about", "routes/about.tsx"),
    route("guidelines", "routes/guidelines.tsx"),
    route("help", "routes/help.tsx"),
    route("privacy", "routes/privacy.tsx"),
    route("terms", "routes/terms.tsx"),
    route("accessibility", "routes/accessibility.tsx"),
  ]),
  
  // Auth routes (no nav/footer)
  route("login", "routes/auth/login.tsx"),
  route("signup", "routes/auth/signup.tsx"),
  route("forgot-password", "routes/auth/forgot-password.tsx"),
] satisfies RouteConfig;
