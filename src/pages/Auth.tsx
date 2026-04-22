import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

function Auth() {
  const { login, signup, forgotPassword, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // ----- FORM STATE -----
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ----- LOADING STATE -----
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // LOGIN HANDLER
  // -----------------------------
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); // Set loading to true
    try {
      await login({ email, password });
      toast.success("Logged in successfully!");
      const res = await api.get("/strategies/last-opened");
      if (res.data) {
        navigate(`/dashboard/${res.data._id}`);
      } else {
        navigate("/"); // if no strategy exists
      }
    } catch (error) {
      toast.error("Login failed. Please check your credentials.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      const res = await api.get("/strategies/last-opened");
      if (res.data) {
        navigate(`/dashboard/${res.data._id}`);
      } else {
        navigate("/"); // if no strategy exists
      }
    } catch (error) {
      console.error("Google login error:", error);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // SIGNUP HANDLER
  // -----------------------------
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true); // Set loading to true
    try {
      await signup({ email, password, name });
      toast.success("Signup successful!");
      navigate("/");
    } catch (error: unknown) {
      // Display the error message from the signup function
      if (error && typeof error === "object" && "message" in error) {
        toast.error(
          (error as { message?: string }).message ||
            "Signup failed. Please try again.",
        );
      } else {
        toast.error("Signup failed. Please try again.");
      }
      console.error(error);
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  // -----------------------------
  // FORGOT PASSWORD HANDLER
  // -----------------------------
  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); // Set loading to true
    try {
      const res = await forgotPassword(email);
      if (res.success) {
        toast.success("Password reset email sent!");
      } else {
        toast.error(res.message || "Could not send email.");
      }
    } catch (error) {
      toast.error("An error occurred.");
      console.error(error);
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  const onSubmit = isForgotPassword
    ? handleForgotPassword
    : isLogin
      ? handleLogin
      : handleSignup;

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50 to-fuchsia-50 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950">
      {/* Decorative background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl animate-pulse dark:bg-fuchsia-500/15" />
        <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl animate-pulse dark:bg-indigo-500/15 [animation-delay:200ms]" />
        <div className="absolute bottom-[-6rem] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-sky-500/15 blur-3xl animate-pulse dark:bg-sky-500/10 [animation-delay:400ms]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.10),transparent_55%),radial-gradient(circle_at_bottom,rgba(236,72,153,0.10),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_55%),radial-gradient(circle_at_bottom,rgba(236,72,153,0.16),transparent_60%)]" />
      </div>

      <div className="relative mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-10">
        {/* Left panel (desktop) */}
        <div className="hidden lg:block animate-in fade-in slide-in-from-left-2 duration-500">
          <div className="max-w-lg">
            <p
              className="text-4xl tracking-tight text-foreground dark:text-foreground"
              style={{ fontFamily: "Rockybilly" }}
            >
              TradeBook
            </p>
            <p className="mt-3 text-base text-muted-foreground">
              A cleaner trading journal—fast entries, better insights, and a
              focused workflow.
            </p>

            <div className="mt-8 grid gap-4">
              <div className="rounded-2xl border bg-background/60 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/40">
                <p className="text-sm font-medium">Track with confidence</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Log trades, attach notes, and review performance with clarity.
                </p>
              </div>
              <div className="rounded-2xl border bg-background/60 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/40">
                <p className="text-sm font-medium">Stay consistent</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Build habits with a simple, distraction-free experience.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Auth card */}
        <div className="flex w-full flex-col items-center justify-center">
          <p
            className="mb-6 text-3xl tracking-tight text-foreground lg:hidden animate-in fade-in slide-in-from-top-1 duration-500"
            style={{ fontFamily: "Rockybilly" }}
          >
            TradeBook
          </p>

          <Card className="w-full max-w-md overflow-hidden border-white/20 bg-background/70 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500 dark:border-white/10">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">
                {isForgotPassword
                  ? "Reset your password"
                  : isLogin
                    ? "Welcome back"
                    : "Create your account"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {isForgotPassword
                  ? "We’ll email you a reset link."
                  : isLogin
                    ? "Log in to continue to your journal."
                    : "Start journaling your trades in minutes."}
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="flex flex-col gap-5">
                  {/* Name (Signup only) */}
                  {!isLogin && !isForgotPassword && (
                    <div className="grid gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your first name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        required
                      />
                    </div>
                  )}

                  {/* Email */}
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="abc@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>

                  {/* Password */}
                  {!isForgotPassword && (
                    <div className="grid gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        {isLogin && (
                          <Button
                            type="button"
                            variant="link"
                            onClick={() => setIsForgotPassword(true)}
                            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                            disabled={loading}
                          >
                            Forgot password?
                          </Button>
                        )}
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="abc@123"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={
                          isLogin ? "current-password" : "new-password"
                        }
                        required
                      />
                    </div>
                  )}

                  {/* Confirm Password (Signup only) */}
                  {!isLogin && !isForgotPassword && (
                    <div className="grid gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="abc@123"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  )}
                </div>

                <CardFooter className="flex flex-col gap-3 px-0">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <Spinner className="h-5 w-5" />
                    ) : isForgotPassword ? (
                      "Send reset email"
                    ) : isLogin ? (
                      "Login"
                    ) : (
                      "Create account"
                    )}
                  </Button>

                  {!isForgotPassword && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={googleLogin}
                      className="w-full"
                      disabled={loading}
                    >
                      <img
                        className="mr-2 h-5 w-5"
                        alt="Google"
                        src="https://img.icons8.com/?size=100&id=17949&format=png&color=000000"
                      />
                      Continue with Google
                    </Button>
                  )}

                  {isForgotPassword ? (
                    <Button
                      type="button"
                      variant="link"
                      className="w-full"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setIsLogin(true);
                      }}
                      disabled={loading}
                    >
                      Back to login
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="link"
                      className="w-full"
                      onClick={() => setIsLogin(!isLogin)}
                      disabled={loading}
                    >
                      {isLogin
                        ? "Don't have an account? Signup"
                        : "Already have an account? Login"}
                    </Button>
                  )}
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Auth;
