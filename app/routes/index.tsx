import {
	AiFillDislike,
	AiFillLike,
	AiOutlineDislike,
	AiOutlineLike
} from 'react-icons/ai';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { prisma } from '~/db.server';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { ValidatedForm, validationError } from 'remix-validated-form';
import { z } from 'zod';
import { withZod } from '@remix-validated-form/with-zod';
import { Prisma, ReactionType } from '@prisma/client';
import type { Reaction } from '@prisma/client';
import { requireUser, getSession, authenticator } from '~/auth.server';
import { useOptionalUser } from '~/utils';
import type { Optional } from '~/utils';
import { customNanoId } from '~/utils';
import { useEffect, useRef, useState } from 'react';
import superjson from 'superjson';
import { useModalStore } from '~/root';

type ReactionByDefinition = {
	definition_id?: Reaction['definitionId'];
	likes: number;
	dislikes: number;
};

type CurrentUserReaction = Optional<
	Pick<Reaction, 'id' | 'type' | 'definitionId'>,
	'definitionId'
>;

// TODO: Ambil "Definition" field type dari Prisma.DefinitionGetPayload
type DefinitionWithReaction = {
	id: string;
	word: string;
	definition: string;
	example: string;
	user: {
		username: string;
	};
	reaction?: Pick<ReactionByDefinition, 'likes' | 'dislikes'>;
	currentUserReaction?: CurrentUserReaction;
};

const schema = z.object({
	id: z.string().min(1, { message: 'ID wajib disertakan' }),
	type: z.nativeEnum(ReactionType, {
		required_error: 'Tipe wajib disertakan'
	}),
	subaction: z.enum(['upsert', 'delete'], {
		required_error: 'Aksi wajib disertakan'
	})
});

type Schema = z.infer<typeof schema>;

const validator = withZod(schema);

export const action = async ({ request }: ActionArgs) => {
	const userId = await requireUser(request);

	const { data, error } = await validator.validate(await request.formData());
	if (error) {
		return validationError(error);
	}

	const deletedAt =
		data.subaction === 'delete' ? new Date().toISOString() : null;

	try {
		await prisma.reaction.upsert({
			create: {
				id: customNanoId(),
				type: data.type,
				definitionId: data.id,
				userId
			},
			update: {
				type: data.type,
				deletedAt
			},
			where: {
				definitionId_userId: {
					definitionId: data.id,
					userId
				}
			}
		});
	} catch (e) {
		console.error('Failed to update/create definition reaction. Exception:', e);

		return json(
			{
				message: 'Gagal menambahkan reaksi definisi'
			},
			{ status: 500 }
		);
	}

	return json({
		message: 'Berhasil menambahkan reaksi definisi'
	});
};

type LoaderData = {
	definitions: DefinitionWithReaction[] | never[];
	hasNextPage: boolean;
	cursor: string | null;
};

export const loader = async ({ request }: LoaderArgs) => {
	const session = await getSession(request);
	const userId = session.get(authenticator.sessionKey) as string | undefined;

	const limit = 10;
	const cursor = new URL(request.url).searchParams.get('cursor');

	let definitions = await prisma.definition.findMany({
		select: {
			id: true,
			word: true,
			definition: true,
			example: true,
			user: {
				select: {
					username: true
				}
			}
		},
		cursor: cursor
			? {
					id: cursor
			  }
			: undefined,
		skip: cursor ? 1 : undefined,
		where: {
			approvedAt: {
				not: null
			}
		},
		take: limit + 1,
		orderBy: {
			createdAt: 'desc'
		}
	});

	if (!definitions.length) {
		const loaderData: LoaderData = {
			definitions: [],
			hasNextPage: false,
			cursor: null
		};

		return json(superjson.serialize(loaderData).json);
	}

	const hasNextPage = definitions.length > limit;
	definitions = hasNextPage ? definitions.slice(0, -1) : definitions;
	const definitionIds = definitions.map(({ id }) => id);

	const reactions: ReactionByDefinition[] = await prisma.$queryRaw`
		select
			r.definition_id,
			count(nullif(r."type", 'DISLIKE')) likes,
			count(nullif(r."type", 'LIKE')) dislikes
		from
			reactions r
		where
			r.definition_id in (${Prisma.join(definitionIds)})
			AND r.deleted_at is null
		group by
			r.definition_id,
			r."type"
	`;

	let currentUserReactions: CurrentUserReaction[] = [];
	if (userId) {
		currentUserReactions = await prisma.reaction.findMany({
			where: {
				userId,
				definitionId: {
					in: definitionIds
				},
				deletedAt: null
			},
			select: {
				id: true,
				type: true,
				definitionId: true
			}
		});
	}

	const definitionWithReactions: DefinitionWithReaction[] = definitions.map(
		definition => {
			let newDefinition: DefinitionWithReaction = definition;

			let reaction = reactions.find(
				reaction => reaction.definition_id === definition.id
			);

			if (reaction) {
				delete reaction.definition_id;
				newDefinition.reaction = reaction;
			}

			let currentUserReaction = currentUserReactions.find(
				currentUserReaction =>
					currentUserReaction.definitionId === definition.id
			);

			if (currentUserReaction) {
				delete currentUserReaction.definitionId;
				newDefinition.currentUserReaction = currentUserReaction;
			}

			return newDefinition;
		}
	);

	const loaderData: LoaderData = {
		definitions: definitionWithReactions,
		hasNextPage,
		cursor: definitions[definitions.length - 1].id
	};

	return json(superjson.serialize(loaderData).json);
};

interface DefinitionCardProps {
	data: DefinitionWithReaction;
	onUpdate: () => void;
}

const DefinitionCard = ({ data }: { data: DefinitionWithReaction }) => {
	const user = useOptionalUser();
	const { openModal } = useModalStore();
	const fetcher = useFetcher();

	const likeSubaction: Schema['subaction'] =
		data.currentUserReaction?.type === 'LIKE' ? 'delete' : 'upsert';

	const dislikeSubaction: Schema['subaction'] =
		data.currentUserReaction?.type === 'DISLIKE' ? 'delete' : 'upsert';

	return (
		<div className="rounded-lg border border-black bg-white">
			<div className="p-8">
				<h1 className="text-4xl font-bold">{data.word}</h1>
				<div className="mt-4 whitespace-pre-wrap">{data.definition}</div>
				<div className="mt-3 whitespace-pre-wrap italic">{data.example}</div>
			</div>
			<div className="flex border-t border-black">
				<div className="flex-1 py-3">
					<p className="ml-8 text-sm">diposting oleh {data.user.username}</p>
				</div>
				{user ? (
					<>
						{/* TODO: Ganti jadi method="delete". Liat di repo web Kent C. Dodds */}
						<ValidatedForm
							validator={validator}
							method="post"
							className="border-l border-black"
							action="/?index"
							subaction={likeSubaction}
							fetcher={fetcher}
						>
							<input type="hidden" name="id" value={data.id} />
							<input type="hidden" name="type" value={ReactionType.LIKE} />
							<button type="submit" className="flex h-full items-center px-4">
								{data.currentUserReaction?.type === 'LIKE' ? (
									<AiFillLike className="mr-1 text-xl" />
								) : (
									<AiOutlineLike className="mr-1 text-xl" />
								)}
								<span className="text-sm">
									{data.reaction?.likes?.toString() ?? 0}
								</span>
							</button>
						</ValidatedForm>
						<ValidatedForm
							validator={validator}
							method="post"
							className="border-l border-black"
							action="/?index"
							subaction={dislikeSubaction}
							fetcher={fetcher}
						>
							<input type="hidden" name="id" value={data.id} />
							<input type="hidden" name="type" value={ReactionType.DISLIKE} />
							<button className="flex h-full items-center px-4" type="submit">
								{data.currentUserReaction?.type === 'DISLIKE' ? (
									<AiFillDislike className="mr-1 text-xl" />
								) : (
									<AiOutlineDislike className="mr-1 text-xl" />
								)}
								<span className="text-sm">
									{data.reaction?.dislikes?.toString() ?? 0}
								</span>
							</button>
						</ValidatedForm>
					</>
				) : (
					<>
						<div className="border-l border-black">
							<button
								type="button"
								className="flex h-full items-center px-4"
								onClick={openModal}
							>
								<AiOutlineLike className="mr-1 text-xl" />
								<span className="text-sm">
									{data.reaction?.likes?.toString() ?? 0}
								</span>
							</button>
						</div>
						<div className="border-l border-black">
							<button
								type="button"
								className="flex h-full items-center px-4"
								onClick={openModal}
							>
								<AiOutlineDislike className="mr-1 text-xl" />
								<span className="text-sm">
									{data.reaction?.dislikes?.toString() ?? 0}
								</span>
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default function Index() {
	const loaderData = useLoaderData<LoaderData>();
	const fetcher = useFetcher<LoaderData>();

	const [data, setData] = useState(loaderData);
	const [shouldFetch, setShouldFetch] = useState(true);

	const loadMoreRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!loadMoreRef.current) return;

		const observer = new IntersectionObserver(entries => {
			const entry = entries[0];
			if (entry.isIntersecting && shouldFetch) {
				fetcher.load(`/?index&cursor=${data.cursor}`);
				setShouldFetch(false);
			}
		});

		observer.observe(loadMoreRef.current);

		return () => observer.disconnect();
	}, [data.cursor, data.hasNextPage, fetcher, shouldFetch]);

	useEffect(() => {
		if (fetcher.data && data.hasNextPage) {
			const definitions = fetcher.data.definitions
				? [...data.definitions, ...fetcher.data.definitions]
				: data.definitions;
			const hasNextPage = fetcher.data.hasNextPage ?? data.hasNextPage;
			const cursor = fetcher.data.cursor ?? data.cursor;

			setData(prev => ({ ...prev, definitions, hasNextPage, cursor }));
			setShouldFetch(true);
		}
	}, [fetcher.data, data.definitions, data.cursor, data.hasNextPage]);

	return (
		<>
			<main className="grid grid-cols-1 gap-6 pb-4">
				{data.definitions.length ? (
					data.definitions.map(definition => (
						<DefinitionCard key={definition.id} data={definition} />
					))
				) : (
					<h1>Belum ada definisi</h1>
				)}
				{fetcher.state === 'loading' ? (
					<p className="mb-3 text-center">Memuat data...</p>
				) : null}
				{data.hasNextPage && fetcher.state !== 'loading' ? (
					<div ref={loadMoreRef}></div>
				) : null}
			</main>
		</>
	);
}
