import { Dialog, Popover } from '@headlessui/react';
import { Form, Link } from '@remix-run/react';
import { useState } from 'react';
import { AiFillCaretDown, AiFillCaretUp, AiOutlineClose } from 'react-icons/ai';
import { BiMenuAltRight } from 'react-icons/bi';
import { FcGoogle } from 'react-icons/fc';
import {
	VscDiffAdded,
	VscHome,
	VscInfo,
	VscPerson,
	VscSignIn,
	VscTriangleDown
} from 'react-icons/vsc';
import { SocialsProvider } from 'remix-auth-socials';
import logo from '~/images/kamoos.svg';
import { useModalStore } from '~/root';
import { useOptionalUser } from '~/utils';

export default function Nav() {
	const user = useOptionalUser();
	const { openModal } = useModalStore();
	const [isNavOpen, setIsNavOpen] = useState(false);

	return (
		<>
			<nav className="flex items-center justify-between py-7">
				<Link to="/">
					<img src={logo} alt="Logo" />
				</Link>
				<div className="hidden gap-x-6 md:flex md:items-center">
					<Link to="/" className="hover:underline">
						Beranda
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
									{({ close }) => (
										<>
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
												onSubmit={() => close()}
											>
												<button
													type="submit"
													className="w-full px-6 py-3 text-left"
												>
													Keluar
												</button>
											</Form>
										</>
									)}
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
											className="flex flex-row items-center gap-x-2 px-6 py-3"
										>
											<FcGoogle className="text-xl" />
											<span className="w-fit">Masuk dengan Google</span>
										</button>
									</Form>
								</Popover.Panel>
							</Popover>
						)}
					</div>
				</div>
				<button
					className="block md:hidden"
					onClick={() => setIsNavOpen(prev => !prev)}
				>
					<BiMenuAltRight className="text-4xl" />
				</button>
			</nav>
			<Dialog
				open={isNavOpen}
				className="relative z-50 md:hidden"
				onClose={() => setIsNavOpen(false)}
			>
				<div className="fixed inset-0 bg-black/30" aria-hidden="true" />
				<div className="fixed inset-0 flex justify-end">
					<Dialog.Panel className="w-72 border-l border-black bg-white">
						<div className="flex items-center justify-between border-b border-black px-4 py-2">
							<Dialog.Title>Menu</Dialog.Title>
							<button onClick={() => setIsNavOpen(false)}>
								<AiOutlineClose className="text-lg" />
							</button>
						</div>
						<div className="flex flex-col gap-y-4 px-4 pt-8">
							<Link
								to="/"
								className="flex items-center gap-x-2"
								onClick={() => setIsNavOpen(false)}
							>
								<VscHome className="text-2xl" />
								<span>Beranda</span>
							</Link>
							{user ? (
								<>
									<Popover>
										{({ open }) => (
											<>
												<Popover.Button className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-2">
													<VscPerson className="text-2xl" />
													<span className="text-left">{user.username}</span>
													{open ? <AiFillCaretUp /> : <AiFillCaretDown />}
												</Popover.Button>
												<Popover.Panel className="mt-4 grid grid-cols-[1.5rem_1fr] items-center gap-x-2 gap-y-4">
													<Popover.Button
														as={Link}
														to="/my-definitions"
														className="col-start-2 col-end-2"
														onClick={() => setIsNavOpen(false)}
													>
														Definisiku
													</Popover.Button>
													<Popover.Button
														as={Link}
														to="/profile"
														className="col-start-2"
														onClick={() => setIsNavOpen(false)}
													>
														Profil
													</Popover.Button>
													<Form
														method="post"
														action="/logout"
														className="col-start-2"
														onSubmit={() => setIsNavOpen(false)}
													>
														<button type="submit">Keluar</button>
													</Form>
												</Popover.Panel>
											</>
										)}
									</Popover>
									<Link
										to="/create"
										className="flex items-center gap-x-2"
										onClick={() => setIsNavOpen(false)}
									>
										<VscDiffAdded className="text-2xl" />
										<span>Tambah definisi</span>
									</Link>
								</>
							) : (
								<>
									<Popover>
										{({ open }) => (
											<>
												<Popover.Button className="flex w-full items-center gap-x-2">
													<VscSignIn className="text-2xl" />
													<span className="flex-1 text-left">Masuk</span>
													{open ? <AiFillCaretUp /> : <AiFillCaretDown />}
												</Popover.Button>
												<Popover.Panel className="mt-4 flex flex-col">
													<Form
														method="post"
														action={`/auth/${SocialsProvider.GOOGLE}`}
													>
														<button
															type="submit"
															className="flex flex-row items-center gap-x-2"
														>
															<FcGoogle className="text-2xl" />
															<span>Masuk dengan Google</span>
														</button>
													</Form>
												</Popover.Panel>
											</>
										)}
									</Popover>
									<button
										onClick={openModal}
										className="flex items-center gap-x-2"
									>
										<VscDiffAdded className="text-2xl" />
										<span>Tambah definisi</span>
									</button>
								</>
							)}
							<Link
								to="/about"
								className="flex items-center gap-x-2"
								onClick={() => setIsNavOpen(false)}
							>
								<VscInfo className="text-2xl" />
								<span>Tentang</span>
							</Link>
						</div>
					</Dialog.Panel>
				</div>
			</Dialog>
		</>
	);
}
