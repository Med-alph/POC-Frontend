/**
 * Get a time-accurate greeting
 * @returns {string} One of: 'Good Morning', 'Good Noon', 'Good Afternoon', 'Good Evening'
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour === 12) return 'Good Noon';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};
