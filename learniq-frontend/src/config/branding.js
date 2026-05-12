import primaryFullLogo from '../assets/branding/logos/primary-full-logo.png';
import standaloneIcon from '../assets/branding/logos/standalone-icon.png';
import navbarLogo from '../assets/branding/logos/navbar-logo.png';
import monochromeDark from '../assets/branding/logos/monochrome-dark.png';
import transparentLogo from '../assets/branding/logos/transparent-logo.png';
import logoVector from '../assets/branding/logos/logo-vector.svg';

import favicon16 from '../assets/branding/favicons/favicon-16x16.png';
import favicon32 from '../assets/branding/favicons/favicon-32x32.png';

import appSplash from '../assets/branding/splash/app-splash.png';
import appIcon from '../assets/branding/splash/app-icon.png';

import brandWallpaper from '../assets/branding/wallpapers/brand-wallpaper.png';

import socialPreviewBanner from '../assets/branding/social/social-preview-banner.png';

export const BRANDING = {
  logos: {
    primary: primaryFullLogo,
    icon: standaloneIcon,
    navbar: navbarLogo,
    monochrome: monochromeDark,
    transparent: transparentLogo,
    vector: logoVector
  },
  favicons: {
    small: favicon16,
    large: favicon32
  },
  splash: {
    bg: appSplash,
    icon: appIcon
  },
  wallpapers: {
    main: brandWallpaper
  },
  social: {
    banner: socialPreviewBanner
  }
};
