export function setItem<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ [key]: value }, function() {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve();
            });
        } else {
            reject(new Error("Chrome API is not available."));
        }
    });
}

export function getItem(key: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get([key], function(result) {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve(result[key] || "");
            });
        } else {
            reject(new Error("Chrome API is not available."));
        }
    });
}

export async function getGeminiAPIKey(): Promise<string> {
	const key = await getItem("GEMINI_API_KEY");
	if (!key) {
		const DEFAULT_GEMINI_API_KEY = "<your-gemini-api-key-here>"
        await setItem("GEMINI_API_KEY", DEFAULT_GEMINI_API_KEY);
		return DEFAULT_GEMINI_API_KEY;
	}
	return key;
}