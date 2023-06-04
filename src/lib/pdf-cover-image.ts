import { createCanvas } from 'canvas';
import pdfjsLib from 'pdfjs-dist';
import { getStorage, ref, uploadBytes } from 'firebase/storage';

export async function pdfToImage(pdfBlob: Blob, fileName: String) {
	try {
		// Load the PDF document from blob
		const arrayBuffer = await new Response(pdfBlob).arrayBuffer();
		const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

		const filenameWithoutExtension = fileName.split('.').slice(0, -1).join('.');

		// Get the first page
		const page = await pdf.getPage(1);

		// Create a canvas to render the page
		const viewport = page.getViewport({ scale: 0.125 });
		const canvas = createCanvas(viewport.width, viewport.height);
		const canvasContext = canvas.getContext('2d');

		// Render the page
		await page.render({ canvasContext: canvasContext, viewport }).promise;

		// Get image data from the canvas
		const imageData = canvas.toBuffer();

		// Convert the data to a Uint8Array that Firebase can handle
		const imageUint8Array = new Uint8Array(imageData);

		// Create a reference to the location in Firebase Storage where you want to store the file
		const storage = getStorage();
		const storageRef = ref(storage, '/images/' + filenameWithoutExtension + '.png');

		// Upload the file to Firebase Storage

		const snapshot = await uploadBytes(storageRef, imageUint8Array);
		console.log('Uploaded image!', snapshot.metadata.fullPath);
		return snapshot.metadata.fullPath;
	} catch (error) {
		throw new Error('Error uploading image: ' + error);
	}
}
