import "./index.css";
import { marked } from "marked";
import DOMPurify from "dompurify";
import html2canvas from "html2canvas";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000/roast";
const SHARED_SECRET = import.meta.env.VITE_SHARED_SECRET ?? "";

if (!SHARED_SECRET) {
  console.warn(
    "VITE_SHARED_SECRET is not set — the backend will reject roast requests."
  );
}

const WL_URL = "youtube.com/playlist?list=WL";

const watchLaterView = document.getElementById("watch-later-view")!;
const notWatchLaterView = document.getElementById("not-watch-later-view")!;
const wlIdle = document.getElementById("wl-idle")!;
const loading = document.getElementById("loading")!;
const errorBox = document.getElementById("error")!;
const errorText = document.getElementById("error-text")!;
const roastContent = document.getElementById("roast-content")!;
const copyActions = document.getElementById("copy-actions")!;
const roastCard = document.getElementById("roast-card")!;
const roastButton = document.getElementById("roast-button") as HTMLButtonElement;
const copyTextBtn = document.getElementById("copy-text") as HTMLButtonElement;
const copyImageBtn = document.getElementById("copy-image") as HTMLButtonElement;

let currentRoast = "";
let isRoasting = false;

function isWatchLaterUrl(url?: string): boolean {
  return url?.includes(WL_URL) ?? false;
}

async function setViewForActiveTab(): Promise<void> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  const onWL = isWatchLaterUrl(tab.url);
  watchLaterView.classList.toggle("hidden", !onWL);
  notWatchLaterView.classList.toggle("hidden", onWL);
}

type RoastState = "idle" | "loading" | "result" | "error";

function showState(state: RoastState, message?: string): void {
  const showButton = state === "idle" || state === "error";
  wlIdle.classList.toggle("hidden", !showButton);
  loading.classList.toggle("hidden", state !== "loading");
  errorBox.classList.toggle("hidden", state !== "error");
  roastContent.classList.toggle("hidden", state !== "result");
  copyActions.classList.toggle("hidden", state !== "result");

  if (state === "error" && message) {
    errorText.textContent = message;
  }
  if (state === "idle" || state === "loading") {
    roastContent.innerHTML = "";
    currentRoast = "";
  }
}

// Injected into the YouTube page — must be self-contained (no closure refs).
function scrapeWatchLaterTitles(): string[] {
  const titles: string[] = [];
  document
    .querySelectorAll("#contents ytd-playlist-video-renderer")
    .forEach((el) => {
      const title = el.querySelector("#video-title")?.textContent?.trim();
      if (title) titles.push(title);
    });
  return titles;
}

async function fetchRoast(titles: string[]): Promise<string> {
  const res = await fetch(BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": SHARED_SECRET,
    },
    body: JSON.stringify({ video_titles: titles }),
  });

  if (!res.ok) {
    throw new Error(`Backend responded with ${res.status}`);
  }

  const json = (await res.json()) as { roast: string };
  return json.roast;
}

async function handleRoast(): Promise<void> {
  isRoasting = true;
  showState("loading");

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: scrapeWatchLaterTitles,
    });

    const titles = (results?.[0]?.result ?? []) as string[];

    if (titles.length > 1) {
      const roast = await fetchRoast(titles);
      currentRoast = roast;
      roastContent.innerHTML = DOMPurify.sanitize(
        marked.parse(roast) as string
      );
      showState("result");
    } else {
      showState("error", "Not enough videos in the playlist to roast.");
    }
  } catch (err) {
    console.error(err);
    showState("error", "An error occurred while processing your request.");
  } finally {
    isRoasting = false;
  }
}

async function handleCopyText(): Promise<void> {
  if (!currentRoast) return;

  try {
    await navigator.clipboard.writeText(currentRoast);
    alert("The roast is copied to the clipboard!");
  } catch (err) {
    console.error(err);
    alert("Failed to copy text");
  }
}

async function handleCopyImage(): Promise<void> {
  try {
    const canvas = await html2canvas(roastCard, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#FFFFFF",
    });

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          alert("Failed to create image.");
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          alert("Roast image copied to clipboard!");
        } catch (err) {
          console.error(err);
          alert("Failed to copy to clipboard.");
        }
      },
      "image/png",
      1
    );
  } catch (err) {
    console.error(err);
    alert("Failed to create image. Please try again.");
  }
}

roastButton.addEventListener("click", handleRoast);
copyTextBtn.addEventListener("click", handleCopyText);
copyImageBtn.addEventListener("click", handleCopyImage);

setViewForActiveTab();

chrome.tabs.onUpdated.addListener((_, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && !isRoasting) {
    setViewForActiveTab();
  }
});
