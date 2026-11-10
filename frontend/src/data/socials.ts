import type { ComponentType } from 'react';
import { GithubIcon, InstagramIcon, LinkedinIcon } from '../components/icons/UiIcons';
import { SITE_CONFIG } from './site';

export type SocialId = 'linkedin' | 'github' | 'instagram';

/**
 * Literal i18n keys (i18next is typed through `CustomTypeOptions`), so `t()`
 * keeps type safety when the key is read from this data.
 */
export type SocialLabelKey = 'social.linkedin' | 'social.github' | 'social.instagram';

export interface SocialLink {
  id: SocialId;
  /** i18n key of the visible name, e.g. `social.linkedin`. */
  labelKey: SocialLabelKey;
  url: string;
  handle: string;
  Icon: ComponentType<{ className?: string }>;
}

/**
 * Single source of truth for the outbound social profiles, shared by the
 * "Links" tile in About and the site footer. The email is intentionally not
 * part of this list: it is not a URL and it has its own copy button.
 */
export const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    id: 'linkedin',
    labelKey: 'social.linkedin',
    url: SITE_CONFIG.linkedinUrl,
    handle: SITE_CONFIG.linkedinHandle,
    Icon: LinkedinIcon,
  },
  {
    id: 'github',
    labelKey: 'social.github',
    url: SITE_CONFIG.githubUrl,
    handle: SITE_CONFIG.githubHandle,
    Icon: GithubIcon,
  },
  {
    id: 'instagram',
    labelKey: 'social.instagram',
    url: SITE_CONFIG.instagramUrl,
    handle: SITE_CONFIG.instagramHandle,
    Icon: InstagramIcon,
  },
];
