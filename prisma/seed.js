const { PrismaClient } = require('@prisma/client');
const { generate } = require('canihazusername');
const { customNanoId } = require('../app/utils-cjs');

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

	await prisma.role.upsert({
		create: {
			id: customNanoId(),
			name: 'MEMBER'
		},
		update: {},
		where: { name: 'MEMBER' }
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
