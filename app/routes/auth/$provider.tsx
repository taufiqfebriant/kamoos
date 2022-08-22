import type { ActionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { authenticator } from '~/auth.server';

export const loader = () => redirect('/');

export const action = ({ request, params }: ActionArgs) => {
	invariant(params.provider, `params.provider is required`);

	return authenticator.authenticate(params.provider, request);
};
