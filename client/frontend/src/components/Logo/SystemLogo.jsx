import { BsBookshelf } from "react-icons/bs";
function SystemLogo() {
  return (
    <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-base shadow-sm group-hover:bg-indigo-700 transition-colors">
          <BsBookshelf />
        </div>
        <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          अक्षर <span className="text-indigo-600 dark:text-indigo-400">Shelf</span>
        </span>
    </div>
  );
}
export default SystemLogo;