import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "./theme-provider"
import { isTauri } from "@/lib/platform"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDesktop = isTauri()

  return (
    <Button
      variant="ghost"
      size={isDesktop ? "sm" : "icon"}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={isDesktop
        ? "h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        : "hover:bg-dev-primary/10 hover:text-dev-primary transition-colors"
      }
      title="Toggle theme"
    >
      <Sun className={`${isDesktop ? "h-3.5 w-3.5" : "h-[1.2rem] w-[1.2rem]"} rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0`} />
      <Moon className={`absolute ${isDesktop ? "h-3.5 w-3.5" : "h-[1.2rem] w-[1.2rem]"} rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}