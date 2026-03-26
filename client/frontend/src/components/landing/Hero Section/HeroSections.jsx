import { Link } from "react-router-dom";
import { HiArrowRight} from "react-icons/hi2";
import FannedBooks from "./FannedBooks";
import { useEffect, useState } from "react";
import API from "../../../services/api";


function HeroSection({ onStartFree }) {
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const [totalUsers, setTotalUsers] = useState(null);
  const [lastUsers, setLastUsers] = useState([]);

  useEffect(() => {
    if (isLoggedIn) return;
    const fetchData = async () => {
      try {
        const totalRes = await API.get("/auth/total-users");
        const lastRes = await API.get("/auth/last-users");

        setTotalUsers(totalRes.data.totalUsers);
        setLastUsers(lastRes.data.users || []); // extract users array from response
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, [isLoggedIn]);

  const COLORS = ["bg-indigo-400", "bg-orange-300", "bg-green-300", "bg-purple-300"];


  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbPulse {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 0.55; }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(60px) scale(0.88); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes floatIdle {
          0%, 100% { margin-top: 0px; }
          50%       { margin-top: -8px; }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }

        .fade-up { animation: fadeUp 0.6s ease both; }
        .d1 { animation-delay: 0.08s; }
        .d2 { animation-delay: 0.20s; }
        .d3 { animation-delay: 0.34s; }
        .d4 { animation-delay: 0.46s; }

        .orb  { animation: orbPulse 4s ease-in-out infinite; }
        .orb2 { animation: orbPulse 4s ease-in-out infinite 2s; }

        .card-in { animation: cardIn 0.65s cubic-bezier(0.22,1,0.36,1) both; }

        .fan-idle { animation: floatIdle 4s ease-in-out infinite; }

        .skeleton {
          background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
          background-size: 400px 100%;
          animation: shimmer 1.4s infinite;
        }
        .dark .skeleton {
          background: linear-gradient(90deg, #1f2937 25%, #374151 50%, #1f2937 75%);
          background-size: 400px 100%;
        }
      `}</style>

      <section className="relative flex min-h-[80vh] items-center overflow-hidden bg-white dark:bg-gray-950 sm:min-h-[90vh]">

        {/* Orbs */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="orb absolute -top-24 -right-24 h-[340px] w-[340px] rounded-full bg-indigo-100 blur-[100px] dark:bg-indigo-600/20 sm:-top-32 sm:-right-32 sm:h-[460px] sm:w-[460px] sm:blur-[120px] lg:h-[600px] lg:w-[600px]" />
          <div className="orb2 absolute -bottom-20 -left-20 h-[260px] w-[260px] rounded-full bg-violet-100 blur-[90px] dark:bg-violet-600/15 sm:-bottom-24 sm:-left-24 sm:h-[340px] sm:w-[340px] sm:blur-[100px] lg:h-[420px] lg:w-[420px]" />
        </div>
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.022] dark:opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)`,
            backgroundSize: "56px 56px",
          }}
        />

        <div className="page-container relative w-full py-16 sm:py-20 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">

            {/* â”€â”€ LEFT â”€â”€ */}
            <div className="flex flex-col gap-8">
              <h1 className="fade-up d1 text-3xl font-bold leading-[1.12] tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-[56px]">
                Your personal{" "}
                <span className="relative inline-block">
                  <span className="text-indigo-600 dark:text-indigo-400">reading shelf</span>
                  <svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 260 10" fill="none" preserveAspectRatio="none">
                    <path d="M2 7 C65 1, 130 9, 258 4" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
                  </svg>
                </span>
                {" "}awaits
              </h1>

              <p className="fade-up d2 max-w-xl text-sm leading-relaxed text-gray-500 dark:text-gray-400 sm:text-base">
               Discover, organize, and enjoy huge number of books in one clean, distraction free space built for curious minds.
              </p>

              <div className="fade-up d3 flex flex-wrap items-center gap-3">
                <Link
                  to="/books"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 dark:hover:shadow-indigo-900/50 sm:w-auto"
                >
                  Browse Books <HiArrowRight />
                </Link>
                <button
                  onClick={onStartFree}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-800 dark:text-gray-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 sm:w-auto"
                >
                  Start for free
                </button>
              </div>

              {!isLoggedIn && (
                <div className="fade-up d4 flex items-center select-none gap-3 pt-1">
                  <div className="flex -space-x-2">
                    {lastUsers.map((user, i) => (
                      <span key={i} className={`w-7 h-7 rounded-full ${user.color || COLORS[i % COLORS.length]} border-2 border-white dark:border-gray-950 flex items-center justify-center text-white text-[10px] font-bold`}>{user.name?.charAt(0)}</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {totalUsers !== null ? `${totalUsers}  Users are registered` : "Loading users..."}
                  </p>
                </div>
              )}
            </div>

            {/* â”€â”€ RIGHT â€” Fanned Cards â”€â”€ */}
            <div className="relative flex justify-center lg:justify-end">
              <FannedBooks />
            </div>
            
          </div>
        </div>
      </section>
    </>
  );
}

export default HeroSection;
