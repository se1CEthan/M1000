import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { SmartSellerLink } from '@/components/ui/smart-seller-link';

export function Footer() {
  return (
    <footer className="relative border-t border-border/50 bg-card/50 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="container mx-auto px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2">
              <img 
                src="/logo.png" 
                alt="Seltech Logo" 
                className="h-8 w-8"
              />
              <span className="text-lg font-semibold tracking-tight text-foreground font-display">
                Sel<span className="text-primary">tech</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">
              Digital marketplace for developers. Buy and sell bots, software, templates, and digital assets. Crypto payments. 90% seller share.
            </p>
            <div className="flex gap-3">
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors" aria-label="GitHub">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors" aria-label="Email">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Marketplace */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground font-display">Marketplace</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/marketplace?category=bots" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Bots
                </Link>
              </li>
              <li>
                <Link to="/marketplace?category=software" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Software
                </Link>
              </li>
              <li>
                <Link to="/marketplace?category=templates" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Templates
                </Link>
              </li>
              <li>
                <Link to="/marketplace?category=assets" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Assets
                </Link>
              </li>
              <li>
                <Link to="/marketplace?category=apis" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  APIs
                </Link>
              </li>
              <li>
                <Link to="/marketplace?category=plugins" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Plugins
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground font-display">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <SmartSellerLink className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Start Selling
                </SmartSellerLink>
              </li>
              <li>
                <Link to="/help" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/sitemap" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Site Map
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground font-display">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/seller-agreement" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Seller Agreement
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/content-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Content Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Seltech. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Built by <span className="font-medium text-primary">SELLE ETHAN</span>
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Payments powered by <span className="font-medium text-foreground">Cryptomus</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
