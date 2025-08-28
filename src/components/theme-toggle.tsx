"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
 const { theme, setTheme } = useTheme();
 const [mounted, setMounted] = useState(false);

 useEffect(() => {
  setMounted(true);
 }, []);

 const toggleTheme = () => {
  if (theme === "light") {
   setTheme("dark");
  } else if (theme === "dark") {
   setTheme("system");
  } else {
   setTheme("light");
  }
 };

 const getIcon = () => {
  if (!mounted) {
   return <Sun className="h-4 w-4" />; // Default icon for SSR
  }

  if (theme === "dark") {
   return <Moon className="h-4 w-4" />;
  } else if (theme === "light") {
   return <Sun className="h-4 w-4" />;
  } else {
   // System theme - show sun/moon based on system preference
   const isDarkSystem = window.matchMedia(
    "(prefers-color-scheme: dark)"
   ).matches;
   return isDarkSystem ? (
    <Moon className="h-4 w-4" />
   ) : (
    <Sun className="h-4 w-4" />
   );
  }
 };

 const getTooltip = () => {
  if (!mounted) return "Toggle theme";

  if (theme === "light") return "Switch to dark mode";
  if (theme === "dark") return "Switch to system theme";
  return "Switch to light mode";
 };

 return (
  <Button
   variant="outline"
   size="sm"
   onClick={toggleTheme}
   className="h-9 w-9 p-0 border-border hover:bg-accent hover:text-accent-foreground"
   title={getTooltip()}
  >
   {getIcon()}
   <span className="sr-only">Toggle theme</span>
  </Button>
 );
}
