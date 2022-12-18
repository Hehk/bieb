#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fetch from 'node-fetch';
import fs from 'fs';
import parser from '../src/lib/book_parser.mjs';

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

async function downloadEpub(book) {
	const link = book.formats['application/epub+zip'];
	const content = await fetch(link);
	console.log(await content.body());
}

async function downloadBook(bookId) {
	try {
		const url = `http://gutendex.com/books/${bookId}`;
		const response = await fetch(url);
		const book = await response.json();
		const downloadLink =
			book.formats['text/plain; charset=utf-8'] ||
			book.formats['text/plain;'] ||
			book.formats['text/plain; charset=us-ascii'] ||
			book.formats['text/plain'];

		const downloadResponse = await fetch(downloadLink);
		const text = await downloadResponse.text();
		const bookContent = parser(book, text);
		fs.writeFile(`./books/${bookId}.json`, JSON.stringify(bookContent), (err) => {
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
