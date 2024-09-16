export default function NotWatchLaterTab() {
  return (
    <section className={`mt-4 p-6 rounded-lg items-center shadow-lg flex justify-center flex-col gap-4 bg-white`}>
      <h2 className={`text-xl font-medium text-center text-neutral-900`}>
        You must be on YouTube's watch later page to use this extension.
      </h2>
      <button
        className="flex items-center gap-2 px-6 py-3 font-bold text-white transition-all duration-300 ease-in-out bg-red-600 rounded-lg shadow-md hover:bg-red-500"
      >
        <a
          href="https://www.youtube.com/playlist?list=WL"
          target="_blank"
          rel="noreferrer noopener"
        >
          <span>Watch later playlist</span>
        </a>
      </button>
    </section>
  );
}