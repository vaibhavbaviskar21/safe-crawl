
"use client"; // Mark as client component for state/interaction

import Link from 'next/link';
import { ShieldCheck, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react'; // Import hooks for theme toggle

export default function Navbar() {
  // Basic theme toggle state (replace with a proper theme provider if needed)
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Apply theme on mount and when darkMode changes
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Optionally save preference to localStorage
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

   useEffect(() => {
    // Check localStorage for theme preference on initial load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);


  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
              <ShieldCheck className="h-7 w-7" />
              <span className="text-xl font-bold">SafeCrawl</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Home
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
              About
            </Link>
             <Link href="/features" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Features
            </Link>
             {/* Add more links as needed */}
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
             {/* You can add Auth buttons here if needed */}
          </div>
        </div>
      </div>
    </nav>
  );
}
