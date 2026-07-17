/**
 * Consistent member name display across VANTORIS.
 *
 * Priority:  preferred_name  →  full_name  →  'Member'
 * Never show email addresses or usernames as a member's display name.
 */

/**
 * Returns the best display name for a user object.
 * @param {object|null} user - Base44 user object
 * @param {'full'|'first'} [format='full'] - 'full' returns the whole name, 'first' returns just the first word
 */
export function getMemberDisplayName(user, format = 'full') {
  if (!user) return 'Member';

  const preferred = typeof user.preferred_name === 'string' ? user.preferred_name.trim() : '';
  const full = typeof user.full_name === 'string' ? user.full_name.trim() : '';

  const name = preferred || full || 'Member';

  if (format === 'first') {
    return name.split(/\s+/)[0] || 'Member';
  }

  return name;
}

/**
 * Returns the time-appropriate greeting string.
 */
export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
