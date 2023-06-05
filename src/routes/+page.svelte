<script lang="ts" xmlns="http://www.w3.org/1999/html">
  import { onMount } from "svelte";
  import { getStorage, ref, getDownloadURL } from "firebase/storage";
  import { db } from "$firebase/firebase.ts";
  import { getDocs, collectionGroup, query, where } from "@firebase/firestore";
  import type { DocumentData } from "@firebase/firestore";
  import { getImageUrl, getDocumentUrl } from "$lib/helper/firebaseStorage.ts";
  import UploadButton from "$lib/UploadButton.svelte";
  import Icon from "@iconify/svelte";
  import { FileButton } from "@skeletonlabs/skeleton";

  let search: string = "";
  let results: DocumentData[] = [];
  let message: string = "";
  let messageClass: string = "";

  const dev = (import.meta.env.MODE === "development");

  onMount(async () => {
    await searchFirestore();
  });

  async function searchFirestore(): Promise<void> {
    try {
      if (search === "") {
        let searches: string[] = search.toLowerCase().split(" ");
        const docRef = collectionGroup(db, "documents");

        const keywords = await query(docRef);

        const querySnapshot = await getDocs(keywords);

        results = await Promise.all(querySnapshot.docs.map(async doc => {
          const data = doc.data();
          if (data.selectedFile === undefined) {
            return;
          }
          const imageUrl = await getImageUrl(data.thumbnail);
          const documentUrl = await getDocumentUrl(data.path + data.selectedFile);
          return { id: doc.id, imageUrl, documentUrl, ...data };
        }));
      } else {

        let searches: string[] = search.toLowerCase().split(" ");
        const docRef = collectionGroup(db, "documents");

        const keywords = await query(docRef, where("keywords", "array-contains-any", searches));

        const querySnapshot = await getDocs(keywords);

        results = await Promise.all(querySnapshot.docs.map(async doc => {
          const data = doc.data();
          if (data.selectedFile === undefined) {
            return;
          }
          const imageUrl = await getImageUrl(data.thumbnail);
          const documentUrl = await getDocumentUrl(data.path + data.selectedFile);
          return { id: doc.id, imageUrl, documentUrl, ...data };
        }));
      }
    } catch (error) {
      message = error;
      messageClass = "variant-glass-error";

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

    .doc-card:hover {
        box-shadow: 0 0 21px rgba(33, 333, 333, .2);
    }

    .doc-card {
        transition: box-shadow .3s ease-in-out;
    }

    .doc-card-image:hover {
        box-shadow: 0 0 18px rgba(333, 333, 333, .5);
    }

    .doc-card-image {
        transition: box-shadow .3s ease-in-out;
    }

    li{
        margin-left: 1em;
        list-style-type: number;
    }

    h1{
        @apply text-2xl pt-3 mb-3 w-full border-b-2;
    }

    h2{
        @apply ml-2 text-xl pt-3 mb-3 w-fit border-b-2;
    }


</style>

<div class="w-1/2 mx-auto content-center ">
  <div class="content-center">
    <div class="flex justify-center grid grid-cols-12">
      <div class="col-span-10 ">
        <div class="form__group field w-full">
          <input type="input" bind:value={search} on:input={searchFirestore} placeholder="Search..."
                 class="form__field" name="name" id="name" required />
          <label for="name" class="form__label">Keyword lookup</label>
        </div>
        <aside id="message" class="alert {messageClass} p-1 m-2 {message ? '' : 'hidden'}">
          <div class="alert-message p-0">{message}</div>
        </aside>
      </div>

      <div class="col-span-2 my-auto">
        <a href="/chat/" class="m-2">
          <Icon width="3em" height="3em" class="ml-6" icon="bi:chat" />
        </a>
        {#if dev}
          <UploadButton />
        {/if}
      </div>
    </div>
  </div>
</div>
<div class=" mx-auto w-full p-4 md:w-full lg:w-1/2 xl:w-2/3">
  <div class="flex justify-center">

    <div class="py-4 flex flex-wrap justify-center lg:justify-start">
      {#each results as result, index (result.id)}
        <a href="/chat/" class="m-2">
          <div class="card h-full w-[190px] doc-card">
            <header class="card-header flex-grow">
              <p class="card-header-title">
                {result.title}
              </p>
            </header>
            <section class="p-4 flex justify-center content-center flex-none">
              <a href="{result.documentUrl}" target="_blank" rel="noopener">
                <img src="{result.imageUrl}" alt="Document Image" class="doc-card-image" />
              </a>
            </section>
            <footer class="card-footer flex-grow">
              {result.selectedFile}
            </footer>
          </div>
        </a>
      {/each}
    </div>
    <div>
      <h1>So what is this?</h1>
      <p>
        It's a tool I made to help anyone understand the 2023-24 national Australian budget by asking questions and getting answers.
        There are two sections to this tool:
      </p>
      <ol>
        <li>
          <strong>Keyword Lookup:</strong> The search bar above allows you to search the budget PDF for keywords. It will return any documents that match the search query.
        </li>
        <li>
          <strong>Chatbot:</strong> You can access the chatbot by clicking on the chat icon  (<a href="/chat/" class="p-0 m-0"><Icon width="1em" height="1em" class="inline" icon="bi:chat" /></a>). The chatbot allows you to ask questions about the budget and get answers.
        </li>
      </ol>
      <p>
        Feel free to explore both sections and make the most of this tool!
      </p>
      <h1>Why did I make this?</h1>
      <p>I was looking for a project to work on and I thought it would be interesting to see if I could make a chatbot that could answer questions about the budget.
        I also wanted to use some new technologies that where a bit out there but seemed interesting. So I decided to use Svelte/sveltekit, pineCone vector database, tailwindcss, firebase hosting, firebase storage, firebase firestore </p>

      <h2>Svelte/Sveltekit</h2>
      <p>
        Svelte is a javascript framework that is similar to react and vue. It is a compiler that compiles your code into vanilla javascript. This means that you don't need to include a framework in your final build.
        This makes the final build smaller and faster. Sveltekit is a framework that is built on top of svelte. It allows you to build a website using svelte. It has only come out of beta in Dec 22 but it is very
        easy to use and I would recommend it.
      </p>

      <h2>TailwindCss</h2>
      <p>
        TailwindCss is a css framework that allows you to build a website using css classes. It is very easy to use and allows you to build a website very quickly. It also allows you to build a website that is responsive
        and looks good on all devices. This was the only thing I had used before this project but only a couple months earlier.
      </p>

      <h2>FireBase</h2>
      <p>
        so firebase is just a google product that give you an simple and easy interface to utilise their google cloud services and is free and easy to use. for this project
        I used firebase storage to store the PDFs and images, firestore to store the metadata. and firebase hosting to host the website.
      </p>

      <h2>PineCone Vector database</h2>
      <p>
        we use PineCone to store the embedding vectors for each document. PineCone is a vector database that allows you to store and search for vectors. This is not the same as a relational database,
        when we create embedding this changes the test to a series of number that represent the text. so we can't use a relational database to store these vectors. when we search for a question we convert the question
        to a vector and then search the vector database for the closest vectors to the keyword vector.
      </p>

      <h2>LangChain</h2>
      <p>
        LangChain is a python/javascript library that allows is the work horse of this project. It allows us to extract the text from the PDF, convert the text to embedding vectors and chain together chatGPT and pineCone,
        We use it to extract the text from the PDF, convert the text to embedding vectors store in pineCone. when we ask a question we convert the question to a vector and then search pineCone for the closest vectors to
        the question vector and then we use chatGPT to generate a response to the question based on responses from pinecone
      </p>

      <h2>Where can I see the code </h2>
      <p>
        The code for this project is available on github <a href="https://github.com/jazzjazzy/au-llm-library-sveltekit" target="_blank" rel="noopener"> <Icon width="2em" height="2em" class="inline ml-2 mr-1 text-white" icon="arcticons:github" />https://github.com/jazzjazzy/au-llm-library-sveltekit</a>
      </p>

    </div>

  </div>

</div>




