import React, { useState } from "react";
import {
  HiOutlineLockClosed,
  HiOutlineMail,
  HiOutlineUser,
  HiArrowRight,
  HiArrowLeft,
  HiOutlineEye,
  HiOutlineEyeOff,
} from "react-icons/hi";
import { BsBookshelf } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import { useNotification } from "../../context/Notification";
import API from "../../services/api";

function Signup() {
  const navigate = useNavigate();
  const notify = useNotification();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Show/hide state for each password field
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);

    const updatedErrors = { ...errors, [name]: "" };

    // If password changes, re-check confirmPassword match live
    if (name === "password" && updatedForm.confirmPassword) {
      updatedErrors.confirmPassword =
        value === updatedForm.confirmPassword ? "" : "Passwords do not match";
    }

    setErrors(updatedErrors);
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = "Invalid email format";
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Minimum 6 characters required";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Confirm your password";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    return newErrors;
  };

  const handleNext = () => {
    const errs = validateStep1();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(2);
  };

  const handleBack = () => {
    setErrors({});
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep2();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      setLoading(true);
      // Prefix with _ to tell ESLint this is intentionally unused
      const { confirmPassword: _confirmPassword, ...payload } = formData;
      await API.post("/auth/signup", payload);
      notify.success("Account created!", "Please sign in.");
      navigate("/auth/login");
    } catch (error) {
      const message = error.response?.data?.message || "Signup failed. Try again.";
      setErrors({ general: message });
      notify.error("Signup failed", message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full pl-10 pr-10 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700
     text-gray-900 dark:text-gray-100 border outline-none
     focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200
     ${errors[field] ? "border-red-400 dark:border-red-500" : "border-gray-300 dark:border-gray-600"}`;

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
      {show ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-4 transition-all duration-200">
      <div className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden flex">

          {/* ── Left Panel ── */}
          <div className="hidden md:flex md:w-5/12 bg-indigo-600 dark:bg-indigo-700 p-8 flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -bottom-20 -right-12 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative z-10">
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

            </div>

            <div className="relative z-10">
              <p className="text-indigo-300 text-xs font-medium uppercase tracking-widest mb-3">
                Step {step} of 2
              </p>
              <div className="flex gap-2">
                <div className={`h-1 rounded-full flex-1 transition-all duration-300 ${step >= 1 ? "bg-white" : "bg-white/30"}`} />
                <div className={`h-1 rounded-full flex-1 transition-all duration-300 ${step >= 2 ? "bg-white" : "bg-white/30"}`} />
              </div>
              <p className="text-indigo-200 text-xs mt-3">
                {step === 1 ? "Tell us a bit about yourself" : "Secure your account"}
              </p>
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div className="w-full md:w-7/12 flex items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">

              {/* Mobile step bar */}
              <div className="flex gap-2 mb-6 md:hidden">
                <div className={`h-1 rounded-full flex-1 transition-all duration-300 ${step >= 1 ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"}`} />
                <div className={`h-1 rounded-full flex-1 transition-all duration-300 ${step >= 2 ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"}`} />
              </div>

              {/* Fixed-height heading block */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {step === 1 ? "Create your account" : "Secure your account"}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {step === 1 ? "Step 1 of 2 — Your details" : "Step 2 of 2 — Set a password"}
                </p>
              </div>

              {/* ── STEP 1 ── */}
              {step === 1 && (
                <div className="space-y-0">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        className={inputClass("name")}
                        onKeyDown={(e) => e.key === "Enter" && handleNext()}
                      />
                    </div>
                    <ErrorSlot field="name" />
                  </div>

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
                        className={inputClass("email")}
                        onKeyDown={(e) => e.key === "Enter" && handleNext()}
                      />
                    </div>
                    <ErrorSlot field="email" />
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700
                        dark:bg-indigo-500 dark:hover:bg-indigo-600
                        text-white text-sm font-medium transition-all duration-200
                        flex items-center justify-center gap-2 shadow-sm"
                    >
                      Next
                      <HiArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2 ── */}
              {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-0">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Minimum 6 characters"
                        autoFocus
                        className={inputClass("password")}
                      />
                      <EyeToggle
                        show={showPassword}
                        onToggle={() => setShowPassword((p) => !p)}
                      />
                    </div>
                    <ErrorSlot field="password" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter password"
                        className={inputClass("confirmPassword")}
                      />
                      <EyeToggle
                        show={showConfirmPassword}
                        onToggle={() => setShowConfirmPassword((p) => !p)}
                      />
                    </div>
                    <ErrorSlot field="confirmPassword" />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg
                        border border-gray-200 dark:border-gray-600
                        text-gray-700 dark:text-gray-300 text-sm font-medium
                        hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                    >
                      <HiArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700
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
                      {loading ? "Creating account…" : "Create account"}
                    </button>
                  </div>
                </form>
              )}

              <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Link
                  to="/auth/login"
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline transition-all duration-200"
                >
                  Sign in
                </Link>
              </p>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
