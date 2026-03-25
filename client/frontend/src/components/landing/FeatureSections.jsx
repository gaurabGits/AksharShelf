import {
  HiOutlineBookOpen,
  HiOutlineUser,
  HiOutlineMagnifyingGlass,
  HiOutlineBookmarkSquare,
  HiOutlineStar,
  HiOutlineShieldCheck,
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
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-20 px-4 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
            What's inside
          </span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Major features of Akshar Shelf
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 cursor-default">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg">
                {f.icon}
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {f.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}