import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { generate } from 'canihazusername';
import { customNanoId } from '~/utils';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function seed() {
	await prisma.role.upsert({
		create: {
			id: customNanoId(),
			name: 'ADMIN',
			users: {
				create: [
					{
						id: customNanoId(),
						email: 'taufiqisfebrianto06@gmail.com',
						username: generate()
					}
				]
			}
		},
		update: {},
		where: { name: 'ADMIN' }
	});

	// TODO: hapus ini, soalnya cumak buat nyobak
	const definitions: Prisma.DefinitionCreateManyInput[] = [];

	const users = [...Array(20)].map(() => {
		const id = customNanoId();

		const user: Prisma.UserCreateWithoutRoleInput = {
			id,
			email: faker.internet.email(),
			username: generate()
		};

		const definition: Prisma.DefinitionCreateManyInput = {
			id: customNanoId(),
			word: faker.word.noun(),
			definition: faker.lorem.sentence(),
			example: faker.lorem.lines(),
			approvedAt: new Date().toISOString(),
			userId: id
		};

		definitions.push(definition);

		return user;
	});

	await prisma.role.upsert({
		create: {
			id: customNanoId(),
			name: 'MEMBER',
			users: {
				createMany: {
					data: users
				}
			}
		},
		update: {},
		where: { name: 'MEMBER' }
	});

	await prisma.definition.createMany({
		data: definitions
	});
}

seed()
	.catch(e => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
