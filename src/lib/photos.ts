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
 * Hero background photo — deliberately NOT set.
 *
 * A licensed glass-facade photo was added, rendered and measured, then removed
 * again. It made the hero worse, for four reasons:
 *   - the free source served a 960x636 preview (not the 4164px the metadata
 *     promised), so it was upscaled ~1.5x on a 1425px-wide render and looked soft;
 *   - with enough dark overlay to keep the headline readable, the photo was
 *     invisible on desktop — the hero looked like the plain backdrop it replaced;
 *   - on a 390px viewport, `object-fit: cover` cropped ~66% of its width, leaving
 *     anonymous diagonal lines with no readable "glazing" meaning;
 *   - as a generic architecture shot it read as stock, i.e. more generic than the
 *     branded drawn elevation used instead.
 *
 * Set this to a licensed high-resolution photo (>= 2400px wide, landscape) to
 * switch the hero over; the drawn facade is used whenever it is null.
 */
export const HERO_PHOTO: LicensedPhoto | null = null;

/** Rendered in the footer so attribution stays visible wherever a photo is used. */
export const PHOTO_CREDITS: LicensedPhoto[] = HERO_PHOTO ? [HERO_PHOTO] : [];
