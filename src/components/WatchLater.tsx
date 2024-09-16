import { useState } from "react";
import { executeAI } from "../lib/gemini";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { AlertCircle } from 'lucide-react';
import { Skeleton } from "./ui/skeleton";

interface WLProps {
  roast: string;
  setRoast: (roast: string) => void;
}

export default function WatchLaterTab({ roast, setRoast }: WLProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const roastPlaylist = (): Promise<string[]> => {
    return new Promise((resolve) => {
      const videoDataArray: string[] = [];
      const videoElements = document.querySelectorAll(
        "#contents ytd-playlist-video-renderer"
      );
      videoElements.forEach((element) => {
        const title =
          element.querySelector("#video-title")?.textContent?.trim() || "";
        if (title) videoDataArray.push(title);
      });
      resolve(videoDataArray);
    });
  };

  const handleRoastClick = async () => {
    setIsLoading(true);
    setRoast("");
    setError(null);

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

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
          setError("Not enough videos in the playlist to roast.");
        }
      } else {
        setError("Failed to retrieve video titles.");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred while processing your request.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={`flex flex-col gap-4 p-6 mt-4 rounded-lg shadow-lg bg-white`}>
      {!roast && !error && (
        <div className="flex flex-col items-center justify-center gap-4">
          <button
            onClick={handleRoastClick}
            className="w-full max-w-xs px-6 py-3 font-bold text-white transition-all duration-300 ease-in-out bg-red-600 rounded-lg shadow-md hover:bg-red-500"
          >
            {isLoading ? "Roasting..." : "Roast my playlist"}
          </button>
          <p className={`font-medium text-center text-gray-700`}>
            Your data won't be stored anywhere. Chill.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="w-full h-4 bg-gray-700" />
          <Skeleton className="w-5/6 h-4 bg-gray-700" />
          <Skeleton className="w-4/6 h-4 bg-gray-700" />
        </div>
      )}

      {error && (
        <div className={`flex items-center p-4 rounded-md bg-red-100 text-red-800
          }`}>
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>{error}</p>
        </div>
      )}

      {roast && (
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
          components={{
            h3: ({ ...props }) => (
              <h3
                className={`mt-3 mb-2 text-lg font-semibold text-red-600`}
                {...props}
              />
            ),
            p: ({ ...props }) => (
              <p className={`mb-2 font-medium text-gray-800`} {...props} />
            ),
            strong: ({ ...props }) => (
              <strong className={`font-bold text-red-600`} {...props} />
            ),
            em: ({ ...props }) => (
              <em className={`italic text-gray-600`} {...props} />
            ),
          }}
        >
          {roast}
        </ReactMarkdown>
      )}
    </section>
  );
}