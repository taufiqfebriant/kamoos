import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { withZod } from '@remix-validated-form/with-zod';
import { z } from 'zod';
import { ValidatedForm, validationError } from 'remix-validated-form';
import { prisma } from '~/db.server';
import { customNanoId } from '~/utils';
import { json } from '@remix-run/node';
import { useActionData, useTransition } from '@remix-run/react';
import * as Toast from '@radix-ui/react-toast';
import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { requireUser } from '~/auth.server';

const validator = withZod(
	z.object({
		word: z.string().min(1, { message: 'Kata wajib diisi' }),
		definition: z.string().min(1, { message: 'Definisi wajib diisi' }),
		example: z.string().min(1, { message: 'Contoh wajib diisi' })
	})
);

interface ActionData {
	status: boolean;
	message: string;
}

export const loader = async ({ request }: LoaderArgs) => {
	return await requireUser(request);
};

export const action = async ({ request }: ActionArgs) => {
	const userId = await requireUser(request);

	const { data, error } = await validator.validate(await request.formData());
	if (error) {
		return validationError(error);
	}

	try {
		await prisma.definition.create({
			data: {
				id: customNanoId(),
				word: data.word,
				definition: data.definition,
				example: data.example,
				userId
			}
		});
	} catch (e) {
		console.log('Failed to create definition, exception:', e);

		throw json<ActionData>(
			{
				status: false,
				message: 'Gagal menambahkan definisi'
			},
			{ status: 500 }
		);
	}

	return json<ActionData>({
		status: true,
		message: 'Definisi Anda akan segera ditinjau'
	});
};

export default function Create() {
	const data = useActionData<ActionData>();

	const transition = useTransition();
	const isAdding = transition.state === 'submitting';

	const formRef = useRef() as RefObject<HTMLFormElement>;

	useEffect(() => {
		if (!isAdding) {
			formRef.current?.reset();
		}
	}, [isAdding]);

	// TODO: betulkan tampilan
	return (
		<>
			<h1>Tambah kata baru</h1>
			<ValidatedForm validator={validator} method="post" formRef={formRef}>
				<div>
					<label htmlFor="word">Kata</label>
					<input type="text" name="word" id="word" />
				</div>
				{/* TODO: pastikan ini bisa pakek baris baru */}
				<div className="mt-2">
					<label htmlFor="definition">Definisi</label>
					<textarea name="definition" id="definition" rows={5}></textarea>
				</div>
				{/* TODO: pastikan ini bisa pakek baris baru */}
				<div className="mt-2">
					<label htmlFor="example">Contoh</label>
					<textarea name="example" id="example" rows={5}></textarea>
				</div>
				<button type="submit" className="bg-white px-6 py-3">
					{isAdding ? 'Menambahkan...' : 'Tambah'}
				</button>
			</ValidatedForm>
			{data?.status ? (
				<Toast.Provider>
					<Toast.Root open={true} className="bg-green-500">
						<Toast.Title>Berhasil</Toast.Title>
						<Toast.Description>{data.message}</Toast.Description>
						<Toast.Close />
					</Toast.Root>

					<Toast.Viewport />
				</Toast.Provider>
			) : null}
		</>
	);
}
