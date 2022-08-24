import { Popover } from '@headlessui/react';
import { Form, Link } from '@remix-run/react';
import { FcGoogle } from 'react-icons/fc';
import { VscSignIn, VscTriangleDown } from 'react-icons/vsc';
import { SocialsProvider } from 'remix-auth-socials';
import { useModalStore } from '~/root';
import { useOptionalUser } from '~/utils';

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
							<Popover.Button
								as={Link}
								className="px-6 py-3 hover:bg-gray-100"
								to="/my-definitions"
							>
								Definisiku
							</Popover.Button>
							<Popover.Button
								as={Link}
								className="px-6 py-3 hover:bg-gray-100"
								to="/profile"
							>
								Profil
							</Popover.Button>
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
					<Popover>
						<Popover.Button className="flex items-center border-2 border-black bg-yellow-400 px-6 py-3">
							<VscSignIn className="mr-2 text-lg" />
							<span>Masuk</span>
						</Popover.Button>
						<Popover.Panel className="absolute right-0 mt-2 flex w-auto flex-col border border-black bg-white">
							<Form
								method="post"
								action={`/auth/${SocialsProvider.GOOGLE}`}
								className="hover:bg-gray-100"
							>
								<button
									type="submit"
									className="flex flex-row items-center gap-3 px-6 py-3"
								>
									<FcGoogle className="text-xl" />
									<span className="w-fit">Masuk dengan Google</span>
								</button>
							</Form>
						</Popover.Panel>
					</Popover>
				)}
			</div>
		</nav>
	);
}
