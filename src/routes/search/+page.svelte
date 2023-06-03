<script lang="ts" xmlns="http://www.w3.org/1999/html">
    import {onMount} from 'svelte';
    import {getStorage, ref, getDownloadURL} from "firebase/storage";
    import {db} from '$firebase/firebase.ts';
    import {getDocs, collectionGroup, query, where} from '@firebase/firestore';
    import type {DocumentData} from '@firebase/firestore';
    import {getImageUrl, getDocumantUrl} from '$lib/helper/firebaseStorage.ts';
    import UploadButton from "$lib/UploadButton.svelte";
    import Icon from "@iconify/svelte";
    import {FileButton} from "@skeletonlabs/skeleton";

    let search: string = '';
    let results: DocumentData[] = [];

    async function searchFirestore(): Promise<void> {
        try {
            if (search === '') {
                //results = [];
                return;
            }

            let searches: string[] = search.toLowerCase().split(' ');
            const docRef = collectionGroup(db, 'documents');

            const keywords = await query(docRef, where('keywords', 'array-contains-any', searches));

            const querySnapshot = await getDocs(keywords);

            results = await Promise.all(querySnapshot.docs.map(async doc => {


                const data = doc.data();
                const imageUrl = await getImageUrl(data.thumbnail);
                const documentUrl = await getDocumantUrl(data.path + data.selecedFile);
                return {id: doc.id, imageUrl, documentUrl, ...data};
            }));

            console.log(results);
        } catch (error) {
            console.log(error);
        }
    }
</script>

<style>
    .form__group {
        position: relative;
        padding: 15px 0 0;
        margin-top: 10px;
        width: 100%;
    }

    .form__field {
        font-family: inherit;
        width: 100%;
        border: 0;
        border-bottom: 2px solid #9b9b9b;
        outline: 0;
        font-size: 1.3rem;
        color: #fff;
        padding: 7px 0;
        background: transparent;
        transition: border-color 0.2s;
    }

    .form__field::placeholder {
        color: transparent;
    }

    .form__field:placeholder-shown ~ .form__label {
        font-size: 1.3rem;
        cursor: text;
        top: 20px;
    }

    .form__label {
        position: absolute;
        top: 0;
        display: block;
        transition: 0.2s;
        font-size: 1rem;
        color: #9b9b9b;
    }

    .form__field:focus {
        padding-bottom: 6px;
        font-weight: 700;
        border-width: 3px;
        border-image: linear-gradient(to right, #11998e, #38ef7d);
        border-image-slice: 1;
    }

    .form__field:focus ~ .form__label {
        position: absolute;
        top: 0;
        display: block;
        transition: 0.2s;
        font-size: 1rem;
        color: #11998e;
        font-weight: 700;
    }

    .form__field:required,
    .form__field:invalid {
        box-shadow: none;
    }

/*    body {
        font-family: 'Poppins', sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        font-size: 1.5rem;
        background-color: #222222;
    }*/
</style>
<div class="w-1/2 mx-auto content-center ">
    <div class="content-center">
        <div class="flex justify-center grid grid-cols-12">

            <div class="col-span-10 ">
                <div class="form__group field w-full">
                    <input type="input" bind:value={search} on:input={searchFirestore} placeholder="Search..."
                           class="form__field" name="name" id='name' required/>
                    <label for="name" class="form__label">Search</label>
                </div>
            </div>
            <div class="col-span-2 my-auto">
                <UploadButton/>
            </div>
        </div>
    </div>
</div>
<div class="w-2/3 mx-auto content-center ">
    <div class="content-center">

        <div class="py-4 grid grid-cols-6 gap-4">

            {#each results as result, index (result.id)}
                <a href="/chat/">
                    <div class="card">
                        <header class="card-header">
                            <p class="card-header-title">
                                {result.title}
                            </p>
                        </header>
                        <section class="p-4 flex justify-center content-center">
                            <a href="{result.documentUrl}" target="_blank" rel="noopener">
                                <img src="{result.imageUrl}" alt="Document Image"/>
                            </a>
                        </section>
                        <footer class="card-footer">{result.selectedFile}
                        </footer>
                    </div>
                </a>
            {/each}

        </div>

    </div>
</div>
