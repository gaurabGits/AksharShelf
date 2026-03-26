import { HiOutlineSparkles } from "react-icons/hi2";

const COMING_SOON = [
  {
    emoji: "🔍",
    title: "Smarter Search",
    desc: "We'll make search understand what you mean, not just what you type — so you always find the right book.",
  },
];

export default function AlgorithmSection() {
  return (
    <section className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 section-pad">
.      <div className="page-container">
        <div className="mx-auto flex max-w-4xl flex-col gap-8 sm:gap-10">
          <div className="flex flex-col gap-2 text-center">
            <div className="flex items-center justify-center gap-2 text-indigo-500 dark:text-indigo-400">
              <HiOutlineSparkles />
              <span className="text-xs font-semibold uppercase tracking-widest">Coming soon</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              What we're working on next
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 cursor-default">
            {COMING_SOON.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all"
              >
                <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
