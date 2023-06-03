//@ts-nocheck - show error for missing import but finds it anyway
import {_parsePdf} from '$lib/pdf-parse';
import {json} from "@sveltejs/kit";
import { PineconeClient } from "@pinecone-database/pinecone";
import {VectorDBQAChain, ConversationChain, loadQAChain, loadQAStuffChain} from "langchain/chains";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { SerpAPI } from "langchain/tools";
import { Calculator } from "langchain/tools/calculator";
import { initializeAgentExecutorWithOptions } from "langchain/agents";


export async function POST({request}) {
    try {
        const {userQuery, existingConversation}  = await request.json();

        const client = new PineconeClient();
        await client.init({
            apiKey: import.meta.env.VITE_PINECONE_API_KEY,
            environment: import.meta.env.VITE_PINECONE_ENV,

        });
        const pineconeIndex = client.Index("budget2023" );

        /*const tools = [
            new SerpAPI(import.meta.env.VITE_SERPAPI_API_KEY, {
                hl: 'en',
                gl: 'uk',
                location: 'Australia',
            }),
            new Calculator(),
        ];*/

        const vectorStore = await PineconeStore.fromExistingIndex(
            new OpenAIEmbeddings({ openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY, verbose: true,}),
            {pineconeIndex}
        );


        var model = new OpenAI({
            openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
            temperature: 0.9,
            engine: 'text-davinci-003',
            //verbose: true,
            streaming: true,
        });

        /*const agentExecutor = await initializeAgentExecutorWithOptions(tools, model, {
            agentType: 'chat-zero-shot-react-description',
            verbose: true,
        });


        const vectorChain = VectorDBQAChain.fromLLM(model, vectorStore, {
            k: 6,
            returnSourceDocuments: true,
        });*/


        const chain = new loadQAStuffChain(model, {verbose: false});


        if(!existingConversation.length) {
            existingConversation.push({
                role: 'system',
                content: 'You are a tax expert that can answer questions about the 2023 Australian budget.'
            });
        }

        // To use the chain in a conversation, pass in the user query and any existing conversation history.
        var docs = await vectorStore.similaritySearch(userQuery, 6);


        const publications = Object.entries(docs)
            .map(([key, value]) => ({
                title: value.metadata['pdf.info.Title'],
                author: value.metadata['pdf.info.Author'],
            }))
            .filter(
                (value, index, self) =>
                    index ===
                    self.findIndex(
                        (v) => v.title === value.title && v.author === value.author
                    )
            );

        let response = await chain.call( { input_documents: docs, question: userQuery, conversation_history: existingConversation} );

        existingConversation.push({role: 'system', content: userQuery});
        existingConversation.push({role: 'system', response: response});

        console.log("existingConversatione", existingConversation);
        console.log("publications", publications);
        console.log("%cOpenAI question : " + userQuery ,'background: #222; color: #bada55');
        console.log("OpenAI response", response.text);
        let bodyResponse = {
            answer: response.text,
            existingConversation: existingConversation,
            publications: publications,
        }
        return json({
            status: 200,
            body: bodyResponse
        });
    } catch (error) {
        console.error(error);
        return {
            status: 500,
            body: 'Failed to parse PDF',
        };
    }

    return {
        status: 200,
        body: {
            message: 'PDF parsing successful',
        },
    };
}
