import type { Prisma } from '@prisma/client';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useCatch, useFetcher, useLoaderData } from '@remix-run/react';
import { withZod } from '@remix-validated-form/with-zod';
import { useEffect, useState } from 'react';
import { ValidatedForm, validationError } from 'remix-validated-form';
import { z } from 'zod';
import { requireAdminUser } from '~/auth.server';
import { prisma } from '~/db.server';

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

		return json(
			{
				status: true,
				message: 'Berhasil menyetujui definisi'
			},
			{ status: 201 }
		);
	} catch (e) {
		console.error('Failed to approve definition. Exception:', e);

		return json(
			{
				status: false,
				message: 'Gagal menyetujui definisi'
			},
			{ status: 500 }
		);
	}
};

type CheckSelectKeys<T, U> = {
	[K in keyof T]: K extends keyof U ? T[K] : never;
};

const createDefinitionSelect = <T extends Prisma.DefinitionSelect>(
	arg: CheckSelectKeys<T, Prisma.DefinitionSelect>
) => arg;

const definitionsSelect = createDefinitionSelect({
	id: true,
	word: true,
	definition: true,
	example: true,
	user: {
		select: {
			username: true
		}
	}
});

type Definition = Prisma.DefinitionGetPayload<{
	select: typeof definitionsSelect;
}>;

interface LoaderData {
	data: Definition[];
	hasNextPage: boolean;
	endCursor: string | null;
}

export const loader = async ({ request }: LoaderArgs) => {
	await requireAdminUser(request);

	const limit = 10;
	const cursor = new URL(request.url).searchParams.get('cursor');

	let data = await prisma.definition.findMany({
		orderBy: [{ createdAt: 'asc' }],
		where: {
			approvedAt: null,
			deletedAt: null
		},
		take: limit + 1,
		cursor: cursor
			? {
					id: cursor
			  }
			: undefined,
		skip: cursor ? 1 : 0,
		select: definitionsSelect
	});

	const hasNextPage = data.length > limit;
	data = hasNextPage ? data.slice(0, -1) : data;
	const endCursor = data.length ? data[data.length - 1].id : null;

	const response = { data, hasNextPage, endCursor };
	console.log('response:', response);

	return json(response);
};

export const CatchBoundary = () => {
	const { status } = useCatch();

	if (status === 403) {
		return <h1>Forbidden</h1>;
	}
};

interface DefinitionProps {
	data: Definition;
}

const DefinitionItem = ({ data }: DefinitionProps) => {
	return (
		<div>
			<p>Kata: {data.word}</p>
			<p>Definisi: {data.definition}</p>
			<p>Contoh: {data.example}</p>
			<p>Diposting oleh: {data.user.username}</p>
			<ValidatedForm validator={validator} method="post" className="mt-2">
				<input type="hidden" name="id" value={data.id} />
				<button type="submit" className="border border-black bg-white p-2">
					Setujui
				</button>
			</ValidatedForm>
		</div>
	);
};

export default function DefinitionsDashboard() {
	const loaderData = useLoaderData<LoaderData>();
	const [data, setData] = useState(loaderData);
	const fetcher = useFetcher<LoaderData>();

	const fetchMore = () => {
		fetcher.load(`/dashboard/definitions/?index&cursor=${data.endCursor}`);
	};

	useEffect(() => {
		if (fetcher.data && data.hasNextPage) {
			setData({
				data:
					fetcher.data?.data.length > 0
						? [...data.data, ...fetcher.data?.data]
						: data.data,
				endCursor: fetcher.data?.endCursor,
				hasNextPage: fetcher.data?.hasNextPage
			});
		}
	}, [data.data, data.hasNextPage, fetcher.data]);

	return data.data.length ? (
		<>
			<div className="grid grid-cols-1 gap-y-6 py-6">
				{data.data.map(definition => (
					<DefinitionItem data={definition} key={definition.id} />
				))}
			</div>

			{data.hasNextPage && fetcher.state !== 'loading' ? (
				<button
					className="border border-black bg-white px-4 py-2"
					onClick={fetchMore}
				>
					Muat lebih banyak
				</button>
			) : null}
		</>
	) : (
		<h1>Belum ada definisi</h1>
	);
}
