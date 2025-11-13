import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/atoms/Button";
import { Text } from "@/components/atoms/Text";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/utils/classname.utils";
import { Menu, X, Sun, Moon } from "lucide-react";
import { trackThemeToggle } from "@/utils/analytics.utils";
import { usePageTracking } from "@/hooks/useAnalytics";

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  usePageTracking();

  const navLinks = [
    { path: "/playground", label: "Playground" },
    { path: "/how-to-use", label: "How to use" },
    { path: "/about", label: "About" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full border-2 border-black shadow-md bg-card",
        "transition-all duration-200"
      )}
    >
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Text as="h4" className="font-bold">
              Orchestrator
            </Text>
            <Text as="p" className="text-sm text-muted-foreground">
              by @sihilelh
            </Text>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "font-head transition-all duration-200 no-underline",
                  isActive(link.path)
                    ? "font-bold text-primary"
                    : "text-foreground hover:text-primary"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newTheme = theme === "light" ? "dark" : "light";
                toggleTheme();
                trackThemeToggle(newTheme);
              }}
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            {/* CTA Button */}
            <Button variant="default" size="md" asChild>
              <Link to="/playground">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newTheme = theme === "light" ? "dark" : "light";
                toggleTheme();
                trackThemeToggle(newTheme);
              }}
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            className={cn(
              "md:hidden border-t-2 border-black py-4 space-y-3",
              "bg-card"
            )}
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "block px-4 py-2 rounded transition-all duration-200",
                  isActive(link.path)
                    ? "bg-primary text-primary-foreground font-bold"
                    : "hover:bg-muted"
                )}
              >
                <Text as="p">{link.label}</Text>
              </Link>
            ))}
            <div className="px-4 pt-2">
              <Button
                variant="default"
                size="md"
                className="w-full"
                asChild
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Link to="/playground">Get Started</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
