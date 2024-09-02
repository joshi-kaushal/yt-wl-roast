import { GoogleGenerativeAI } from "@google/generative-ai"
import { getGeminiAPIKey} from "./storage";

export async function executeAI(data: string) {
	if (!data) return "";

	const GEMINI_API_KEY: string = await getGeminiAPIKey();
	const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
	const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

	try {
		const prompt = `Analyze the YouTube Watch Later playlist of the user and provide a brutally honest, comedic critique of its content, style, and overall taste. Be as insulting and hilarious as possible, sparing no details. Do it in three paragraphs at max. ${data}`
		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text();

		return text;
	} catch (e: unknown) {
		console.error((e as Error).message)
		throw new Error("Something went wrong while connecting to backend")
	}
}
