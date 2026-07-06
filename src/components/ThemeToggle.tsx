"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("dp-theme", next ? "dark" : "light");
    } catch {
      // Private browsing: theme just won't persist.
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="h-9 w-9 grid place-items-center rounded-full border border-line text-muted hover:text-ink hover:border-faint transition-colors"
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}
