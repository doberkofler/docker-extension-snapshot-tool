import {z} from 'zod';

/**
 * Convert Error to a string.
 *
 * @param error - The error.
 * @returns The string representation.
 */
export const errorToString = (error: unknown) => {
	if (typeof error === 'string') {
		return error;
	} else if (error instanceof Error) {
		const parts = [error.name];
		if (typeof error.message === 'string' && error.message.length > 0) {
			parts.push(error.message);
		}
		if (typeof error.stack === 'string' && error.stack.length > 0) {
			parts.push(error.stack);
		}
		return parts.join('\n');
	} else {
		return JSON.stringify(error);
	}
};

/**
 * Escapes string for use in regular expression.
 * @param String.
 * @returns Escaped string.
 */
export const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Parses date string in format "2025-11-02 22:33:14 +0100 CET"
 * @param input - Docker formatted date.
 * @throws {Error} If string doesn't match expected format or produces invalid date
 */
export const parseDockerDate = (input: string): Date => {
	const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) ([+-]\d{4})/.exec(input);
	if (!match) {
		throw new Error('Invalid date format');
	}

	const [, year, month, day, hour, minute, second, offset] = match;

	// Reconstruct as ISO 8601 with timezone
	const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}${offset.slice(0, 3)}:${offset.slice(3)}`;

	const date = new Date(isoString);
	if (isNaN(date.getTime())) {
		throw new Error('Invalid date values');
	}

	return date;
};

/**
 * Parses datetime string like "2025-11-02 22:33:14 +0100 CET" to Date.
 * @returns zod shape
 * @throws If invalid.
 */
export const zDockerDateTime = z.string().transform((val) => parseDockerDate(val));

/**
 * Sorts an array of objects by a specified string property.
 * @template T - Object type.
 * @param arr - Array to sort.
 * @param key - Key of the string property to sort by.
 * @param ascending - Sort order (default: true).
 * @returns New sorted array.
 * @throws If property value is not string.
 */
export const sortByStringProp = <T extends Record<string, unknown>>(arr: T[], key: keyof T, ascending: boolean = true): T[] => {
	return [...arr].sort((a, b) => {
		const aVal = a[key];
		const bVal = b[key];
		if (typeof aVal !== 'string' || typeof bVal !== 'string') {
			throw new TypeError(`Property '${String(key)}' must be of type string`);
		}
		const cmp = aVal.localeCompare(bVal);
		return ascending ? cmp : -cmp;
	});
};

/**
 * Format a date to a string that can be used in filenames.
 * @param date - Date.
 * @returns String representation in format "YYYYMMDD_HH24MISS".
 */
export const formatDateForFilename = (date: Date): string => {
	const pad = (n: number): string => n.toString().padStart(2, '0');

	const year = date.getFullYear();
	const month = pad(date.getMonth() + 1);
	const day = pad(date.getDate());
	const hour = pad(date.getHours());
	const minute = pad(date.getMinutes());
	const second = pad(date.getSeconds());

	return `${year}${month}${day}_${hour}${minute}${second}`;
};

/**
 * Format a date to a string.
 * @param date - Date.
 * @returns String representation in format "YYYY.MM.DD HH24:MI:SS".
 */
export const formatDate = (date: Date): string => {
	const pad = (n: number): string => n.toString().padStart(2, '0');

	const year = date.getFullYear();
	const month = pad(date.getMonth() + 1);
	const day = pad(date.getDate());
	const hour = pad(date.getHours());
	const minute = pad(date.getMinutes());
	const second = pad(date.getSeconds());

	return `${year}.${month}.${day} ${hour}:${minute}:${second}`;
};
