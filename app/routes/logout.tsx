import type { ActionArgs } from '@remix-run/node';
import { authenticator } from '~/auth.server';

export const action = async ({ request }: ActionArgs) => {
	await authenticator.logout(request, { redirectTo: '/' });
};
