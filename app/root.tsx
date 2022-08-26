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
import { FcGoogle } from 'react-icons/fc';
import { SocialsProvider } from 'remix-auth-socials';
import create from 'zustand';
import { getUser } from '~/auth.server';
import Nav from '~/components/nav';
import tailwindStylesheetUrl from './styles/tailwind.css';
import { title } from './utils';

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
			rel: 'apple-touch-icon',
			sizes: '180x180',
			href: '/favicons/apple-touch-icon.png'
		},
		{
			rel: 'icon',
			type: 'image/png',
			sizes: '32x32',
			href: '/favicons/favicon-32x32.png'
		},
		{
			rel: 'icon',
			type: 'image/png',
			sizes: '16x16',
			href: '/favicons/favicon-16x16.png'
		},
		{
			rel: 'manifest',
			href: '/site.webmanifest'
		},
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
	title,
	viewport: 'width=device-width,initial-scale=1',
	description:
		'Kamus online untuk kata dan istilah yang viral, yang kita temui di twitter atau youtube yang teman kita ucapkan, dan lain-lain. Pada dasarnya, Urban Dictionary versi Indonesia.',
	'msapplication-config': '/browserconfig.xml',
	'msapplication-TileColor': '#d1d5db',
	'theme-color': '#d1d5db'
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
				<div className="relative mx-auto max-w-2xl px-4 pb-4 md:px-0">
					<Nav />
					<Outlet />
				</div>
				<Dialog
					open={useModalStore(state => state.isOpen)}
					onClose={useModalStore(state => state.closeModal)}
					className="relative z-[9999]"
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
									className="mt-4 flex items-center gap-x-2 border border-black px-4 py-2"
									type="submit"
								>
									<FcGoogle className="text-2xl" />
									Masuk dengan Google
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
