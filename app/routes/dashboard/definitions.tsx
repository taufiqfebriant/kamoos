import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useCatch, useLoaderData } from '@remix-run/react';
import { withZod } from '@remix-validated-form/with-zod';
import { ValidatedForm, validationError } from 'remix-validated-form';
import { z } from 'zod';
import { prisma } from '~/db.server';
import dayjs from 'dayjs';
import type { ResponseBody } from '~/utils';
import { requireAdminUser } from '~/auth.server';

const validator = withZod(
	z.object({
		id: z.string().min(1, 'ID wajib diisi')
	})
);

export const action = async ({ request }: ActionArgs) => {
	await requireAdminUser(request);

	const { error, data } = await validator.validate(await request.formData());
	if (error) {
		return validationError(error);
	}

	const now = new Date();

	try {
		await prisma.definition.update({
			where: { id: data.id },
			data: { approvedAt: now.toISOString() }
		});

		return json<ResponseBody>(
			{
				status: true,
				message: 'Berhasil menyetujui definisi'
			},
			{ status: 201 }
		);
	} catch (e) {
		console.error('Failed to approve definition. Exception:', e);

		return json<ResponseBody>(
			{
				status: false,
				message: 'Gagal menyetujui definisi'
			},
			{ status: 500 }
		);
	}
};

export const loader = async ({ request }: LoaderArgs) => {
	await requireAdminUser(request);

	const definitions = await prisma.definition.findMany({
		orderBy: [{ approvedAt: 'desc' }, { createdAt: 'asc' }]
	});

	return json(definitions);
};

export const CatchBoundary = () => {
	const { status } = useCatch();

	if (status === 403) {
		return <h1>Forbidden</h1>;
	}
};

export default function DefinitionsDashboard() {
	const definitions = useLoaderData<typeof loader>();

	return (
		<div className="grid grid-cols-1 gap-y-6 py-6">
			{definitions.map(definition => (
				<div key={definition.id}>
					<p>Kata: {definition.word}</p>
					<p>Definisi: {definition.definition}</p>
					<p>Contoh: {definition.example}</p>
					<p>
						Disetujui pada:{' '}
						{definition.approvedAt
							? dayjs(definition.approvedAt).format('hh:mm:ss DD-MM-YYYY')
							: 'Belum ditinjau'}
					</p>
					{definition.approvedAt ? null : (
						<ValidatedForm validator={validator} method="post" className="mt-2">
							<input type="hidden" name="id" value={definition.id} />
							<button
								type="submit"
								className="border border-black bg-white p-2"
							>
								Setujui
							</button>
						</ValidatedForm>
					)}
				</div>
			))}
		</div>
	);
}
