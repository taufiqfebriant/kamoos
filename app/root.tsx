import { Dialog } from '@headlessui/react';
import type { LinksFunction, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
	Form,
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration
} from '@remix-run/react';
import { AiOutlineClose } from 'react-icons/ai';
import create from 'zustand';
import { getUser } from '~/auth.server';
import Nav from '~/components/nav';

import { SocialsProvider } from 'remix-auth-socials';
import tailwindStylesheetUrl from './styles/tailwind.css';

interface ModalState {
	isOpen: boolean;
	openModal: () => void;
	closeModal: () => void;
}

export const useModalStore = create<ModalState>()(set => ({
	isOpen: false,
	openModal: () => set(() => ({ isOpen: true })),
	closeModal: () => set(() => ({ isOpen: false }))
}));

export const links: LinksFunction = () => {
	return [
		{
			rel: 'preload',
			as: 'font',
			href: '/fonts/inter-v12-latin-700.woff2',
			type: 'font/woff2',
			crossOrigin: 'anonymous'
		},
		{
			rel: 'preload',
			as: 'font',
			href: '/fonts/inter-v12-latin-600.woff2',
			type: 'font/woff2',
			crossOrigin: 'anonymous'
		},
		{
			rel: 'preload',
			as: 'font',
			href: '/fonts/inter-v12-latin-500.woff2',
			type: 'font/woff2',
			crossOrigin: 'anonymous'
		},
		{
			rel: 'preload',
			as: 'font',
			href: '/fonts/inter-v12-latin-regular.woff2',
			type: 'font/woff2',
			crossOrigin: 'anonymous'
		},
		{
			rel: 'preload',
			as: 'font',
			href: '/fonts/inter-v12-latin-700.woff',
			type: 'font/woff',
			crossOrigin: 'anonymous'
		},
		{
			rel: 'preload',
			as: 'font',
			href: '/fonts/inter-v12-latin-600.woff',
			type: 'font/woff',
			crossOrigin: 'anonymous'
		},
		{
			rel: 'preload',
			as: 'font',
			href: '/fonts/inter-v12-latin-500.woff',
			type: 'font/woff',
			crossOrigin: 'anonymous'
		},
		{
			rel: 'preload',
			as: 'font',
			href: '/fonts/inter-v12-latin-regular.woff',
			type: 'font/woff',
			crossOrigin: 'anonymous'
		},
		{ rel: 'stylesheet', href: tailwindStylesheetUrl }
	];
};

export const meta: MetaFunction = () => ({
	charset: 'utf-8',
	title: 'kamoos',
	viewport: 'width=device-width,initial-scale=1'
});

export async function loader({ request }: LoaderArgs) {
	const user = await getUser(request);

	return json({ user });
}

export default function App() {
	return (
		<html lang="en" className="h-full">
			<head>
				<Meta />
				<Links />
			</head>
			<body className="h-full bg-gray-200">
				<div className="relative mx-auto max-w-2xl pb-4">
					<Nav />
					<Outlet />
				</div>
				<Dialog
					open={useModalStore(state => state.isOpen)}
					onClose={useModalStore(state => state.closeModal)}
					className="relative z-50"
				>
					<div className="fixed inset-0 bg-black/30" aria-hidden="true" />
					<div className="fixed inset-0 flex items-center justify-center p-4">
						<Dialog.Panel className="relative border border-black bg-white px-8 py-4 text-center">
							<button
								className="absolute right-2 top-2"
								onClick={useModalStore(state => state.closeModal)}
							>
								<AiOutlineClose />
							</button>
							<Dialog.Title className="font-bold">Ups</Dialog.Title>
							<Dialog.Description className="mt-2">
								Kamu harus masuk dulu
							</Dialog.Description>
							<Form method="post" action={`/auth/${SocialsProvider.GOOGLE}`}>
								<button
									className="mt-4 border border-black bg-yellow-400 px-4 py-2"
									type="submit"
								>
									Masuk
								</button>
							</Form>
						</Dialog.Panel>
					</div>
				</Dialog>
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}
