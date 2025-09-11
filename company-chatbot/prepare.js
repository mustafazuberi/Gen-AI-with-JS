import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function indexTheDocument(filePath) {
    const loader = new PDFLoader(filePath, { splitPages: false });
    const doc = (await loader.load())[0].pageContent;

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 100,
    });

    const texts = await textSplitter.splitText(doc);
    console.log('length of texts', texts.length);
}
