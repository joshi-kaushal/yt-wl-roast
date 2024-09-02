export default function NotWatchLaterTab() {
  return (
    <section className="mt-4 p-6 bg-white rounded-lg items-center shadow-lg flex justify-center flex-col gap-1.5">
      <h2 className="text-xl font-medium text-center text-neutral-900">
        You must be on YouTube's watch later page to use this extension.
      </h2>
      <a
        href="https://www.youtube.com/playlist?list=WL"
        target="_blank"
        rel="noreferrer noopener"
        className="px-6 py-3 font-bold text-white transition-all duration-300 ease-in-out bg-red-600 rounded-lg shadow-md hover:bg-red-500"
      >
        Watch later playlist
      </a>
    </section>
  );
}
