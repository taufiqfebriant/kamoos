import { PrismaClient } from '@prisma/client';
import { generate } from 'canihazusername';
import { customNanoId } from '~/utils';

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
}

seed()
	.catch(e => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
