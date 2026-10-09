/**
 * Licensed photography used as illustration.
 *
 * These are NOT photographs of Betta Plast's own work and must never be
 * presented as such. They are decorative/illustrative only, which is why the
 * "Наши работы" gallery still requires the owner's real photos.
 *
 * Every entry keeps its author, licence and source so attribution can be shown
 * and the asset can be swapped or removed in one place.
 */
export type LicensedPhoto = {
  /** Path under /public. */
  file: string;
  /** Honest alt text — describes the image, never claims it is our project. */
  alt: string;
  title: string;
  creator: string;
  licence: string;
  licenceUrl: string;
  source: string;
};

/**
 * Hero background. Free CC sources produced mostly unusable snapshots for this
 * project (see docs/AUDIT.md); this is the one image that survived review:
 * a modern glass facade, no third-party branding, no people.
 */
export const HERO_PHOTO: LicensedPhoto = {
  file: '/photos/hero.jpg',
  alt: 'Фасад современного здания со стеклянным остеклением',
  title: 'Building windows',
  creator: 'Scott Webb',
  licence: 'CC0 1.0',
  licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
  source: 'https://stocksnap.io/photo/building-windows-DBVYE3XXNS',
};

/** Rendered in the footer so attribution stays visible wherever a photo is used. */
export const PHOTO_CREDITS: LicensedPhoto[] = [HERO_PHOTO];
