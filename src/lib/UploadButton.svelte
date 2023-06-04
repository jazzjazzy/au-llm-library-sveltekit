<script lang="ts">

    import {storage} from '$firebase/firebase.js';
    import {ref, uploadBytes} from "firebase/storage";
    import {FileButton} from '@skeletonlabs/skeleton';
    import Icon from '@iconify/svelte';

    let selectedFile;
    let message = '';
    let messageClass = '';

    // Handles file upload
    /** @type {import('./$types').PageLoad} */
    export async function handleUpload(event) {

        try {
            selectedFile = event.target.files[0];

            const file = selectedFile;
            // Generate a unique file name or use the original file name
            const fileName = file.name;

            message = `uploading ${fileName}...`;
            messageClass = "variant-glass-success";

            // Get a reference to the Firebase Storage bucket and specify the file path

            const storageRef = ref(storage, '/uploads/' + fileName);

            let uploaded = await uploadBytes(storageRef, file);
            message = "upload successful! compiling data...";
            messageClass = "variant-glass-success";

            await handleSubmit(fileName);


        } catch (error) {
            // Handle any errors that occur during the upload
            message = error;
            messageClass = "variant-glass-error";
        }
    }


    // Submit form
    export async function handleSubmit(fileName) {
        try {
            const response = await fetch(`/api/parse-pdf?fileName=${fileName}`);
            if (response.ok) {
                message = "upload successful!";
                messageClass = "variant-glass-success";
                console.log('PDF parsing successful!');
            } else {
                throw new Error(response.body);
            }
        } catch (error) {
            message = error;
            messageClass = "variant-glass-error";
            console.error(error);
            throw new Error(error);
        }
    }

</script>

<div class="w-1/2 mx-auto content-center ">
    <div class="content-center">
        <div class="flex justify-center">
            <form on:submit|preventDefault={handleSubmit}>
                <FileButton name="files" on:change={handleUpload}>UPLOAD
                    <Icon width="1em" height="1em" class="ml-2" icon="solar:upload-outline"/>
                </FileButton>
                <aside id="message" class="alert {messageClass} p-1 m-2 {message ? '' : 'hidden'}">
                    <div class="alert-message p-0">{message}</div>
                </aside>
            </form>
        </div>
    </div>
</div>