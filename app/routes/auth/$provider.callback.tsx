import type { LoaderArgs } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { authenticator } from '~/auth.server';

export const loader = ({ request, params }: LoaderArgs) => {
	invariant(params.provider, `params.provider is required`);

	return authenticator.authenticate(params.provider, request, {
		successRedirect: '/',
		failureRedirect: '/'
	});
};
