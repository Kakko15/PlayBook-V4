import { GOOGLE_CLIENT_ID, DISCORD_CLIENT_ID } from './constants';

/**
 * Build Google OAuth URL
 * @param {string} from - 'login' or 'signup'
 * @returns {string} Google OAuth URL
 */
export const buildGoogleOAuthUrl = (from = 'login') => {
  const redirectUri = encodeURIComponent(
    `${window.location.origin}/auth/callback/google`
  );
  const state = encodeURIComponent(JSON.stringify({ from }));
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=select_account&state=${state}`;
};

/**
 * Build Discord OAuth URL
 * @returns {string} Discord OAuth URL
 */
export const buildDiscordOAuthUrl = (from = 'login') => {
  const redirectUri = encodeURIComponent(
    `${window.location.origin}/auth/callback/discord`
  );
  const state = encodeURIComponent(JSON.stringify({ from }));
  return `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20email&state=${state}`;
};

/**
 * Redirect to Google OAuth
 * @param {string} from - 'login' or 'signup'
 */
export const redirectToGoogleOAuth = (from = 'login') => {
  window.location.href = buildGoogleOAuthUrl(from);
};

/**
 * Redirect to Discord OAuth
 */
export const redirectToDiscordOAuth = () => {
  window.location.href = buildDiscordOAuthUrl();
};
