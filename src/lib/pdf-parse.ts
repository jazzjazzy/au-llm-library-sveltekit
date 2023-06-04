import { error, json } from '@sveltejs/kit';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from '@firebase/firestore';
import { db } from '$firebase/firebase.js';
import { pdfToImage } from '$lib/pdf-cover-image.js';
import keyword_extractor from 'keyword-extractor';

interface WordCounts {
	[key: string]: number;
}

/** @type {import("./$types").PageServerLoad} */
export async function _parsePdf(selectedFile: string) {
	try {
		//connect to firebase storage and get the Url for the pdf file
		const path = '/uploads/';
		const storage = getStorage();
		const storageReference = ref(storage, path + selectedFile);
		const downloadURL: string = await getDownloadURL(storageReference);

		//get the pdf file from the url as a blob
		const response = await fetch(downloadURL);
		const pdfFileBlob = await response.blob();
		const file = new File([pdfFileBlob], selectedFile);

		//create thumbnail of the cover page of the pdf
		const thumbnail = await pdfToImage(pdfFileBlob, selectedFile);

		//parse the pdf file
		const loader = new PDFLoader(file, {
			splitPages: false
		});

		//get the title and author of the pdf assign to any[] | null so we empty it when done
		let docs: any[] | null = await loader.load();
		let pdfTitle = docs[0]?.metadata?.pdf?.info?.Title;
		let pdfAuthor = docs[0]?.metadata?.pdf?.info?.Author;
		docs = null;

		// define the Splitting of the text into chunks of 1000 characters, with no overlap
		var splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 0
		});

		// Load the PDF and split it into chunks
		const DocumentRecord = await loader.loadAndSplit(splitter);

		// Extract keywords and keywords counts from the text
		let { keywords, keywordsCount } = getKeyWordsfromPDF(DocumentRecord);

		if (pdfAuthor) {
			keywords.unshift(pdfAuthor.toLowerCase());
		}

		if (pdfTitle) {
			keywords.unshift(pdfTitle.toLowerCase());
		}

		// store the relevent pdf information in the firebase database
		await addDoc(collection(db, 'documents'), {
			selectedFile,
			path,
			thumbnail,
			keywords,
			keywordsCount,
			title: pdfTitle,
			author: pdfAuthor,
			createdAt: new Date()
		});

		return DocumentRecord;
	} catch (error) {
		// Handle error, e.g., display an error message
		throw new Error('Failed to parse PDF' + error);
	}
}

/**
 * Count the words in a Document and return the top 100 most frequent words
 * @param inputString
 */
function countWordsAndSort(inputString: string) {
	try {
		// Split string into array of words
		let wordsArray = inputString.toLowerCase().split(',');

		// Create an empty object to hold word counts
		let wordCounts: Record<string, number> = {};

		// Iterate over each word in the array
		wordsArray.forEach(function (word: string) {
			// If the word has been seen before, increment its count, otherwise initialize to 1
			// Ignore words that are less than 3 characters long
			if (word.length >= 3) {
				if (word in wordCounts) {
					wordCounts[word]++;
				} else {
					wordCounts[word] = 1;
				}
			}
		});

		// Convert wordCounts object into array of [word, count] pairs
		let wordCountPairs = Object.entries(wordCounts);

		// Sort the pairs by count in descending order
		wordCountPairs.sort(function (a, b) {
			return b[1] - a[1]; // Compare counts
		});

		// Convert the array of arrays into an object
		let wordCountObject: WordCounts = {};
		wordCountPairs.slice(0, 100).forEach((pair) => {
			wordCountObject[pair[0]] = pair[1];
		});

		// Return the top 20 most frequent words as an object
		return wordCountObject;
	} catch (error) {
		throw new Error('Failed to count keywords' + error);
	}
}

/**
 * Extract keywords from the pdf file
 * @param DocumentRecord
 */

function getKeyWordsfromPDF(DocumentRecord: any) {
	try {
		let words: string[] = [];
		DocumentRecord.map(function (value: string) {
			// @ts-ignore - keyword-extractor types are wrong
			words.push(
				keyword_extractor.extract(value.pageContent, {
					language: 'english',
					remove_digits: true,
					return_changed_case: true,
					remove_duplicates: false
				})
			);
		});

		let str = words.join(',');
		// @ts-ignore - keyword-extractor types are wrong
		let wordlist = keyword_extractor.extract(str, {
			language: 'english',
			remove_digits: true,
			return_changed_case: true,
			remove_duplicates: false
		});

		let keywordsCount = countWordsAndSort(wordlist[0]);
		// get the keywords as an array
		let keywords: string[] = Object.keys(keywordsCount);

		return { keywords, keywordsCount };
	} catch (err) {
		throw new Error('Failed to get keywords:' + err);
	}
}
