import { createCookieSessionStorage, json, redirect } from '@remix-run/node';
import { generate } from 'canihazusername';
import { Authenticator } from 'remix-auth';
import { GoogleStrategy, SocialsProvider } from 'remix-auth-socials';
import invariant from 'tiny-invariant';
import { prisma } from '~/db.server';
import { customNanoId } from '~/utils';

invariant(process.env.SESSION_SECRET, 'SESSION_SECRET must be set');
invariant(process.env.GOOGLE_CLIENT_ID, 'GOOGLE_CLIENT_ID must be set');
invariant(process.env.GOOGLE_CLIENT_SECRET, 'GOOGLE_CLIENT_SECRET must be set');

export const sessionStorage = createCookieSessionStorage({
	cookie: {
		name: '__session',
		httpOnly: true,
		path: '/',
		sameSite: 'lax',
		secrets: [process.env.SESSION_SECRET],
		secure: process.env.NODE_ENV === 'production'
	}
});

export const authenticator = new Authenticator<string | null>(sessionStorage, {
	sessionKey: 'userId'
});

authenticator.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: `http://localhost:3000/auth/${SocialsProvider.GOOGLE}/callback`
		},
		async params => {
			const email = params.profile._json.email;

			try {
				const user = await prisma.user.upsert({
					where: { email },
					update: {},
					create: {
						id: customNanoId(),
						email,
						username: generate(),
						role: {
							connect: {
								name: 'MEMBER'
							}
						}
					},
					select: {
						id: true
					}
				});

				return user.id;
			} catch (e) {
				console.error(`Failed to find or create user, exception:`, e);
				return null;
			}
		}
	)
);

export function getSession(request: Request) {
	const cookie = request.headers.get('Cookie');
	return sessionStorage.getSession(cookie);
}

export async function getUser(request: Request) {
	const session = await getSession(request);

	const userId = session.get(authenticator.sessionKey);
	if (!userId) {
		return null;
	}

	const user = await prisma.user.findUnique({
		where: {
			id: userId
		},
		select: {
			username: true,
			email: true
		}
	});

	return user;
}

export const requireAdminUser = async (request: Request) => {
	const session = await getSession(request);
	if (!session.has(authenticator.sessionKey)) {
		throw redirect('/', 302);
	}

	const userId = session.get(authenticator.sessionKey) as string | undefined;
	if (!userId) {
		throw redirect('/', 302);
	}

	const user = await prisma.user.findUnique({
		where: {
			id: userId
		},
		select: {
			role: {
				select: {
					name: true
				}
			}
		}
	});

	if (user?.role.name !== 'ADMIN') {
		throw json(
			{
				status: false,
				message: 'Forbidden'
			},
			{ status: 403 }
		);
	}

	return user;
};

export const requireUser = async (request: Request) => {
	const session = await getSession(request);
	if (!session.has(authenticator.sessionKey)) {
		throw redirect('/', 302);
	}

	const userId = session.get(authenticator.sessionKey) as string | undefined;
	if (!userId) {
		throw redirect('/', 302);
	}

	const aggregations = await prisma.user.aggregate({
		where: {
			id: userId
		},
		_count: {
			_all: true
		}
	});

	if (aggregations._count._all <= 0) {
		throw redirect('/', 302);
	}

	return userId;
};
