import { FormEvent, useRef, useState } from "react";
import { executeAI } from "../lib/gemini";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { hasSupport } from "../constants";
import html2canvas from "html2canvas";

export default function WatchLaterTab() {
	const [roast, setRoast] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isCopying, setIsCopying] = useState<boolean>(false);
	const roastRef = useRef<HTMLDivElement>(null);

	const roastPlaylist = (): Promise<string[]> => {
		return new Promise((resolve) => {
			const videoDataArray: string[] = [];

			const videoElements = document.querySelectorAll('#contents ytd-playlist-video-renderer');
			videoElements.forEach(element => {
				const title = element.querySelector('#video-title')?.textContent?.trim() || "";
				if (title) videoDataArray.push(title);
			});

			resolve(videoDataArray);
		});
	};


	async function onCopy(event: FormEvent<HTMLButtonElement>) {
		event.preventDefault();

		try {
			if (hasSupport()) {
				await navigator.clipboard.writeText(roast);
				alert(`The roast is copied to the clipboard!`);
			} else {
				alert(`Clipboard API is Not Supported`);
			}
		} catch (err) {
			console.error(`Failed to copy: ${err}`);
		}
	}

	const copyAsImage = async () => {
		if (!roastRef.current) return;

		setIsCopying(true);
		try {
			const canvas = await html2canvas(roastRef.current, {
				scale: 2,
				useCORS: true,
				logging: false,
				backgroundColor: null
			});

			canvas.toBlob(async (blob) => {
				if (blob) {
					try {
						await navigator.clipboard.write([
							new ClipboardItem({ 'image/png': blob })
						]);
						alert('Roast image copied to clipboard!');
					} catch (err) {
						console.error('Failed to copy image: ', err);

						const url = URL.createObjectURL(blob);
						const a = document.createElement('a');
						a.href = url;
						a.download = 'roast.png';
						a.click();
						URL.revokeObjectURL(url);
						alert('Failed to copy to clipboard. Image downloaded instead.');
					}
				} else {
					throw new Error('Failed to create image blob');
				}
			}, 'image/png', 1);
		} catch (error) {
			console.error('Error converting to image:', error);
			alert('Failed to create image. Please try again.');
		} finally {
			setIsCopying(false);
		}
	};

	const handleRoastClick = async () => {
		setIsLoading(true);
		setRoast("");

		try {
			const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

			const results = await chrome.scripting.executeScript({
				target: { tabId: tab.id! },
				func: roastPlaylist,
			});

			if (results && results[0] && results[0].result) {
				const videoTitles: string[] = results[0].result;

				if (videoTitles.length > 1) {
					const aiResponse = await executeAI(JSON.stringify(videoTitles));
					setRoast(aiResponse);
				} else {
					setRoast("Not enough videos in the playlist to roast.");
				}
			} else {
				setRoast("Failed to retrieve video titles.");
			}
		} catch (error) {
			console.error("Error:", error);
			setRoast("An error occurred while processing your request.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<section ref={roastRef} className="mt-4 p-6 bg-white rounded-lg shadow-lg flex justify-center flex-col gap-1.5">
				{
					!roast && (
						<div className="flex flex-col gap-1.5 items-center justify-center">
							<button
								className="px-4 py-2 font-bold text-white transition-all duration-300 ease-in-out bg-red-500 rounded hover:bg-red-500/80"
								onClick={handleRoastClick}
								disabled={isLoading}
							>
								{isLoading ? 'Roasting...' : 'Roast my playlist'}
							</button>
							<p className="font-medium">Your data won't be stored anywhere. Chill.</p>
						</div>
					)
				}

				{roast && (
					// <div ref={roastRef} className="p-4 mt-4 bg-gray-100 rounded">
					<ReactMarkdown
						rehypePlugins={[rehypeRaw]}
						components={{
							h3: ({ ...props }) => <h3 className="mt-3 mb-2 text-lg font-semibold" {...props} />,
							p: ({ ...props }) => <p className="mb-2" {...props} />,
							strong: ({ ...props }) => <strong className="font-bold" {...props} />,
							em: ({ ...props }) => <em className="italic" {...props} />,
						}}
					>
						{roast}
					</ReactMarkdown>
					// </div>
				)}
			</section>
			{
				roast && (
					<div className="flex mt-4 space-x-4">
						<button
							className="px-4 py-2 font-bold transition-all duration-300 ease-in-out bg-transparent rounded hover:bg-red-500 hover:text-white"
							onClick={onCopy}
						>
							Copy text
						</button>
						<button
							className="px-4 py-2 font-bold text-white transition-all duration-300 ease-in-out bg-red-500 rounded hover:bg-red-500/80"
							onClick={copyAsImage}
							disabled={isCopying}
						>
							{isCopying ? 'Copying...' : 'Copy as image'}
						</button>
					</div>
				)
			}
		</>
	);
};
