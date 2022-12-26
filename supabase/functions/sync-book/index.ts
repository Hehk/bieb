// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to dfinition, etc.

import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function removeEnd(str) {
	const indexOfEnd = str.lastIndexOf('*** END OF THE PROJECT GUTENBERG');
	return str.slice(0, indexOfEnd);
}

function removeStart(str) {
	const regex = /\*\*\* START OF THE PROJECT/g;
	const exec = regex.exec(str);
	console.log(str.slice(0, 5000));
	console.log(exec);
	if (!exec) return str;

	const endOfStart = str.search(regex) + exec[0].length;
	return str.slice(endOfStart);
}

function filterEmptyParagraphs(paragraphs) {
	return paragraphs.filter((paragraph) => paragraph !== '');
}

function removeMetadata(paragraphs) {
	return paragraphs.filter((p) => {
		p = p.trim().toLowerCase();
		const isChapterHeading =
			p.startsWith('chapter') ||
			p.startsWith('chap') ||
			p.startsWith('section') ||
			p.startsWith('part ') ||
			p.includes('***');
		return !isChapterHeading;
	});
}
const trimParagraphs = (paragraphs) => paragraphs.map((p) => p.trim());
const cleanWhitespace = (paragraphs) => paragraphs.map((p) => p.replace(/\s+/g, ' '));

const pipe =
	(...fns) =>
	(x) =>
		fns.reduce((v, f) => f(v), x);

function shortTitle(title) {
	if (title.length < 30) return title;
	if (title.includes(':')) title = title.split(':')[0];

	return title.slice(0, 30) + '...';
}

// TODO move this into its own file
const parserVersion = 1;
function parser(rawBook) {
	const trim = (str) => str.trim();
	const splitIntoParagraphs = (str) => str.split('\r\n\r\n');
	return pipe(
		removeStart,
		removeEnd,
		trim,
		splitIntoParagraphs,
		trimParagraphs,
		filterEmptyParagraphs,
		removeMetadata,
		cleanWhitespace
	)(rawBook);
}

function createSupabaseClient() {
	const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
	const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
	const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

	return supabaseClient;
}

async function fetchBook(supabase, bookId: string) {
	const { data, error } = await supabase.from('Books').select('*').eq('id', bookId);
	if (error) {
		throw new Response(JSON.stringify(error), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	if (!data || data.length === 0) {
		throw new Response(JSON.stringify({ message: 'Book not found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	return data[0];
}

function formatAuthor(author) {
	const name = author.name;
	if (name.includes(',')) {
		const [last, first] = name.split(',');
		return `${first.trim()} ${last.trim()}`;
	}
	return name;
}

const getDownloadLink = (metadata) => {
	const formats = [
		'text/plain; charset=utf-8',
		'text/plain;',
		'text/plain; charset=us-ascii',
		'text/plain'
	];
	const format = formats.find((f) => f in metadata.formats);
	if (!format)
		throw new Response(
			JSON.stringify({
				message: 'No supported format found'
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);

	return metadata.formats[format];
};

async function downloadGutenbergBook(book) {
	const metadataResponse = await fetch(`https://gutendex.com/books/${book.source_id}`);
	const metadata = await metadataResponse.json();
	const downloadLink = getDownloadLink(metadata);
	const bookResponse = await fetch(downloadLink);
	const rawBook = await bookResponse.text();

	return {
		id: metadata.id,
		title: metadata.title,
		shortTitle: shortTitle(metadata.title),
		authors: metadata.authors.map(formatAuthor),
		links: `https://www.gutenberg.org/ebooks/${metadata.id}`,
		paragraphs: parser(rawBook)
	};
}

function downloadBook(book) {
	switch (book.source) {
		case 'gutenberg':
			return downloadGutenbergBook(book);
		default:
			throw new Response(JSON.stringify({ message: 'Book source not supported' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
	}
}

async function insertBookContent(supabase, bookContent, bookId) {
	const content = {
		book_id: bookId,
		content: bookContent,
		created_at: new Date(),
		parser_version: parserVersion
	};

	let { data, error } = await supabase.from('book contents').select('*').eq('book_id', bookId);
	if (error) {
		throw new Response(JSON.stringify(error), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	const oldContent = data?.[0];
	if (oldContent) {
		if (oldContent.parser_version === parserVersion) return;

		const { error } = await supabase
			.from('book contents')
			.update({
				...content,
				book_id: bookId
			})
			.eq('book_id', bookId);
		if (error) {
			throw new Response(JSON.stringify(error), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		return;
	}

	({ error } = await supabase.from('book contents').upsert(content));

	if (error) {
		throw new Response(JSON.stringify(error), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	return;
}

serve(async (req: Request) => {
	try {
		const supabase = createSupabaseClient();
		const json = await req.json();
		const { record } = json;
		const bookId = record.id;
		const book = await fetchBook(supabase, bookId);
		const bookContent = await downloadBook(book);
		await insertBookContent(supabase, bookContent, bookId);

		return new Response(JSON.stringify(bookContent), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (e) {
		if (e instanceof Response) {
			return e;
		}
		return new Response(JSON.stringify(e), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
});
