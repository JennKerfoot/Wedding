import React from 'react';
import { Layout } from '../components/Layout';
import { HumanPortraitPlaceholder, DogPortraitWinslow, DogPortraitBear } from '../components/icons';

export default function WeddingParty() {
  return (
    <Layout>
      <section className="py-12 md:py-24 px-6 bg-ivory">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24 animate-fade delay-1">
            <div className="ui-label text-saddle mb-6 tracking-[0.18em]">Chapter Three</div>
            <h2 className="font-display text-[56px] md:text-[72px] text-espresso mb-8">The Wedding Party</h2>
            <p className="font-body text-[16px] md:text-[18px] text-espresso/70 max-w-2xl mx-auto leading-relaxed">
              Gathered from both sides of the Pacific.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 md:gap-12 text-center animate-fade delay-2">
            {Array.from({length: 4}).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <HumanPortraitPlaceholder className="w-32 h-40 mb-8" />
                <h3 className="font-display text-[32px] text-espresso mb-3">Name</h3>
                <div className="ui-label text-saddle mb-4">Role</div>
                <p className="font-body text-[15px] text-espresso/60 italic">Details to follow...</p>
              </div>
            ))}
          </div>

          <div className="mt-32 pt-24 border-t border-taupe/60 max-w-4xl mx-auto animate-fade delay-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-20">
              <div className="flex flex-col items-center text-center">
                <DogPortraitWinslow className="w-24 text-espresso mb-8" />
                <h3 className="font-display text-[32px] text-espresso mb-3">Winslow</h3>
                <div className="ui-label text-saddle mb-4">Ring Security</div>
                <p className="font-body text-[15px] text-espresso/70 leading-relaxed max-w-xs">
                  Would eat the rings if given half a chance; retained regardless.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <DogPortraitBear className="w-24 text-espresso mb-8" />
                <h3 className="font-display text-[32px] text-espresso mb-3">Bear</h3>
                <div className="ui-label text-saddle mb-4">Best Boy</div>
                <p className="font-body text-[15px] text-espresso/70 leading-relaxed max-w-xs">
                  In charge of morale and the inspection of all hors d'oeuvres.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
