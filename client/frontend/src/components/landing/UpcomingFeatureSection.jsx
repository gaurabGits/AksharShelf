import { HiOutlineSparkles } from "react-icons/hi2";
import { IoSearchSharp } from "react-icons/io5";

const COMING_SOON = [
  {
    icon: <IoSearchSharp />,
    title: "Smarter Search",
    desc: "We'll make search understand what you mean, not just what you type — so you always find the right book.",
  },
];

export default function AlgorithmSection() {
  return (
    <section className="border-t border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 section-pad">
      <div className="page-container">
        <div className="flex w-full flex-col gap-8 sm:gap-10 lg:gap-12">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
              <HiOutlineSparkles className="text-base" />
              Upcoming
            </span>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl lg:text-4xl">
              What we're building next
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400 sm:text-base">
              A quick look at the next improvements we're shipping to make reading smoother and smarter.
            </p>
          </div>

          <div className="grid w-full cursor-default grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 sm:gap-5 lg:gap-6">
            {COMING_SOON.map((item, i) => (
              <div
                key={i}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-indigo-800/50 sm:gap-4 sm:p-7"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl text-indigo-600 transition-transform duration-200 group-hover:scale-105 dark:bg-indigo-950/50 dark:text-indigo-400">
                    {item.icon}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

