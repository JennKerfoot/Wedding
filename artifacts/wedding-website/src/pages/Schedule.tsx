import { Layout } from '../components/Layout';

const events = [
  {
    id: 'welcome',
    date: 'Feb 10',
    title: 'The Welcome',
    desc: 'A relaxed evening to shake off the jet lag and put faces to names.',
    tbd: 'Times & venue to follow',
  },
  {
    id: 'wedding',
    date: 'Feb 11',
    title: 'The Wedding',
    desc: 'Ceremony and reception at Mudbrick Vineyard — vows in the vines, dinner and dancing above the harbour.',
    tbd: 'Times to follow',
    calendarFile: `${import.meta.env.BASE_URL}jenn-and-anna-wedding.ics`,
  },
  {
    id: 'farewell',
    date: 'Feb 12',
    title: 'The Farewell',
    desc: 'Coffee and proper goodbyes before everyone scatters back across two hemispheres.',
    tbd: 'Details to follow',
  },
];

export default function Schedule() {
  return (
    <Layout>
      <section className="py-12 md:py-24 px-6 bg-ivory">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-24 animate-fade delay-1">
            <div className="ui-label text-saddle mb-6 tracking-[0.18em]">Chapter Four</div>
            <h2 className="font-display text-[56px] md:text-[72px] text-espresso mb-8">The Schedule</h2>
          </div>
          
          <div className="space-y-16 animate-fade delay-2">
            {events.map((evt) => (
              <div key={evt.id} className="flex flex-col md:flex-row gap-6 md:gap-12 text-center md:text-left border-b border-taupe/50 pb-12 last:border-0 last:pb-0 items-center md:items-start">
                <div className="md:w-1/4">
                   <span className="ui-label text-saddle block mb-2" data-testid={`text-event-date-${evt.id}`}>{evt.date}</span>
                </div>
                <div className="md:w-3/4 flex flex-col md:flex-row gap-6 md:gap-12">
                  <div className="md:w-3/5">
                     <h3 className="font-display text-[32px] md:text-[40px] text-espresso mb-4" data-testid={`text-event-title-${evt.id}`}>{evt.title}</h3>
                     <p className="font-body text-[16px] md:text-[17px] text-espresso/80 leading-[1.6]" data-testid={`text-event-description-${evt.id}`}>{evt.desc}</p>
                  </div>
                  <div className="md:w-2/5 md:text-right mt-2 md:mt-0">
                     <span className="ui-label text-espresso/40 block" data-testid={`status-event-${evt.id}`}>{evt.tbd}</span>
                     {evt.calendarFile && (
                       <a
                         href={evt.calendarFile}
                         className="btn-secondary mt-5 w-full md:w-auto"
                         data-testid={`link-add-calendar-${evt.id}`}
                       >
                         Add date to calendar
                       </a>
                     )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-32 text-center max-w-3xl mx-auto py-12 md:py-20 border-y border-taupe/50 animate-fade delay-3">
            <h3 className="font-display text-[40px] md:text-[48px] text-espresso mb-4">Attire</h3>
            <p className="font-display text-[28px] md:text-[36px] text-saddle italic mb-8">Cowboy formal, summer edition.</p>
            <p className="font-body text-[16px] md:text-[17px] text-espresso/80 leading-[1.8]">
              February is high summer on Waiheke: sun, sea breeze, and vineyard lawn. Dress for a beautiful dinner that ends on a dance floor — and in the words of Dolly Parton, <span className="italic">it costs a lot of money to look this cheap.</span>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
