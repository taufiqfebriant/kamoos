import { Dialog } from '@headlessui/react';
import { useState } from 'react';

export default function Cobak() {
	const [isOpen, setIsOpen] = useState(true);

	return (
		<Dialog
			open={isOpen}
			onClose={() => setIsOpen(false)}
			className="relative z-50"
		>
			<div className="fixed inset-0 bg-black/30" aria-hidden="true" />
			<div className="fixed inset-0 flex items-center justify-center p-4">
				<Dialog.Panel className="border border-black bg-white px-8 py-4 text-center">
					<Dialog.Title className="font-bold">Ups</Dialog.Title>
					<Dialog.Description className="mt-2">
						Kamu harus masuk dulu
					</Dialog.Description>
					<button
						onClick={() => setIsOpen(false)}
						className="mt-4 border border-black bg-yellow-400 px-4 py-2"
					>
						Masuk
					</button>
				</Dialog.Panel>
			</div>
		</Dialog>
	);
}
