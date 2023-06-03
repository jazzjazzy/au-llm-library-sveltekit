//@ts-nocheck - show error for missing import but finds it anyway
import {_parsePdf} from '$lib/pdf-parse';
import {json} from "@sveltejs/kit";
import {PineconeClient} from "@pinecone-database/pinecone";
import {OpenAIEmbeddings} from "langchain/embeddings/openai";
import {PineconeStore} from "langchain/vectorstores/pinecone";

export async function GET({url}: { url: string }) {
    try {
        console.log(url);
        const myUrl = new URL(url);
        const searchParams = new URLSearchParams(myUrl.search);
        const fileName = searchParams.get("fileName");
        console.log(fileName);
        const DocumentRecord = await _parsePdf(fileName);

        const embeddings = new OpenAIEmbeddings({openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY});
        const pinecone = new PineconeClient();
        await pinecone.init({
            apiKey: import.meta.env.VITE_PINECONE_API_KEY,
            environment: import.meta.env.VITE_PINECONE_ENV,
        });
        const pineconeIndex = pinecone.Index("budget2023");

        await PineconeStore.fromDocuments(DocumentRecord, embeddings, {
            pineconeIndex,
        });

        return json({
            status: 200,
            body: 'PDF parsing successful',
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
