import type { ActionArgs, LoaderArgs, SerializeFrom } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useCatch, useFetcher, useLoaderData } from '@remix-run/react';
import { withZod } from '@remix-validated-form/with-zod';
import { useEffect, useState } from 'react';
import {
	useFormContext,
	ValidatedForm,
	validationError
} from 'remix-validated-form';
import { z } from 'zod';
import create from 'zustand';
import { requireAdminUser } from '~/auth.server';
import { prisma } from '~/db.server';
import type { DashboardDefinitionIdLoader } from '~/routes/dashboard/definitions/$id';

interface ApproveDefinitionState {
	id: string | null;
	setId: (id: string | null) => void;
}

export const useApproveDefinition = create<ApproveDefinitionState>()(set => ({
	id: null,
	setId: id => set(() => ({ id }))
}));

const schema = z.object({
	id: z.string().min(1, 'ID wajib diisi')
});

type Schema = z.infer<typeof schema>;

const validator = withZod(schema);

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

export const loader = async ({ request }: LoaderArgs) => {
	await requireAdminUser(request);

	const limit = 10;
	const cursor = new URL(request.url).searchParams.get('cursor');

	let data = await prisma.definition.findMany({
		orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
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
		select: {
			id: true,
			word: true,
			definition: true,
			example: true,
			approvedAt: true,
			user: {
				select: {
					username: true
				}
			}
		}
	});

	const hasNextPage = data.length > limit;
	data = hasNextPage ? data.slice(0, -1) : data;
	const endCursor = data.length ? data[data.length - 1].id : null;

	const response = { data, hasNextPage, endCursor };
	return json(response);
};

export const CatchBoundary = () => {
	const { status } = useCatch();

	if (status === 403) {
		return <h1>Forbidden</h1>;
	}
};

interface SubmitButtonProps {
	children: string;
	formId: string;
}

const SubmitButton = ({ children, formId }: SubmitButtonProps) => {
	const formContext = useFormContext(formId);
	const fetcher = useFetcher();
	const approveDefinition = useApproveDefinition();

	const submitForm = () => {
		if (formContext.isValid) {
			const formData = formContext.getValues();
			const id = formData.get('id') as Schema['id'];

			const submittedData: Schema = { id };

			fetcher.submit(submittedData, {
				method: 'post',
				action: '/dashboard/definitions?index',
				replace: true
			});

			approveDefinition.setId(id);
		}
	};

	return (
		<button
			type="button"
			onClick={submitForm}
			className="border border-black bg-white p-2"
		>
			{children}
		</button>
	);
};

const DefinitionItem = ({
	data
}: {
	data: SerializeFrom<typeof loader>['data'][number];
}) => {
	const fetcher = useFetcher<DashboardDefinitionIdLoader>();
	const formId = `approve${data.id}`;
	const approveDefinition = useApproveDefinition();
	const actualData =
		fetcher.data?.data?.approvedAt && fetcher.data.data.id === data.id
			? null
			: data;

	useEffect(() => {
		if (approveDefinition.id === data.id) {
			fetcher.load(`/dashboard/definitions/${approveDefinition.id}`);
			approveDefinition.setId(null);
		}
	}, [approveDefinition, data.id, fetcher]);

	if (!actualData) return null;

	return (
		<div>
			<p>Kata: {actualData.word}</p>
			<p>Definisi: {actualData.definition}</p>
			<p>Contoh: {actualData.example}</p>
			<p>Diposting oleh: {actualData.user.username}</p>
			<ValidatedForm
				validator={validator}
				method="post"
				className="mt-2"
				id={formId}
				fetcher={fetcher}
			>
				<input type="hidden" name="id" value={actualData.id} />
				<SubmitButton formId={formId}>Setujui</SubmitButton>
			</ValidatedForm>
		</div>
	);
};

export default function DefinitionsDashboard() {
	const loaderData = useLoaderData<typeof loader>();
	const [data, setData] = useState(loaderData);
	const fetcher = useFetcher<typeof loaderData>();

	const fetchMore = () => {
		fetcher.load(`/dashboard/definitions/?index&cursor=${data.endCursor}`);
	};

	useEffect(() => {
		if (fetcher.data && data.hasNextPage) {
			setData(prev => ({
				data:
					fetcher.data?.data && fetcher.data.data.length > 0
						? [...prev.data, ...fetcher.data.data]
						: prev.data,
				endCursor: fetcher.data?.endCursor ?? prev.endCursor,
				hasNextPage: fetcher.data?.hasNextPage ?? prev.hasNextPage
			}));
		}
	}, [data.hasNextPage, fetcher.data]);

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
