import { useEffect, useState, useRef, FormEvent } from "react";
import html2canvas from "html2canvas";
import "./App.css";
import NotWatchLaterTab from "./components/NotWatchLaterTab";
import WatchLaterTab from "./components/WatchLater";
import { hasSupport } from "./constants";

function App() {
  const [isTabYoutube, setIsTabYoutube] = useState(false);
  const [roast, setRoast] = useState<string>("");

  const [isCopying, setIsCopying] = useState<boolean>(false);
  const roastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkCurrentTab = async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab.url && tab.url.includes("youtube.com/playlist?list=WL")) {
        setIsTabYoutube(true);
      } else {
        setIsTabYoutube(false);
      }
    };

    checkCurrentTab();

    const listener = (
      _: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab
    ) => {
      if (changeInfo.status === "complete" && tab.url) {
        if (tab.url.includes("youtube.com/playlist?list=WL")) {
          setIsTabYoutube(true);
        } else {
          setIsTabYoutube(false);
        }
      }
    };

    chrome.tabs.onUpdated.addListener(listener);

    return () => {
      chrome.tabs.onUpdated.removeListener(listener);
    };
  }, []);

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
        backgroundColor: null,
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

              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "roast.png";
              a.click();
              URL.revokeObjectURL(url);
              alert("Failed to copy to clipboard. Image downloaded instead.");
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
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <main className="min-w-[525px] container mx-auto border-none shadow-xl rounded-xl bg-neutral-200 p-4">
      <div ref={roastRef}>
        <h1 className="font-serif text-3xl text-center text-neutral-900">
          YouTube Watch Later Roast
        </h1>
        <p className="text-lg font-medium text-center text-neutral-600">
          Roasting you based on your YouTube's watch later playlist
        </p>
        {isTabYoutube ? (
          <WatchLaterTab roast={roast} setRoast={setRoast} />
        ) : (
          <NotWatchLaterTab />
        )}
      </div>

      {roast && (
        <div className="flex justify-center mt-4 space-x-4">
          <button
            className="px-4 py-2 font-bold transition-all duration-300 ease-in-out bg-transparent border border-gray-300 rounded-lg hover:bg-gray-200"
            onClick={onCopy}
          >
            Copy text
          </button>
          <button
            className="px-4 py-2 font-bold text-white transition-all duration-300 ease-in-out bg-red-600 rounded-lg shadow-md hover:bg-red-500"
            onClick={copyAsImage}
            disabled={isCopying}
          >
            Copy as image
          </button>
        </div>
      )}
    </main>
  );
}

export default App;
