import React from 'react';
import { Layout } from '../components/Layout';

export default function Travel() {
  return (
    <Layout>
      <section className="py-12 md:py-24 px-6 bg-ivory">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-24 animate-fade delay-1">
            <div className="ui-label text-saddle mb-6 tracking-[0.18em]">Chapter Five</div>
            <h2 className="font-display text-[56px] md:text-[72px] text-espresso">Travel &amp; Lodging</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 md:gap-24 animate-fade delay-2">
            <div>
              <h3 className="font-display text-[40px] md:text-[48px] text-espresso mb-8">Getting There</h3>
              <p className="font-body text-[16px] md:text-[17px] text-espresso/80 leading-[1.7] mb-6">
                Fly into Auckland (AKL) — note that flights from the US cross the dateline, so you'll lose a day traveling and gain it back on the return. From downtown Auckland, take the ~40-minute ferry across the harbour to Waiheke Island. Shuttles and taxis are available at the island terminal.
              </p>
              <p className="font-body text-[16px] md:text-[17px] italic text-saddle mb-12">
                Book early; February is peak summer season in New Zealand.
              </p>
              
              <ul className="space-y-5">
                <li className="flex justify-between items-center border-b border-taupe/40 pb-4">
                  <span className="ui-label text-espresso">Flight Guidance</span>
                  <span className="ui-label text-espresso/40">Pending</span>
                </li>
                <li className="flex justify-between items-center border-b border-taupe/40 pb-4">
                  <span className="ui-label text-espresso">Ferry Details</span>
                  <span className="ui-label text-espresso/40">Pending</span>
                </li>
                <li className="flex justify-between items-center border-b border-taupe/40 pb-4">
                  <span className="ui-label text-espresso">Shuttle &amp; Taxi</span>
                  <span className="ui-label text-espresso/40">Pending</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-display text-[40px] md:text-[48px] text-espresso mb-8">Where to Stay</h3>
              <p className="font-body text-[16px] md:text-[17px] text-espresso/80 leading-[1.7] mb-12">
                Please plan to stay on Waiheke Island the night of the wedding. Oneroa is the closest village to the venue, while Palm Beach and Onetangi offer beautiful beachside options a bit further out.
              </p>
              
              <ul className="space-y-5 mt-auto">
                <li className="flex justify-between items-center border-b border-taupe/40 pb-4">
                  <span className="ui-label text-espresso">Lodging Short List</span>
                  <span className="ui-label text-espresso/40">Pending</span>
                </li>
                <li className="flex justify-between items-center border-b border-taupe/40 pb-4">
                  <span className="ui-label text-espresso">Extend-Your-Trip Recs</span>
                  <span className="ui-label text-espresso/40">Pending</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
