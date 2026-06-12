import "./index.css";
import { marked } from "marked";
import DOMPurify from "dompurify";
import html2canvas from "html2canvas";
import { BACKEND_URL, SHARED_SECRET } from "./api";

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

function showError(message: string): void {
  errorText.textContent = message;
  errorBox.classList.remove("hidden");
}

function hideError(): void {
  errorBox.classList.add("hidden");
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
  hideError();
  roastContent.classList.add("hidden");
  roastContent.innerHTML = "";
  currentRoast = "";
  copyActions.classList.add("hidden");
  wlIdle.classList.add("hidden");
  loading.classList.remove("hidden");
  roastButton.disabled = true;
  roastButton.textContent = "Roasting...";

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
      roastContent.classList.remove("hidden");
      copyActions.classList.remove("hidden");
    } else {
      showError("Not enough videos in the playlist to roast.");
    }
  } catch (err) {
    console.error(err);
    showError("An error occurred while processing your request.");
  } finally {
    loading.classList.add("hidden");
    roastButton.disabled = false;
    roastButton.textContent = "Roast my playlist";
    wlIdle.classList.remove("hidden");
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
  if (changeInfo.status === "complete" && tab.url) {
    setViewForActiveTab();
  }
});
