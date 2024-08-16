import { GoogleGenerativeAI } from "@google/generative-ai"

export async function executeAI(data: string) {
	const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
	const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

	if (!data) return "";

	try {
		const prompt = `Analyze the YouTube Watch Later playlist of the user and provide a brutally honest, comedic critique of its content, style, and overall taste. Be as insulting and hilarious as possible, sparing no details. ${data}`
		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text();

		return text;
	} catch (e: unknown) {
		console.error((e as Error).message)
		throw new Error("Something went wrong while connecting to backend")
	}
}