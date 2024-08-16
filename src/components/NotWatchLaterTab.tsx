export default function NotWatchLaterTab() {
    return (
        <section className="mt-4 p-6 bg-white rounded-lg items-center shadow-lg flex justify-center flex-col gap-1.5">
            <h2 className='text-xl font-medium text-center text-neutral-900'>You must be on youtube's watch later page to use this extension.</h2>
            <a
                href="https://www.youtube.com/playlist?list=WL"
                target='_blank'
                rel='noreferrer noopener'
                className="px-4 py-2 font-bold text-white transition-all duration-300 ease-in-out bg-red-500 rounded hover:bg-red-500/80"
            >
                Watch later playlist
            </a>
        </section>
    )
}