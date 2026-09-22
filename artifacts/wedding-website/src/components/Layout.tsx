import React from 'react';
import { Header } from './Header';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen relative bg-ivory selection:bg-taupe selection:text-espresso">
      <Header />
      
      <main className="flex-grow relative z-10 pt-24 md:pt-32">
        {children}
      </main>

      <footer className="bg-espresso text-ivory py-16 px-6 text-center mt-auto">
        <div className="font-display text-[32px] mb-6">J<span className="italic font-normal mx-1">&amp;</span>A</div>
        <div className="ui-label text-ivory/50">February 11, 2028 <span className="mx-2">|</span> Waiheke Island, NZ</div>
      </footer>
    </div>
  );
}
