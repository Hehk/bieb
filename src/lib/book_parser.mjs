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

function formatContent(content) {
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
	)(content);
}

function shortTitle(title) {
	if (title.length < 30) return title;
	if (title.includes(':')) title = title.split(':')[0];

	return title.slice(0, 30) + '...';
}

export default function parser(rawBook, content) {
	const paragraphs = formatContent(content);
	console.log(paragraphs);
	const book = {
		id: rawBook.id,
		title: rawBook.title,
		shortTitle: shortTitle(rawBook.title),
		authors: rawBook.authors.map((author) => author.name),
		link: `https://www.gutenberg.org/ebooks/${rawBook.id}`,
		content: paragraphs
	};

	return book;
}
