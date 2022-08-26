import * as Toast from '@radix-ui/react-toast';
import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useFetcher } from '@remix-run/react';
import { withZod } from '@remix-validated-form/with-zod';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { AiOutlineClose } from 'react-icons/ai';
import { ValidatedForm, validationError } from 'remix-validated-form';
import { z } from 'zod';
import { requireUser } from '~/auth.server';
import { Field } from '~/components/field';
import { prisma } from '~/db.server';
import { customNanoId, title } from '~/utils';

export const meta: MetaFunction = () => ({
	title: `Tambah definisi baru - ${title}`
});

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
		console.error('Failed to create definition, exception:', e);

		return json<ActionData>(
			{
				status: false,
				message: 'Gagal menambahkan definisi'
			},
			{ status: 500 }
		);
	}

	return json<ActionData>({
		status: true,
		message: 'Definisimu akan segera ditinjau'
	});
};

// TODO: handle expected error
export default function Create() {
	const [responses, setResponses] = useState<ActionData[]>([]);
	const fetcher = useFetcher();
	const isAdding = fetcher.state === 'submitting';

	const formRef = useRef() as RefObject<HTMLFormElement>;

	useEffect(() => {
		if (fetcher.data && fetcher.type === 'actionReload') {
			setResponses(prev => [...prev, fetcher.data]);
		}
	}, [fetcher.data, fetcher.type]);

	useEffect(() => {
		if (!isAdding) {
			formRef.current?.reset();
		}
	}, [isAdding]);

	// TODO: betulkan tampilan
	return (
		<>
			<main className="rounded-lg border border-black bg-white">
				<div className="border-b border-b-black py-3 px-8">
					<h1 className="text-sm">Tambah definisi baru</h1>
				</div>
				<ValidatedForm
					validator={validator}
					method="post"
					formRef={formRef}
					className="py-3 px-8"
					fetcher={fetcher}
				>
					<Field name="word">
						<Field.Label htmlFor="word" className="block">
							Kata
						</Field.Label>
						<Field.Input
							type="text"
							id="word"
							className="mt-1 w-full border border-black bg-gray-100 py-2 px-4"
						/>
						<Field.Error className="mt-1 block text-sm text-red-600" />
					</Field>

					{/* TODO: pastikan ini bisa pakek baris baru */}
					<Field name="definition">
						<Field.Label htmlFor="definition" className="mt-6 block">
							Definisi
						</Field.Label>
						<Field.Description className="text-sm text-gray-700">
							Ketik definisimu di bawah ini
						</Field.Description>
						<Field.Textarea
							id="definition"
							rows={5}
							className="mt-2 w-full border border-black bg-gray-100 py-2 px-4"
						/>
						<Field.Error className="mt-1 block text-sm text-red-600" />
					</Field>

					{/* TODO: pastikan ini bisa pakek baris baru */}
					<Field name="example">
						<Field.Label htmlFor="example" className="mt-6 block">
							Contoh
						</Field.Label>
						<Field.Description className="text-sm text-gray-700">
							Ketikkan contoh penggunaannya dalam kalimat
						</Field.Description>
						<Field.Textarea
							id="example"
							rows={5}
							className="mt-2 w-full border border-black bg-gray-100 py-2 px-4"
						/>
						<Field.Error className="mt-1 block text-sm text-red-600" />
					</Field>

					<div className="flex justify-end">
						<button
							type="submit"
							className="mt-4 border border-black bg-yellow-400 px-6 py-3"
							disabled={isAdding}
						>
							{isAdding ? 'Menambahkan...' : 'Tambah'}
						</button>
					</div>
				</ValidatedForm>
			</main>
			{responses.map((response, index) => (
				<Toast.Provider duration={4000} key={index}>
					<Toast.Root className="border border-black bg-white px-6 py-4">
						<div className="flex justify-between">
							<Toast.Title>Berhasil</Toast.Title>
							<Toast.Close>
								<AiOutlineClose className="text-sm" />
							</Toast.Close>
						</div>
						<Toast.Description className="mt-1 text-sm text-gray-700">
							{response.message}
						</Toast.Description>
					</Toast.Root>

					<Toast.Viewport className="fixed bottom-2 right-4" />
				</Toast.Provider>
			))}
		</>
	);
}
