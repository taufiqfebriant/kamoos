import { Form, Link } from '@remix-run/react';
import { useOptionalUser } from '~/utils';
import { VscSignIn } from 'react-icons/vsc';
import { SocialsProvider } from 'remix-auth-socials';
import { Popover } from '@headlessui/react';
import { VscTriangleDown } from 'react-icons/vsc';
import { useModalStore } from '~/root';

export default function Nav() {
	const user = useOptionalUser();
	const { openModal } = useModalStore();

	return (
		<nav className="flex items-center justify-between gap-x-6 py-6">
			<Link to="/" className="flex-1 text-3xl font-bold">
				kamoos
			</Link>
			{user ? (
				<Link to="/create" className="hover:underline">
					Tambah definisi
				</Link>
			) : (
				<button onClick={openModal} className="hover:underline">
					Tambah definisi
				</button>
			)}
			<Link to="/about" className="hover:underline">
				Tentang
			</Link>
			<div>
				{user ? (
					<Popover>
						<Popover.Button className="flex items-center hover:underline">
							<span className="mr-2">{user.username}</span>
							<VscTriangleDown />
						</Popover.Button>
						<Popover.Panel className="absolute right-0 mt-2 flex w-56 flex-col border border-black bg-white">
							<Link className="px-6 py-3 hover:bg-gray-100" to="/profile">
								Profil
							</Link>
							<Form
								method="post"
								action="/logout"
								className="hover:bg-gray-100"
							>
								<button type="submit" className="w-full px-6 py-3 text-left">
									Keluar
								</button>
							</Form>
						</Popover.Panel>
					</Popover>
				) : (
					<Form method="post" action={`/auth/${SocialsProvider.GOOGLE}`}>
						<button
							className="flex items-center border-2 border-black bg-yellow-400 px-6 py-3"
							type="submit"
						>
							<VscSignIn className="mr-2 text-lg" />
							<span>Masuk</span>
						</button>
					</Form>
				)}
			</div>
		</nav>
	);
}
