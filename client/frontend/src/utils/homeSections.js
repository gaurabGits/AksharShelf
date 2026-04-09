export const HOME_SECTIONS = {
  hero: "home-hero",
  features: "home-features",
  upcoming: "home-upcoming",
  freeBooks: "home-free-books",
  cta: "home-cta",
};

export function getHomeSectionHref(sectionId) {
  return `/#${sectionId}`;
}
