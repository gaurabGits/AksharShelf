import {
  HiOutlineBookOpen,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import { MdOutlinePaid } from "react-icons/md";

const FEATURES = [
  {
    icon: <HiOutlineBookOpen />,
    title: "Book Recommendations",
    desc: "Based on what you've read and loved, we'll suggest books we think you'll enjoy next.",
  },
  {
    icon: <HiOutlineMagnifyingGlass />,
    title: "Instant Search",
    desc: "Can offers to search anything about the PDF content inside the PDF while reading.",
  },
  {
    icon: <MdOutlinePaid />,
    title: "Purchase Books",
    desc: "We implement a dummy purchase system for demonstration purposes. Simulating a real-world experience without actual transactions.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-gray-50 dark:bg-gray-950 section-pad">
      <div className="page-container">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:gap-10 lg:gap-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
            What's inside
          </span>
          <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl lg:text-4xl">
            Major features of Akshar Shelf
          </h2>
        </div>

        <div className="grid cursor-default grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="flex h-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 sm:gap-4 sm:p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 sm:h-11 sm:w-11 sm:text-xl">
                {f.icon}
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white sm:text-base">
                {f.title}
              </h3>
              <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 sm:text-sm">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}
