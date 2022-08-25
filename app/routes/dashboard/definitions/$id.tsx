import type { Prisma } from '@prisma/client';
import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireAdminUser } from '~/auth.server';
import { prisma } from '~/db.server';

type CheckSelectKeys<T, U> = {
	[K in keyof T]: K extends keyof U ? T[K] : never;
};

const createDefinitionSelect = <T extends Prisma.DefinitionSelect>(
	arg: CheckSelectKeys<T, Prisma.DefinitionSelect>
) => arg;

const select = createDefinitionSelect({
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
});

type Definition = Prisma.DefinitionGetPayload<{ select: typeof select }>;

export type DashboardDefinitionIdLoader = {
	message?: string;
	data?: Omit<Definition, 'approvedAt'> & { approvedAt: string | null };
};

export const loader = async ({ request, params }: LoaderArgs) => {
	await requireAdminUser(request);

	const id = params.id;
	if (!id) {
		return json({ message: 'Wajib menyertakan ID' }, { status: 400 });
	}

	const data = await prisma.definition.findFirst({
		where: {
			deletedAt: null,
			id
		},
		select
	});

	if (!data) {
		return json({ message: 'Definisi tidak ditemukan' }, { status: 404 });
	}

	return json({ data });
};
