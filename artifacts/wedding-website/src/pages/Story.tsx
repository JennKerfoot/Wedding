import React from 'react';
import { Layout } from '../components/Layout';

export default function Story() {
  return (
    <Layout>
      <section className="py-12 md:py-24 px-6 bg-ivory">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-24 animate-fade delay-1">
            <div className="ui-label text-saddle mb-6 tracking-[0.18em]">Chapter Two</div>
            <h2 className="font-display text-[56px] md:text-[72px] text-espresso mb-8">The Story So Far</h2>
            <p className="font-body text-[16px] md:text-[18px] text-espresso/70 max-w-2xl mx-auto leading-relaxed">
              One of us is from America, one of us is from New Zealand, and the story so far has covered a remarkable amount of the distance in between.
            </p>
          </div>
          
          <div className="space-y-16 animate-fade delay-2">
            {[
              { year: 'TBD', title: 'The first meeting', desc: null },
              { year: 'TBD', title: 'The first date', desc: null },
              { year: 'TBD', title: 'The long-distance years', desc: null },
              { year: 'TBD', title: 'The proposal', desc: null },
              { year: 'Feb 2028', title: 'The wedding', desc: "Mudbrick Vineyard, Waiheke Island — and you're invited." },
            ].map((event, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-4 md:gap-12 md:items-baseline border-b border-taupe/50 pb-12 last:border-0 last:pb-0">
                <div className="md:w-1/4">
                  <span className="ui-label text-saddle">{event.year === 'TBD' ? <span className="opacity-50">Details to follow</span> : event.year}</span>
                </div>
                <div className="md:w-1/2">
                  <h3 className="font-display text-[32px] md:text-[40px] text-espresso">{event.title}</h3>
                </div>
                <div className="md:w-1/4 md:text-right text-left">
                  <span className="font-body text-[15px] text-espresso/70 leading-relaxed block">{event.desc || <span className="italic opacity-50">Content Pending</span>}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
