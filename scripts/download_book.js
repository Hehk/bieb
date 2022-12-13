#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fetch from 'node-fetch';
import fs from 'fs';

yargs(hideBin(process.argv))
	.command({
		command: 'download [bookId]',
		describe: 'Download a book',
		builder: {
			bookId: {
				describe: 'The book ID',
				demandOption: true,
				type: 'string'
			}
		},
		handler(argv) {
			downloadBook(argv.bookId);
		}
	})
	.command({
		command: 'index',
		describe: 'Downloads the index of all the books',
		handler() {
			downloadIndex();
		}
	})
	.help().argv;

function removeEnd(str) {
	const indexOfEnd = str.lastIndexOf('*** END OF THE PROJECT GUTENBERG');
	return str.slice(0, indexOfEnd);
}

function removeStart(str) {
	const regex = /(\*\*\* START OF THE PROJECT GUTENBERG EBOOK .+ \*\*\*)/g;
	const endOfStart = str.search(regex) + regex.exec(str)[0].length;
	return str.slice(endOfStart);
}

async function downloadBook(bookId) {
	try {
		const response = await fetch(`http://gutendex.com/books/${bookId}`);
		const book = await response.json();
		const downloadLink = book.formats['text/plain; charset=utf-8'];

		const downloadResponse = await fetch(downloadLink);
		const text = await downloadResponse.text();
		fs.writeFile(`./books/${bookId}.txt`, removeStart(removeEnd(text)).trim(), (err) => {
			if (err) throw err;
			console.log('The file has been saved!');
		});
	} catch (error) {
		console.error(error);
	}
}

async function downloadIndex() {
	try {
		const response = await fetch('http://gutendex.com/books');
		const books = await response.json();
		fs.writeFile('./books/index.json', JSON.stringify(books), (err) => {
			if (err) throw err;
			console.log('The file has been saved!');
		});
	} catch (error) {
		console.error(error);
	}
}
