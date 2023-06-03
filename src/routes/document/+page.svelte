<script lang="ts">
    import {storage} from '$firebase/firebase.js';
    import {ref, uploadBytes} from "firebase/storage";
    import { FileButton } from '@skeletonlabs/skeleton';
    import Icon from '@iconify/svelte';


    let selectedFile;


    // Set the PDF worker from pdfjs-dist


    // Handles file upload
    /** @type {import('./$types').PageLoad} */
    export async function handleUpload(event) {

        selectedFile = event.target.files[0];
        const file = selectedFile;
        // Generate a unique file name or use the original file name
        const fileName = file.name;
        // Get a reference to the Firebase Storage bucket and specify the file path
        const storageRef = ref(storage, '/uploads/' + fileName);

        try {
            let uploaded = await uploadBytes(storageRef, file)
            console.log('Upload successful!', uploaded);
            await handleSubmit(fileName);
        } catch (error) {
            // Handle any errors that occur during the upload
            console.error('Upload error:', error);
        }
    }


    // Submit form
    export async function handleSubmit(fileName) {
        try {
            const response = await fetch(`/api/parse-pdf?fileName=${fileName}`);
            if (response.ok) {
                console.log('PDF parsing successful!');
            } else {
                throw new Error('PDF parsing failed');
            }
        } catch (error) {
            console.error(error);
            throw new Error('Failed to parse PDF');
        }
    }

</script>

<div class="w-1/2 mx-auto content-center ">
    <div class="content-center">
        <div class="flex justify-center">
            <form on:submit={handleSubmit}>
                <FileButton name="files" on:change={handleUpload} >UPLOAD<Icon width="1em" height="1em" class="ml-2" icon="solar:upload-outline" /></FileButton>

            </form>
        </div>
    </div>
</div>