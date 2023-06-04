import { getStorage, ref, getDownloadURL } from 'firebase/storage';

/**
 * Get the Image from Firebase Storage using the image url
 * @param imageName
 */
export async function getImageUrl(imageName: string) {
	const storage = getStorage();
	const imageRef = ref(storage, imageName);

	try {
		const imageUrl = await getDownloadURL(imageRef);
		return imageUrl;
	} catch (error) {
		console.error('Error getting image URL: ' + imageName, error);
		throw new Error('Error getting image URL: ' + imageName + ' - ' + error);
	}
}

/**
 * Get the Document from Firebase Storage using the document url
 * @param documentName
 */
export async function getDocumentUrl(documentName: string) {
	const storage = getStorage();
	const documentRef = ref(storage, documentName);

	try {
		const documentUrl = await getDownloadURL(documentRef);
		return documentUrl;
	} catch (error) {
		console.error('Error getting Document URL: ' + documentName, error);
		throw new Error('Error getting Document URL: ' + documentName + ' - ' + error);
	}
}
