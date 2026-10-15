/**
 * utils/helpers.js
 * Shared pure utility functions.
 */

/**
 * Format a Date object (or ISO string) to a human-readable string.
 * @param {Date|string} date
 * @param {Intl.DateTimeFormatOptions} [options]
 */
export const formatDate = (date, options = { dateStyle: 'medium' }) => {
  return new Intl.DateTimeFormat('en-IN', options).format(new Date(date));
};

/**
 * Capitalise the first letter of a string.
 */
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

/**
 * Truncate a string to a max length, appending "…".
 */
export const truncate = (str, maxLength = 100) =>
  str && str.length > maxLength ? str.slice(0, maxLength) + '…' : str;

/**
 * Generate a simple class name string, filtering falsy values.
 * Usage: cn('base-class', isActive && 'active', someClass)
 */
export const cn = (...classes) => classes.filter(Boolean).join(' ');

/**
 * Debounce a function.
 */
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Sleep for ms milliseconds (useful in async functions / testing).
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get initials from a full name.
 * "John Doe" → "JD"
 */
export const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0].toUpperCase())
    .slice(0, 2)
    .join('');
