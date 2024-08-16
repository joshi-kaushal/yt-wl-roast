import { useEffect, useState } from 'react'
import './App.css'
import NotWatchLaterTab from './components/NotWatchLaterTab';
import WatchLaterTab from './components/WatchLater';

function App() {
  const [isTabYoutube, setIsTabYoutube] = useState(false)

  useEffect(() => {
    const checkCurrentTab = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.url && tab.url.includes("youtube.com/playlist?list=WL")) {
        setIsTabYoutube(true);
      } else {
        setIsTabYoutube(false);
      }
    };


    checkCurrentTab();

    const listener = (_: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        if (tab.url.includes("youtube.com/playlist?list=WL")) {
          setIsTabYoutube(true);
        } else {
          setIsTabYoutube(false);
        }
      }
    };

    chrome.tabs.onUpdated.addListener(listener);

    // Clean up the listener when the component unmounts
    return () => {
      chrome.tabs.onUpdated.removeListener(listener);
    };
  }, []);


  return (
    <main className='w-[425px] container mx-auto border-none shadow-xl rounded-xl bg-neutral-200 p-4'>
      <h1 className='font-serif text-center text-3xl text-neutral-900'>YouTube Watch Later Roast</h1>
      <p className='text-lg font-medium text-center text-neutral-600'>Roasting you based on your YouTube's watch later playlist</p>
      {isTabYoutube
        ? <WatchLaterTab />
        : <NotWatchLaterTab />
      }
    </main>
  )
}

export default App
