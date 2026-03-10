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

      <section className="relative overflow-hidden bg-white dark:bg-gray-950 min-h-[90vh] flex items-center">

        {/* Orbs */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="orb  absolute -top-32  -right-32 w-[600px] h-[600px] rounded-full bg-indigo-100 dark:bg-indigo-600/20 blur-[120px]" />
          <div className="orb2 absolute -bottom-24 -left-24  w-[400px] h-[400px] rounded-full bg-violet-100 dark:bg-violet-600/15 blur-[100px]" />
        </div>
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.022] dark:opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)`,
            backgroundSize: "56px 56px",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-20 pt-5 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* ── LEFT ── */}
            <div className="flex flex-col gap-8">
              <h1 className="fade-up d1 text-4xl sm:text-5xl lg:text-[56px] font-bold text-gray-900 dark:text-white leading-[1.12] tracking-tight">
                Your personal{" "}
                <span className="relative inline-block">
                  <span className="text-indigo-600 dark:text-indigo-400">reading shelf</span>
                  <svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 260 10" fill="none" preserveAspectRatio="none">
                    <path d="M2 7 C65 1, 130 9, 258 4" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
                  </svg>
                </span>
                {" "}awaits
              </h1>

              <p className="fade-up d2 text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-[400px]">
               Discover, organize, and enjoy huge number of books in one clean, distraction free space built for curious minds.
              </p>

              <div className="fade-up d3 flex flex-wrap items-center gap-3">
                <Link
                  to="/books"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200 dark:hover:shadow-indigo-900/50"
                >
                  Browse Books <HiArrowRight />
                </Link>
                <button
                  onClick={onStartFree}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-medium rounded-xl transition-all hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
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

            {/* ── RIGHT — Fanned Cards ── */}
            <div className="relative">
              <div className="absolute right-0 "style={{ top: "10%", transform: "translateY(-50%)" }}>
                <FannedBooks />
              </div>
            </div>
            
          </div>
        </div>
      </section>
    </>
  );
}

export default HeroSection;
