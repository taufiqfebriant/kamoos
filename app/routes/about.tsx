import type { MetaFunction } from '@remix-run/node';
import { title } from '~/utils';

export const meta: MetaFunction = () => ({
	title: `Tentang - ${title}`
});

export default function About() {
	return (
		<main className="rounded-lg border border-black bg-white">
			<div className="border-b border-b-black py-3 px-8">
				<h1 className="text-sm">Tentang</h1>
			</div>
			<div className="py-3 px-8">
				<p>
					kamoos adalah kamus online untuk kata dan istilah yang viral, yang
					kita temui di twitter, yang teman kita ucapkan, dan lain-lain. Pada
					dasarnya,{' '}
					<a
						href="https://www.urbandictionary.com"
						className="text-blue text-cyan-600 hover:underline"
						target="_blank"
						rel="noreferrer"
					>
						Urban Dictionary
					</a>{' '}
					versi Indonesia.
				</p>

				<p className="mt-4">Dibuat oleh Taufiq</p>

				<p className="mt-4">Tautan:</p>
				<ul className="ml-4 list-disc">
					<li>
						<a
							href="https://twitter.com/taufiqfebriant"
							className="text-blue text-cyan-600 hover:underline"
							target="_blank"
							rel="noreferrer"
						>
							Twitter
						</a>
					</li>
					<li>
						<a
							href="https://github.com/taufiqfebriant"
							className="text-blue text-cyan-600 hover:underline"
							target="_blank"
							rel="noreferrer"
						>
							GitHub
						</a>
					</li>
				</ul>
			</div>
		</main>
	);
}
