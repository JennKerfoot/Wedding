import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';

export function Header() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  
  const isAdmin = location.startsWith('/responses');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { href: '/', label: 'Welcome' },
    { href: '/story', label: 'Story' },
    { href: '/wedding-party', label: 'Wedding Party' },
    { href: '/schedule', label: 'Schedule' },
    { href: '/travel', label: 'Travel' },
    { href: '/rsvp', label: 'RSVP' }
  ];

  const handleLinkClick = () => {
    setOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-colors duration-500 ${
          scrolled || open || isAdmin ? 'bg-ivory/95 backdrop-blur-sm border-b border-taupe/40 shadow-sm' : 'bg-transparent border-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between h-20 md:h-24">
          
          <div className="w-1/3 hidden lg:flex items-center gap-8">
            {!isAdmin ? links.slice(0, 3).map(link => (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`ui-label transition-colors ${location === link.href ? 'text-espresso' : 'text-espresso/70 hover:text-espresso'}`}
              >
                {link.label}
              </Link>
            )) : (
              <Link href="/" className={`ui-label transition-colors text-espresso/70 hover:text-espresso`}>
                Return to Site
              </Link>
            )}
          </div>

          <div className="flex-1 lg:w-1/3 flex justify-start lg:justify-center">
            <Link 
              href="/" 
              className={`font-display text-[28px] md:text-[36px] leading-none transition-colors text-espresso`} 
              onClick={handleLinkClick}
            >
              J<span className="italic font-normal mx-1">&amp;</span>A
            </Link>
          </div>

          <div className="w-1/3 hidden lg:flex items-center justify-end gap-8">
             {!isAdmin && links.slice(3).map(link => (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`ui-label transition-colors ${
                  link.href === '/rsvp' 
                    ? 'text-saddle font-medium'
                    : location === link.href ? 'text-espresso' : 'text-espresso/70 hover:text-espresso'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="lg:hidden flex items-center">
            <button 
               className={`icon-button text-espresso`}
              onClick={() => setOpen(!open)} 
               aria-label={open ? "Close menu" : "Open menu"}
               aria-expanded={open}
              aria-controls="mobile-menu"
            >
              {open ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        id="mobile-menu"
        className={`fixed inset-0 bg-ivory z-40 transition-opacity duration-500 lg:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!open}
      >
        <div className="flex flex-col h-full pt-28 px-8 pb-12">
          <div className="flex flex-col gap-8 text-center">
            {!isAdmin ? links.map(link => (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`font-display text-[36px] ${location === link.href ? 'text-saddle' : 'text-espresso'}`} 
                onClick={handleLinkClick}
                tabIndex={open ? undefined : -1}
              >
                {link.label}
              </Link>
            )) : (
              <Link 
                href="/" 
                className="font-display text-[36px] text-espresso" 
                onClick={handleLinkClick}
                tabIndex={open ? undefined : -1}
              >
                Return to Site
              </Link>
            )}
          </div>
          
          <div className="mt-auto text-center ui-label text-espresso/50 tracking-[0.2em]">
            Waiheke Island, NZ
          </div>
        </div>
      </div>
    </>
  );
}
