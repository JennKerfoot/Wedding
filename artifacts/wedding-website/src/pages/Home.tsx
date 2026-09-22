import React from 'react';
import { Countdown } from '../components/Countdown';
import { Layout } from '../components/Layout';
import { Link } from 'wouter';

export default function Home() {
  return (
    <Layout>
      {/* HERO */}
      <section className="px-6 md:px-12 pb-24 max-w-[1400px] mx-auto w-full flex flex-col items-center">
        <div className="text-center mb-10 md:mb-16 mt-8 md:mt-12 animate-fade delay-1">
          <div className="ui-label text-saddle mb-6 md:mb-8 tracking-[0.18em]">
            February 11, 2028 <span className="mx-2 md:mx-4 opacity-50">|</span> Waiheke Island, NZ
          </div>
          
          <h1 className="font-display text-[64px] sm:text-[80px] md:text-[100px] leading-[0.9] text-espresso mb-6">
            Jenn Wiles <span className="italic font-normal mx-2 md:mx-4">&amp;</span> Anna de Klerk
          </h1>
          
          <div className="font-display text-[28px] md:text-[36px] italic text-espresso/80">
            are getting married
          </div>
        </div>

        <div className="w-full aspect-[4/5] md:aspect-[21/9] lg:aspect-[2.5/1] relative animate-fade delay-2 overflow-hidden bg-sand">
          <img 
            src={`${import.meta.env.BASE_URL}jenn-anna-coast.jpg`} 
            alt="Jenn and Anna on the coast" 
            className="absolute inset-0 w-full h-full object-cover object-[50%_40%]" 
          />
        </div>
        
        <div className="mt-12 md:mt-16 flex flex-col items-center gap-8 animate-fade delay-3">
          <Countdown light />
          <Link href="/rsvp" className="btn-primary mt-2">
            Kindly Reply
          </Link>
        </div>
      </section>

      {/* WELCOME */}
      <section className="py-24 md:py-32 px-6 bg-ivory">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-[40px] md:text-[56px] text-espresso italic leading-[1.1] mb-16">
            Welcome — and, for many of you, welcome to New Zealand.
          </h2>
          
          <div className="font-body text-[16px] md:text-[18px] text-espresso/80 leading-[1.8] space-y-8 text-left md:text-center">
            <p>
              We're Jenn and Anna. One of us is from America, one of us is from New Zealand, and between us we've crossed the Pacific more times than either of our passports would care to admit. On February 11, 2028, we're closing the long-distance chapter the best way we know how: with everyone we love in one place, on an island, with dinner and dancing above the harbour at Mudbrick Vineyard.
            </p>
            <p>
              If you're here with Jenn and haven't properly met Anna yet — or you've known Anna forever and still owe Jenn a hello — this weekend is for exactly that. Come early, stay late, and plan on leaving with a new favorite person from the other hemisphere.
            </p>
            <p>
              This site holds everything you'll need: the weekend's schedule, how to get to Waiheke Island, where to stay, and the RSVP. Details will keep filling in as we confirm them, so check back before you book anything.
            </p>
            <p>
              We know what we're asking — for most of you, getting here is a genuine journey. That isn't lost on us, and we can't wait to thank you for it in person.
            </p>
          </div>
          
          <div className="mt-20 pt-16 border-t border-taupe/40 text-center flex flex-col items-center">
            <p className="italic text-espresso/60 mb-6 text-[18px]">With love (and with Winslow and Bear's enthusiastic approval),</p>
            <div className="font-display text-[48px] text-espresso">Jenn <span className="italic text-saddle mx-1">&amp;</span> Anna</div>
          </div>
        </div>
      </section>

      {/* IMAGE BREAK */}
      <section className="px-6 md:px-12 py-12 pb-24 md:pb-32 max-w-[1400px] mx-auto w-full">
        <div className="w-full aspect-[16/9] relative overflow-hidden bg-sand">
          <img 
            src={`${import.meta.env.BASE_URL}table-story.jpg`} 
            alt="Atmospheric table setting" 
            className="w-full h-full object-cover object-center opacity-90"
          />
        </div>
      </section>
    </Layout>
  );
}
