import { getStorage, ref, getDownloadURL } from "firebase/storage";

export async function getImageUrl(imageName: string){
    const storage = getStorage();
    const imageRef = ref(storage, imageName);

    try {
        const imageUrl = await getDownloadURL(imageRef);
        return imageUrl;
    } catch (error) {
        console.error('Error getting image URL:', error);
    }
}

export async function getDocumantUrl(documentName: string){
    const storage = getStorage();
    const imageRef = ref(storage, documentName);

    try {
        const imageUrl = await getDownloadURL(imageRef);
        return imageUrl;
    } catch (error) {
        console.error('Error getting image URL:', error);
    }
}