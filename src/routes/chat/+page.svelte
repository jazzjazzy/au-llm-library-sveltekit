<script lang="ts">

    import { onMount } from 'svelte';
    import { createSpinnerSVG } from "$lib/spinner.helper.js";
    import { db } from "$firebase/firebase.js";
    import {collectionGroup, getDocs, query, where} from "@firebase/firestore";
    import { getStorage, ref, getDownloadURL } from "firebase/storage";
    import Icon from '@iconify/svelte';

    // keep track of the conversation
    let existingConversation = [];
    let scrollContainer;

    onMount(() => {
        scrollContainer = document.getElementById('responseBody');
    });


    async function handleSubmit(event: Event) {
        event.preventDefault();

        //get the user question
        const questionInput = document.getElementById('questionInput');
        const userQuery = questionInput.value;
        questionInput.value = '';

        //add the question to the conversation
        addQuestionBlock(userQuery)

        //send the question to the server
        let response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({userQuery, existingConversation})
        });

        //get the answer from the server
        let {body} = await response.json();
        console.log('body', body);
        //update the conversation
        existingConversation = body.existingConversation;

        //add the answer to the conversation
        addAnswerBlock(body.answer, body.publications)

        //scroll to the bottom of the div
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }

    function addQuestionBlock(questionText){

        let responseBody = document.getElementById('responseBody') as HTMLDivElement;

        var questionContainer = document.createElement("div");
        questionContainer.classList.add("flex", "justify-end", "w-full");
        var question = document.createElement("div");

        question.textContent = questionText;
        question.classList.add("bg-green-700", "w-5/6", "rounded-t-2xl", "rounded-l-2xl", "p-4", "m-4", "text-grey-500");
        questionContainer.appendChild(question);

        responseBody.appendChild(questionContainer);


        //add the spinner to the conversation
        let svg = createSpinnerSVG();
        const spinner = document.createElement("div");
        spinner.classList.add("class", "flex","items-center", "justify-center");
        spinner.appendChild(svg);

        responseBody.appendChild(spinner);

        //scroll to the bottom of the div
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }

    async function addAnswerBlock(answerText, publications = []){
        let responseBody = document.getElementById('responseBody') as HTMLDivElement;

        //remove the spinner from the conversation
        responseBody.removeChild(responseBody.lastChild);

        var answerContainer = document.createElement("div");
        answerContainer.classList.add("flex", "justify-start", "w-full");
        var answer = document.createElement("div");
        answer.innerHTML = answerText;

        if (publications.length > 0) {


            const publicationPills = await getPublicationPills(publications);
            answer.innerHTML += "<div class='flex flex-wrap mt-3 '>" + publicationPills + "</div>";
        }

        answer.classList.add("bg-blue-500", "w-5/6", "rounded-t-2xl", "rounded-r-2xl", "float-left", "p-4", "m-4", "text-grey-500");


        answerContainer.appendChild(answer);
        responseBody.appendChild(answerContainer);

        //scroll to the bottom of the div
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }

    async function getPublicationPills(publications){
            let innerHTML = "";

            const docRef = collectionGroup(db, 'documents');

            for (const item of publications) {
                const keywords = await query(docRef, where('title', '==', item.title));
                const querySnapshot = await getDocs(keywords);

                let results = await Promise.all(querySnapshot.docs.map(async doc => {
                    console.log(doc.data());
                    return doc.data();
                }));

                if(results.length > 0) {
                    const path = results[0].path + results[0].selectedFile;

                    const storage = getStorage();
                    const imageRef = ref(storage, path);
                    const fileUrl = await getDownloadURL(imageRef);

                    innerHTML += `<span class='bg-blue-900 text-sm px-2 m-2 rounded-md'><a href='${fileUrl}' target='_blank'>${item.title} by ${item.author}</a></span>`;
                }
            }

            return innerHTML;
    }

    function handleKeyPress(event) {

        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault(); // Prevents the default behavior of the Enter key in the textarea
            handleSubmit(event);  // Call your form submission function here
        }
    }

</script>

<style>
    .container {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        overflow-y: auto; /* Enable vertical scrolling */
    }

    .content {
        flex-grow: 1;
        overflow-y: auto; /* Enable vertical scrolling */
    }
</style>
<main>

    <div class=" h-screen mx-auto content-center grid grid-rows-6 xs:w-1/2 p-4 sm:3/4 lg:w-2/3 ">
        <div class="flex flex-grow container col-span-full w-full row-span-5">
            <a href="\" class="py-3 text-lg z-10">
                <Icon class="text-4xl"icon="ph:arrow-left" />
            </a>
            <div class="content w-full" id="responseBody">

            </div>
        </div>
        <div class="row-span-1 pt-3">
            <form on:submit={handleSubmit} id="questionInputForm">
                <label for="questionInput"
                       class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your Question</label>
                <textarea on:keydown={handleKeyPress} id="questionInput" rows="4"
                          class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          placeholder="Write your thoughts here..."></textarea>
            </form>
        </div>
    </div>
</main>
