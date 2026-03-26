import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  HiArrowLeft,
  HiOutlineBookOpen,
  HiOutlineSparkles,
  HiOutlineChatBubbleLeftRight,
  HiOutlineShieldCheck,
  HiOutlineCommandLine,
  HiOutlineUser,
  HiOutlineAcademicCap,
} from "react-icons/hi2";

// Animate on scroll
function useFadeIn() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// Fade wrapper
function Fade({ children, delay = 0, className = "" }) {
  const [ref, visible] = useFadeIn();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}


const FEATURES = [
  { icon: HiOutlineBookOpen,           label: "Smart Bookshelf",    desc: "Track what you're reading, completed, and planning all in one organised shelf." },
  { icon: HiOutlineSparkles,           label: "Recommendations",    desc: "Personalised book picks based on your reading history and rating patterns."       },
  { icon: HiOutlineChatBubbleLeftRight, label: "Reviews & Ratings", desc: "Write reviews, rate books 1-5 stars, and engage with the reading community."     },
  { icon: HiOutlineCommandLine,        label: "Admin Dashboard",    desc: "Manage books and users through a full-featured backend admin panel."              },
  { icon: HiOutlineShieldCheck,        label: "Secure Auth",        desc: "JWT-based authentication with protected routes and role-based access control."    },
  { icon: HiOutlineUser,              label: "User Profiles",       desc: "Personal profiles with reading stats, activity history, and shelf progress."      },
];

const STACK = [
  { name: "MongoDB",     role: "Database"    },
  { name: "Express.js",  role: "Server"      },
  { name: "React",       role: "Frontend"    },
  { name: "Node.js",     role: "Runtime"     },
  { name: "Tailwind CSS",role: "Styling"     },
  { name: "Socket.io",   role: "Real-time"   },
  { name: "JWT",         role: "Auth"        },
  { name: "Mongoose",    role: "ODM"         },
];

const ARCH_FLOW = [
  { label: "Browser", sub: "React SPA" },
  { label: "Axios", sub: "HTTP + JWT" },
  { label: "Express", sub: "REST API" },
  { label: "Mongoose", sub: "ODM Layer" },
  { label: "MongoDB", sub: "Database" },
];


function Divider() {
  return <div className="h-px w-full bg-gray-100 dark:bg-gray-800 my-10 sm:my-16" />;
}

// Main
export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">

      {/* Nav bar */}
      <div className="sticky top-16 z-10 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="page-container py-3.5 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <HiArrowLeft /> Back
          </button>
          <span className="text-gray-200 dark:text-gray-800">/</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">About</span>
        </div>
      </div>

      <main className="page-container py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl">
        <section>
          <Fade delay={0}>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 px-3 py-1.5 rounded-full mb-6">
              <HiOutlineAcademicCap />
              BCA 6th Semester Project · 2026
            </div>
          </Fade>

          <Fade delay={80}>
            <h1 className="text-4xl font-bold tracking-tight leading-tight mb-4">
              Akshar Shelf
              <span className="block text-lg font-normal text-gray-400 dark:text-gray-500 mt-1">
                Your personal reading companion
              </span>
            </h1>
          </Fade>

          <Fade delay={140}>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm text-justify">
              Akshar Shelf is a full-stack reading platform where you can discover books,
              manage your personal bookshelf, write reviews, and get personalised recommendations
              all in a clean, distraction-free interface.
            </p>
          </Fade>
        </section>

        <Divider />

        {/* Developer */}
        <section>
          <Fade delay={0}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-600 mb-8">
              Developer
            </p>
          </Fade>

          <Fade delay={60}>
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-md shadow-indigo-500/20">
                GL
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Gaurab Lohar</h2>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 px-2 py-0.5 rounded-full">
                    Developer
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Bachelor of Computer Applications · 6th Semester
                </p>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed text-justify">
                  Built this project to explore full-stack development with the MERN stack,
                  combining a React frontend, Node/Express backend, MongoDB database, and
                  real-time Socket.io features into a cohesive, production-ready application.
                </p>

                {/* Meta pills */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {["Full Stack", "MERN", "UI / UX", "Real-time"].map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Fade>

          <Fade delay={120}>
            <div className="mt-8 grid grid-cols-4 divide-x divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
              {[
                { label: "Program",  value: "BCA"  },
                { label: "Semester", value: "6th"  },
                { label: "Stack",    value: "MERN" },
                { label: "Year",     value: "2026" },
              ].map(({ label, value }) => (
                <div key={label} className="py-4 text-center bg-gray-50/60 dark:bg-gray-900/60">
                  <p className="text-base font-bold text-gray-900 dark:text-white">{value}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </Fade>
        </section>

        <Divider />

        {/* Features */}
        <section>
          <Fade delay={0}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-600 mb-2">
              Features
            </p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-8">
              What Akshar Shelf offers
            </h2>
          </Fade>

          <div className="space-y-1">
            {FEATURES.map(({ icon: Icon, label, desc }, i) => (
              <Fade key={label} delay={i * 50}>
                <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/60 transition-colors duration-150">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 transition-colors">
                    <Icon className="text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 text-sm transition-colors" />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed text-justify">{desc}</p>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </section>

        <Divider />

        {/* Tech Stack */}
        <section>
          <Fade delay={0}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-600 mb-2">
              Tech Stack
            </p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-8">
              Built with modern tools
            </h2>
          </Fade>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STACK.map(({ name, role }, i) => (
              <Fade key={name} delay={i * 40}>
                <div className="group border border-gray-100 dark:border-gray-800 rounded-xl p-4 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all duration-150 cursor-default">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">{name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">{role}</p>
                </div>
              </Fade>
            ))}
          </div>

          {/* Architecture flow */}
          <Fade delay={200}>
            <div className="w-full mt-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                  System Architecture
                </p>
              </div>

              <div className="p-4">
                {/* Mobile: vertical */}
                <div className="flex flex-col items-stretch gap-2 sm:hidden">
                  {ARCH_FLOW.map((item, i) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/60">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.sub}</p>
                        </div>
                        <span className="text-xs font-semibold text-gray-400">{i + 1}</span>
                      </div>

                      {i < ARCH_FLOW.length - 1 ? (
                        <div className="flex justify-center py-1.5">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-300 dark:text-gray-700">
                            <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* Tablet/Desktop: horizontal */}
                <div className="hidden sm:flex items-center justify-between gap-2 flex-wrap">
                  {ARCH_FLOW.map((item, i) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="flex flex-col items-center bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-2 min-w-[110px]">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{item.label}</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">{item.sub}</span>
                      </div>

                      {i < ARCH_FLOW.length - 1 ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-300 dark:text-gray-700 shrink-0">
                          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Fade>
        </section>

        </div>
      </main>
    </div>
  );
}
