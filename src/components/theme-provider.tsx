"use client";

import { useEffect } from "react";

type ThemeProviderProps = {
 children: React.ReactNode;
};

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
 useEffect(() => {
  const root = window.document.documentElement;
  root.classList.remove("light");
  root.classList.add("dark");
 }, []);

 return <div {...props}>{children}</div>;
}
