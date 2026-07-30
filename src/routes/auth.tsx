import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Loader2, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/brand/logo";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — AEGIS Emergency Intelligence" },
      {
        name: "description",
        content:
          "Sign in or create your AEGIS account to activate AI-powered emergency response, crash detection and trusted contacts.",
      },
      { property: "og:title", content: "Sign in — AEGIS" },
      {
        property: "og:description",
        content: "Access your AEGIS emergency intelligence dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);

  const destination = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/dashboard";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: destination, replace: true });
    });
  }, [destination, navigate]);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back to AEGIS");
    navigate({ to: destination, replace: true });
  }

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin + "/onboarding",
        data: { full_name: fullName.trim() },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      setSent("confirm");
      toast.success("Check your email to confirm your account");
      return;
    }
    toast.success("Account created — let's set up your safety profile");
    navigate({ to: "/onboarding", replace: true });
  }

  async function handleReset(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + "/reset-password",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent("reset");
    toast.success("Reset link sent");
  }

  return (
    <div className="aurora grid min-h-dvh place-items-center bg-background px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="mb-6 flex justify-center">
          <Link to="/" aria-label="AEGIS home">
            <Logo />
          </Link>
        </div>

        <div className="glass-panel rounded-3xl p-6 sm:p-8">
          {sent ? (
            <div className="text-center">
              <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Mail className="size-6" />
              </span>
              <h1 className="text-xl font-semibold text-foreground">Check your inbox</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {sent === "confirm"
                  ? `We sent a confirmation link to ${email}. Confirm it to activate emergency protection.`
                  : `We sent a password reset link to ${email}.`}
              </p>
              <Button variant="outline" className="mt-6 w-full" onClick={() => setSent(null)}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <Tabs value={mode} onValueChange={setMode}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
                <TabsTrigger value="forgot">Reset</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in to reach your emergency network in seconds.
                </p>
                <form className="mt-6 space-y-4" onSubmit={handleSignIn}>
                  <Field
                    id="signin-email"
                    label="Email"
                    icon={Mail}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                  />
                  <Field
                    id="signin-password"
                    label="Password"
                    icon={LockKeyhole}
                    type="password"
                    value={password}
                    onChange={setPassword}
                    autoComplete="current-password"
                  />
                  <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                    Sign in
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <h1 className="text-xl font-semibold text-foreground">Create your AEGIS account</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Takes under two minutes to be protected.
                </p>
                <form className="mt-6 space-y-4" onSubmit={handleSignUp}>
                  <Field
                    id="signup-name"
                    label="Full name"
                    icon={UserRound}
                    value={fullName}
                    onChange={setFullName}
                    autoComplete="name"
                  />
                  <Field
                    id="signup-email"
                    label="Email"
                    icon={Mail}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                  />
                  <Field
                    id="signup-password"
                    label="Password"
                    icon={LockKeyhole}
                    type="password"
                    value={password}
                    onChange={setPassword}
                    autoComplete="new-password"
                    hint="Minimum 8 characters"
                  />
                  <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                    Create account
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="forgot" className="mt-6">
                <h1 className="text-xl font-semibold text-foreground">Reset password</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  We'll email you a secure link to choose a new password.
                </p>
                <form className="mt-6 space-y-4" onSubmit={handleReset}>
                  <Field
                    id="reset-email"
                    label="Email"
                    icon={Mail}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                  />
                  <Button type="submit" variant="outline" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                    Send reset link
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Protected by end-to-end encryption. Your medical data stays private.
        </p>
      </motion.div>
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  autoComplete,
  hint,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={type}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 rounded-xl pl-9"
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}