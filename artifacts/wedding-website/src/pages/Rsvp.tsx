import React, { useState } from 'react';
import { useCreateRsvp } from '@workspace/api-client-react';
import { Horseshoe } from '../components/icons';
import { Layout } from '../components/Layout';

export default function Rsvp() {
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const createRsvp = useCreateRsvp();

  const handleRsvpSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    
    const fd = new FormData(e.currentTarget);
    const data = {
      names: fd.get('names') as string,
      email: fd.get('email') as string,
      attendance: fd.get('attendance') as 'attending' | 'declining',
      partySize: parseInt(fd.get('partySize') as string, 10),
      dietaryNotes: (fd.get('dietaryNotes') as string) || undefined,
      songRequest: (fd.get('songRequest') as string) || undefined,
      message: (fd.get('message') as string) || undefined,
    };
    
    createRsvp.mutate({ data }, {
      onSuccess: () => {
        setRsvpSubmitted(true);
      },
      onError: (err) => {
        setErrorMsg(err.data?.error || "Something went wrong. Please try again.");
      }
    });
  };

  return (
    <Layout>
      <section className="py-12 md:py-24 px-6 bg-ivory text-center min-h-[70vh]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-[56px] md:text-[80px] text-espresso mb-8 animate-fade delay-1">Kindly Reply</h2>
          
          {rsvpSubmitted ? (
            <div className="mt-16 py-24 px-8 border-y border-taupe/50 animate-fade-simple">
              <Horseshoe className="w-12 h-12 text-saddle mx-auto mb-10" />
              <p className="font-display text-[48px] italic text-espresso mb-6">lucky us</p>
              <p className="font-body text-[18px] text-espresso/70">
                We have received your response. We look forward to seeing you.
              </p>
            </div>
          ) : (
            <div className="animate-fade delay-2">
              <p className="font-display text-[28px] md:text-[36px] text-espresso/80 italic mb-20 leading-tight">
                Whether you're joining us or committing a grave error in judgment — we need a count either way.
              </p>
              
              <form onSubmit={handleRsvpSubmit} className="flex flex-col gap-10 text-left py-10 md:py-16 border-y border-taupe/50">
                {errorMsg && (
                  <div className="bg-red-50 text-red-900 px-6 py-4 text-[14px] text-center border border-red-200 font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="flex flex-col">
                    <label className="ui-label text-espresso/60 mb-3">Name(s)</label>
                    <input required name="names" type="text" className="border-b border-taupe py-3 bg-transparent focus:border-espresso font-body text-[17px] text-espresso placeholder:text-espresso/30 transition-colors" placeholder="First and last" />
                  </div>
                  <div className="flex flex-col">
                    <label className="ui-label text-espresso/60 mb-3">Email</label>
                    <input required name="email" type="email" className="border-b border-taupe py-3 bg-transparent focus:border-espresso font-body text-[17px] text-espresso placeholder:text-espresso/30 transition-colors" placeholder="For updates" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="flex flex-col">
                    <label className="ui-label text-espresso/60 mb-3">Attendance</label>
                    <div className="relative">
                    <select required name="attendance" defaultValue="" className="w-full border-b border-taupe py-3 bg-transparent focus:border-espresso font-body text-[17px] text-espresso appearance-none rounded-none cursor-pointer transition-colors">
                        <option value="" disabled hidden>Select...</option>
                        <option value="attending">Joyfully accepts</option>
                        <option value="declining">Regretfully declines</option>
                      </select>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-espresso/40 text-[10px]">▼</div>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="ui-label text-espresso/60 mb-3">Party Size</label>
                    <input required name="partySize" type="number" min="0" max="12" className="border-b border-taupe py-3 bg-transparent focus:border-espresso font-body text-[17px] text-espresso placeholder:text-espresso/30 transition-colors" placeholder="Number of guests" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="ui-label text-espresso/60 mb-3">Dietary Notes</label>
                  <input name="dietaryNotes" type="text" className="border-b border-taupe py-3 bg-transparent focus:border-espresso font-body text-[17px] text-espresso placeholder:text-espresso/30 transition-colors" placeholder="Optional" />
                </div>

                <div className="flex flex-col">
                  <label className="ui-label text-espresso/60 mb-3">A song that gets you dancing</label>
                  <input name="songRequest" type="text" className="border-b border-taupe py-3 bg-transparent focus:border-espresso font-body text-[17px] text-espresso placeholder:text-espresso/30 transition-colors" placeholder="Optional" />
                </div>

                <div className="flex flex-col">
                  <label className="ui-label text-espresso/60 mb-3">Anything else?</label>
                  <textarea name="message" rows={2} className="border-b border-taupe py-3 bg-transparent focus:border-espresso font-body text-[17px] text-espresso resize-none placeholder:text-espresso/30 transition-colors" placeholder="Optional"></textarea>
                </div>

                <div className="mt-8 text-center">
                  <button type="submit" disabled={createRsvp.isPending} className="btn-primary w-full md:w-auto md:min-w-[240px]">
                    {createRsvp.isPending ? 'Submitting...' : 'Send Reply'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
