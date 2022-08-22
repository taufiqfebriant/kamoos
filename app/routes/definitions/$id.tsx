import type { ActionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { authenticator, getSession } from '~/auth.server';
import { prisma } from '~/db.server';
import type {
	CurrentUserReaction,
	DefinitionWithReaction,
	ReactionByDefinition
} from '~/routes/index';
import superjson from 'superjson';

export const loader = async ({ params, request }: ActionArgs) => {
	const session = await getSession(request);
	const userId = session.get(authenticator.sessionKey) as string | undefined;

	const id = params.id;
	if (!id) {
		return json({ message: 'Wajib menyertakan ID' }, { status: 400 });
	}

	let definitionWithReaction: DefinitionWithReaction | null = null;

	definitionWithReaction = await prisma.definition.findUnique({
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
		where: {
			id
		}
	});

	if (!definitionWithReaction) {
		return json({ message: 'Definisi tidak ditemukan' }, { status: 404 });
	}

	const reactions: ReactionByDefinition[] = await prisma.$queryRaw`
		select
			r.definition_id,
			count(nullif(r."type", 'DISLIKE')) likes,
			count(nullif(r."type", 'LIKE')) dislikes
		from
			reactions r
		where
			r.definition_id = ${id}
			AND r.deleted_at is null
		group by
			r.definition_id,
			r."type"
	`;

	if (reactions.length > 0) {
		definitionWithReaction.reaction = reactions[0];
	}

	let currentUserReaction: CurrentUserReaction | null = null;
	if (userId) {
		currentUserReaction = await prisma.reaction.findFirst({
			where: {
				definitionId: id,
				userId,
				deletedAt: null
			},
			select: {
				id: true,
				type: true,
				definitionId: true
			}
		});
	}

	if (currentUserReaction) {
		definitionWithReaction.currentUserReaction = currentUserReaction;
	}

	return json(superjson.serialize(definitionWithReaction).json);
};
