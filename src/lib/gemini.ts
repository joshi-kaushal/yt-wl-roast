import { BACKEND_URL, SHARED_SECRET } from "./config";

export async function executeAI(data: string): Promise<string> {
	if (!data) return "";

	try {
		const videoTitles: string[] = JSON.parse(data);
		const res = await fetch(BACKEND_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-API-Key": SHARED_SECRET,
			},
			body: JSON.stringify({ video_titles: videoTitles }),
		});

		if (!res.ok) {
			throw new Error(`Backend responded with ${res.status}`);
		}

		const json = (await res.json()) as { roast: string };
		return json.roast;
	} catch (e: unknown) {
		console.error((e as Error).message);
		throw new Error("Something went wrong while connecting to backend");
	}
}
