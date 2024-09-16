import html2canvas from "html2canvas";
import { Copy, Image } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import NotWatchLaterTab from "./components/NotWatchLaterTab";
import WatchLaterTab from "./components/WatchLater";
import { hasSupport } from "./constants";

function App() {
  const [isTabYoutube, setIsTabYoutube] = useState(false);
  const [roast, setRoast] = useState<string>("");
  const roastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkCurrentTab = async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      setIsTabYoutube(tab.url?.includes("youtube.com/playlist?list=WL") ?? false);
    };

    checkCurrentTab();

    const listener = (_: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      if (changeInfo.status === "complete" && tab.url) {
        setIsTabYoutube(tab.url.includes("youtube.com/playlist?list=WL"));
      }
    };

    chrome.tabs.onUpdated.addListener(listener);

    return () => {
      chrome.tabs.onUpdated.removeListener(listener);
    };
  }, []);

  const handleCopy = async (event: FormEvent<HTMLButtonElement>) => {
    event.preventDefault();

    try {
      if (hasSupport()) {
        await navigator.clipboard.writeText(roast);
        alert("The roast is copied to the clipboard!");
      } else {
        alert("Clipboard API is Not Supported");
      }
    } catch (err) {
      console.error(`Failed to copy: ${err}`);
      alert("Failed to copy text");
    }
  };

  const copyAsImage = async () => {
    if (!roastRef.current) return;

    try {
      const canvas = await html2canvas(roastRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#FFFFFF",
      });

      canvas.toBlob(
        async (blob) => {
          if (blob) {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
              ]);
              alert("Roast image copied to clipboard!");
            } catch (err) {
              console.error("Failed to copy image: ", err);
              alert("Failed to copy to clipboard.");
            }
          } else {
            throw new Error("Failed to create image blob");
          }
        },
        "image/png",
        1
      );
    } catch (error) {
      console.error("Error converting to image:", error);
      alert("Failed to create image. Please try again.");
    }
  };


  return (
    <main className={`min-w-[525px] container mx-auto border-none shadow-xl rounded-xl bg-neutral-200 text-neutral-900 p-4 transition-colors duration-300`}>
      <div ref={roastRef} className="space-y-4">
        <div className="space-y-2">
          <h1 className="font-serif text-3xl text-center">
            YouTube Watch Later Roast
          </h1>
          <p className="text-lg font-medium text-center opacity-80">
            Roasting you based on your YouTube's watch later playlist
          </p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-sm">GitHub: </p>
            <a className="text-sm font-semibold text-center hover:underline" href="https://github.com/joshi-kaushal/yt-wl-roast" target="_blank" rel="noopener noreferrer">
              joshi-kaushal/yt-wl-roast
            </a>
          </div>
        </div>

        {isTabYoutube ? (
          <WatchLaterTab roast={roast} setRoast={setRoast} />
        ) : (
          <NotWatchLaterTab />
        )}
      </div>

      {roast && (
        <div className="flex justify-center mt-6 space-x-4">
          <button
            className="flex items-center px-4 py-2 space-x-2 font-bold transition-all duration-300 ease-in-out bg-transparent border border-gray-300 rounded-lg hover:bg-gray-200"
            onClick={handleCopy}
          >
            <Copy className="w-4 h-4" />
            <span>Copy text</span>
          </button>
          <button
            className="flex items-center px-6 py-3 space-x-2 font-bold text-white transition-all duration-300 ease-in-out bg-red-600 rounded-lg shadow-md hover:bg-red-500"
            onClick={copyAsImage}
          >
            <Image className="w-4 h-4" />
            <span>Copy as image</span>
          </button>
        </div>
      )}
    </main>
  );
}

export default App;