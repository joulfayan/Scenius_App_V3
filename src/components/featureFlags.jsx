
// In a real application, this would be powered by a feature flag service (e.g., LaunchDarkly, PostHog).
// For this simulation, you can manually toggle the flag to test the new functionality.

export const featureFlags = {
  catalog_v1: true, // SET TO `true` TO SEE THE NEW CATALOG FEATURE, `false` TO HIDE IT
  dnd: true, // Enables the new shared drag-and-drop foundation
};
