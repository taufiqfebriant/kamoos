import * as Toast from '@radix-ui/react-toast';
import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useFetcher, useTransition } from '@remix-run/react';
import { withZod } from '@remix-validated-form/with-zod';
import type { RefObject } from 'react';
import { useRef } from 'react';
import { AiOutlineClose } from 'react-icons/ai';
import type { FieldErrors } from 'remix-validated-form';
import { ValidatedForm, validationError } from 'remix-validated-form';
import { z } from 'zod';
import { requireUser } from '~/auth.server';
import { Field } from '~/components/field';
import { prisma } from '~/db.server';
import { title, useOptionalUser } from '~/utils';

export const meta: MetaFunction = () => ({
	title: `Profil - ${title}`
});

export const loader = async ({ request }: LoaderArgs) => {
	return await requireUser(request);
};

const schema = z.object({
	username: z.string().min(1, { message: 'Nama pengguna wajib diisi' })
});

const clientValidator = withZod(schema);

export const action = async ({ request }: ActionArgs) => {
	const userId = await requireUser(request);

	const serverValidator = withZod(
		schema.refine(
			async data => {
				const user = await prisma.user.aggregate({
					_count: {
						_all: true
					},
					where: {
						username: data.username,
						id: {
							not: userId
						}
					}
				});

				return user._count._all === 0;
			},
			{
				message: 'Username sudah digunakan',
				path: ['username']
			}
		)
	);

	const { data, error } = await serverValidator.validate(
		await request.formData()
	);
	if (error) {
		return validationError(error);
	}

	try {
		await prisma.user.update({
			data: {
				username: data.username
			},
			where: {
				id: userId
			}
		});

		return json({ message: 'Berhasil memperbarui data pengguna' });
	} catch (e) {
		console.error('Failed to update user. Exception:', e);
		return json(
			{ message: 'Gagal memperbarui data pengguna' },
			{ status: 500 }
		);
	}
};

export default function Profile() {
	const user = useOptionalUser();
	const formRef = useRef() as RefObject<HTMLFormElement>;

	const transition = useTransition();
	const isAdding = transition.state === 'submitting';

	const fetcher = useFetcher<FieldErrors | { message: string } | undefined>();
	const isSuccess =
		fetcher.type === 'done' && !fetcher.data?.hasOwnProperty('fieldErrors');

	return (
		<>
			<main className="rounded-lg border border-black bg-white">
				<div className="border-b border-b-black py-3 px-8">
					<h1 className="text-sm">Profil</h1>
				</div>
				{user ? (
					<ValidatedForm
						validator={clientValidator}
						method="post"
						formRef={formRef}
						className="py-3 px-8"
						fetcher={fetcher}
					>
						<Field name="email">
							<Field.Label htmlFor="email" className="block">
								Email
							</Field.Label>
							<Field.Input
								type="text"
								id="email"
								className="mt-1 w-full border border-gray-400 bg-gray-100 py-2 px-4 text-gray-700"
								defaultValue={user.email}
								disabled
							/>
							<Field.Error className="mt-1 block text-sm text-red-600" />
						</Field>

						<Field name="username">
							<Field.Label htmlFor="username" className="mt-6 block">
								Nama pengguna
							</Field.Label>
							<Field.Description className="text-sm text-gray-700">
								Ini internet. Jadi, tolong jangan pake nama aslimu yaaa....
							</Field.Description>
							<Field.Input
								type="text"
								id="username"
								className="mt-2 w-full border border-black bg-gray-100 py-2 px-4"
								defaultValue={user.username}
							/>
							<Field.Error className="mt-1 block text-sm text-red-600" />
						</Field>

						<div className="flex justify-end">
							<button
								type="submit"
								className="mt-4 border border-black bg-yellow-400 px-6 py-3"
								disabled={isAdding}
							>
								{isAdding ? 'Memperbarui...' : 'Perbarui'}
							</button>
						</div>
					</ValidatedForm>
				) : null}
			</main>
			{isSuccess ? (
				<Toast.Provider duration={4000}>
					<Toast.Root className="border border-black bg-white px-6 py-4">
						<div className="flex justify-between">
							<Toast.Title>Berhasil</Toast.Title>
							<Toast.Close>
								<AiOutlineClose className="text-sm" />
							</Toast.Close>
						</div>
						<Toast.Description className="mt-1 text-sm text-gray-700">
							Profilmu berhasil diperbarui
						</Toast.Description>
					</Toast.Root>

					<Toast.Viewport className="fixed bottom-2 right-4" />
				</Toast.Provider>
			) : null}
		</>
	);
}
