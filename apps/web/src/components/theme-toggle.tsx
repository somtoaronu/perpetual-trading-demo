import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "./ui/button";

type ThemeMode = "dark" | "light";

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("theme") as ThemeMode) ?? "dark";
  });

  useEffect(() => {
    const root = document.body;
    if (mode === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("theme", mode);
  }, [mode]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setMode((prev) => (prev === "dark" ? "light" : "dark"))}
      aria-label="Toggle theme"
    >
      {mode === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
