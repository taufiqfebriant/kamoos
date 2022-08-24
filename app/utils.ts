import type { User } from '@prisma/client';
import { useMatches } from '@remix-run/react';
import { customAlphabet } from 'nanoid';
import { useMemo } from 'react';

export const customNanoId = customAlphabet(
	'0123456789abcdefghijklmnopqrstuvwxyz',
	20
);

/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} id The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(
	id: string
): Record<string, unknown> | undefined {
	const matchingRoutes = useMatches();
	const route = useMemo(
		() => matchingRoutes.find(route => route.id === id),
		[matchingRoutes, id]
	);
	return route?.data;
}

function isUser(user: any): user is User {
	return user && typeof user === 'object' && typeof user.email === 'string';
}

export function useOptionalUser(): Pick<User, 'username' | 'email'> | null {
	const data = useMatchesData('root');
	if (!data || !isUser(data.user)) {
		return null;
	}

	return data.user;
}

export const snakeToCamel = (str: string) => {
	return str
		.toLowerCase()
		.replace(/([-_][a-z])/g, group =>
			group.toUpperCase().replace('-', '').replace('_', '')
		);
};

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
