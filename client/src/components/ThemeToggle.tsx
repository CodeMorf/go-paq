import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "./ui/button";

export default function ThemeToggle() {
  const { theme, toggleTheme, switchable } = useTheme();
  if (!switchable || !toggleTheme) return null;
  const isDark = theme === "dark";
  return (
    <Button variant="outline" size="sm" onClick={toggleTheme} aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"} className="gap-2">
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden sm:inline">{isDark ? "Tema claro" : "Tema oscuro"}</span>
    </Button>
  );
}
