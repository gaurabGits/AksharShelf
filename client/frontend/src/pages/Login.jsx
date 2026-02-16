import React, { useState } from "react";
import { HiOutlineLockClosed, HiOutlineMail } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);


  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await API.post("/auth/login", formData);
      // console.log("Backend response:", res.data);
      localStorage.setItem("token", res.data.token);

      setIsSubmitting(true);
      console.log("Logging in user:", formData);

      alert("Login successful!");
      setFormData({ email: "", password: "" });
      
      navigate("/");
      window.location.reload();

    } catch (error) {
      setErrors({ general: error.response?.data?.message || "Invalid credentials" });
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-sm rounded-xl p-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white text-center mb-6">
          Login to Your Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <HiOutlineMail className="absolute left-3 top-3 text-gray-400" />
              <input type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email address"
                className={`w-full pl-10 pr-4 py-2 rounded-lg 
                  bg-gray-100 dark:bg-gray-700 
                  text-gray-900 dark:text-gray-200 
                  placeholder-gray-400 
                  focus:outline-none focus:ring-2 transition
                  ${errors.email ? "ring-2 ring-red-500" : "focus:ring-indigo-500"}`}/>
            </div>
            <p className={`text-sm mt-1 min-h-[20px] ${errors.email ? "text-red-500" : "text-transparent"}`}>
              {errors.email}
            </p>
          </div>

          <div>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3 top-3 text-gray-400" />
              <input type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className={`w-full pl-10 pr-4 py-2 rounded-lg 
                  bg-gray-100 dark:bg-gray-700 
                  text-gray-900 dark:text-gray-200 
                  placeholder-gray-400 
                  focus:outline-none focus:ring-2 transition
                  ${errors.password ? "ring-2 ring-red-500" : "focus:ring-indigo-500"}`}/>
            </div>
            <p className={`text-sm mt-1 min-h-[20px] ${errors.password ? "text-red-500" : "text-transparent"}`}>
              {errors.password}
            </p>
          </div>

          <button type="submit"
            disabled={isSubmitting}
            className="w-full py-2 rounded-lg bg-indigo-600 
              text-white font-medium 
              hover:bg-indigo-700 transition disabled:opacity-50">
            {isSubmitting ? "Logging in..." : "Login"}
          </button>

          <p className="mt-6 text-sm text-center text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link to="/register"
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;