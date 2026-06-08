import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "../services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      if (response.data.success || response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem(
          "matchmaker",
          JSON.stringify(response.data.matchmaker),
        );
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen premium-gradient flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 rounded-3xl animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-white dark:to-white">
            The Date Crew
          </h1>
          <p className="text-slate-500 dark:text-slate-300 mt-2">
            Matchmaker Portal
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-slate-700 dark:text-slate-200"
            >
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="matchmaker@thedatecrew.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/50 dark:bg-slate-800/50 focus:ring-brand-500 border-white/20 text-black"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-slate-700 dark:text-slate-200"
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white/50 dark:bg-slate-800/50 focus:ring-brand-500 border-white/20 text-black"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-xl h-11 transition-all"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Secure Internal Access Only
        </div>
      </div>
    </div>
  );
};

export default Login;
