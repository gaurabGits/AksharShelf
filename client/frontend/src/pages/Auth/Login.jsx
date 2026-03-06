import React, { useState } from "react";
import {
  HiOutlineLockClosed,
  HiOutlineMail,
  HiOutlineEye,
  HiOutlineEyeOff,  
} from "react-icons/hi";
import { BsBookshelf } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import { useNotification } from "../../context/Notification";
import API from "../../services/api";

function Login() {
  const navigate = useNavigate();
  const notify = useNotification();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Minimum 6 characters required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    try {
      setLoading(true);
      const res = await API.post("/auth/login", formData);
      localStorage.setItem("token", res.data.token);
      notify.success("Login successful", "Welcome back!");
      navigate("/");
    } catch (error) {
      const message = error.response?.data?.message || "An error occurred";
      setErrors({ general: message });
      notify.error("Login failed", message);
    } finally {
      setLoading(false);
    }
  };

  // Always renders — empty when no error, visible when error exists
  const ErrorSlot = ({ field }) => (
    <p className="h-4 mt-1 text-xs text-red-500 dark:text-red-400">
      {errors[field] || ""}
    </p>
  );


  const EyeToggle = ({ show, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
      tabIndex={-1}
    >
      {show
        ? <HiOutlineEyeOff className="w-4 h-4" />
        : <HiOutlineEye className="w-4 h-4" />
      }
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-all duration-200">
      <div className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden flex">

          {/* ── Left Panel ── */}
          <div className="hidden md:flex md:w-5/12 bg-indigo-600 dark:bg-indigo-700 p-8 flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -bottom-20 -right-12 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />

            {/* Logo for auth container */}
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-8">
                  <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-indigo-600 text-base shadow-sm group-hover:bg-indigo-700 transition-colors">
                        <BsBookshelf />
                      </div>
                      <span className="text-2xl font-bold text-white tracking-tight">
                        अक्षर <span className="text-white ">Shelf</span>
                      </span>
                  </div>
              </div>
              <h2 className="text-white text-xl font-bold mb-3 leading-tight">
                Your personal<br />reading universe
              </h2>
              <p className="text-indigo-200 text-sm leading-relaxed">
                Track books, build shelves, and discover your next great read.
              </p>
            </div>

            <div className="relative z-10 space-y-2.5">
              {[
                "Track your reading progress",
                "Organize books into shelves",
                "Get personalized recommendations",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-indigo-100 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div className="w-full md:w-7/12 flex items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">

              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  Welcome back
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sign in to continue
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-0">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700
                        text-gray-900 dark:text-gray-100 border outline-none
                        focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200
                        ${errors.email ? "border-red-400 dark:border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                    />
                  </div>
                  <ErrorSlot field="email" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    <a href="#" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline transition-all duration-200">
                      Forgot?
                    </a>
                  </div>
                  
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className={`w-full pl-10 pr-10 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700
                        text-gray-900 dark:text-gray-100 border outline-none
                        focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200
                        ${errors.password ? "border-red-400 dark:border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                    />
                    <EyeToggle
                      show={showPassword}
                      onToggle={() => setShowPassword((p) => !p)}
                    />
                  </div>
                  <ErrorSlot field="password" />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700
                      dark:bg-indigo-500 dark:hover:bg-indigo-600
                      text-white text-sm font-medium transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center justify-center gap-2 shadow-sm"
                  >
                    {loading && (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    )}
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </div>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <Link
                  to="/auth/signup"
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline transition-all duration-200"
                >
                  Create one
                </Link>
              </p>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;