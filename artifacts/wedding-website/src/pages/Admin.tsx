import React, { useState } from 'react';
import { useListRsvps, useCreateRsvpAdminSession, useDeleteRsvpAdminSession, getExportRsvpsUrl, getListRsvpsQueryKey } from '@workspace/api-client-react';
import { Layout } from '../components/Layout';
import { useQueryClient } from '@tanstack/react-query';

export default function Admin() {
  const [passphrase, setPassphrase] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem('rsvp-admin-unlocked') === 'true',
  );
  
  const queryClient = useQueryClient();

  const listQuery = useListRsvps({
    query: {
      enabled: unlocked,
      retry: false,
      queryKey: getListRsvpsQueryKey(),
    },
  });
  const loginMutation = useCreateRsvpAdminSession();
  const logoutMutation = useDeleteRsvpAdminSession();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    loginMutation.mutate({ data: { passphrase } }, {
      onSuccess: () => {
        sessionStorage.setItem('rsvp-admin-unlocked', 'true');
        setUnlocked(true);
      },
      onError: (err) => {
        setLoginError(err.data?.error || "Invalid passphrase");
      }
    });
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        sessionStorage.removeItem('rsvp-admin-unlocked');
        setUnlocked(false);
        queryClient.clear();
      }
    });
  };

  const isAuthenticated = unlocked && listQuery.isSuccess;
  const isLoading = (unlocked && listQuery.isLoading) || loginMutation.isPending;

  return (
    <Layout>
      <section className="px-6 pb-24 max-w-[1400px] w-full mx-auto min-h-[60vh]">
        <div className="mb-16 border-b border-taupe/40 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="ui-label text-saddle mb-4">Admin System</div>
            <h1 className="font-display text-[56px] lg:text-[72px] text-espresso leading-[0.9]">Responses</h1>
          </div>
          
          {isAuthenticated && (
            <div className="flex items-center gap-6">
              <a 
                href={getExportRsvpsUrl()} 
                className="btn-secondary"
                download="rsvps.csv"
              >
                Export CSV
              </a>
              <button 
                onClick={handleLogout}
                className="ui-label text-espresso/60 hover:text-espresso transition-colors ml-4"
              >
                Lock Session
              </button>
            </div>
          )}
        </div>

        {isLoading && !isAuthenticated && (
          <div className="text-left ui-label text-saddle animate-pulse">
            Authenticating...
          </div>
        )}

        {!isAuthenticated && !isLoading && (
          <div className="max-w-md mt-16 bg-ivory p-10 border border-taupe/30 shadow-sm">
            <form onSubmit={handleLogin} className="flex flex-col gap-8">
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-900 px-6 py-4 font-label uppercase tracking-widest text-[10px] font-medium">
                  {loginError}
                </div>
              )}

              <input
                type="text"
                name="username"
                autoComplete="username"
                value="wedding-admin"
                readOnly
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
              />
              
              <div className="flex flex-col">
                <label className="ui-label text-espresso/70 mb-3">Passphrase</label>
                <input 
                  type="password" 
                  value={passphrase}
                  onChange={e => setPassphrase(e.target.value)}
                  className="border-b border-taupe py-3 bg-transparent focus:border-espresso outline-none font-body text-[17px] text-espresso placeholder:text-espresso/30 transition-colors" 
                  placeholder="Enter to view responses" 
                  autoComplete="current-password"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loginMutation.isPending}
                className="btn-primary mt-4 self-start"
              >
                Unlock
              </button>
            </form>
          </div>
        )}

        {isAuthenticated && listQuery.data && (
          <div className="animate-fade-simple">
            {/* Totals Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 bg-ivory p-8 border border-taupe/30 shadow-sm">
              <div className="flex flex-col">
                <div className="ui-label text-espresso/60 mb-2">Total Responses</div>
                <div className="font-display text-[48px] text-espresso leading-none">{listQuery.data.totals.responses}</div>
              </div>
              <div className="flex flex-col">
                <div className="ui-label text-espresso/60 mb-2">Attending Guests</div>
                <div className="font-display text-[48px] text-espresso leading-none">{listQuery.data.totals.attendingGuests}</div>
              </div>
              <div className="flex flex-col">
                <div className="ui-label text-espresso/60 mb-2">Attending Parties</div>
                <div className="font-display text-[48px] text-espresso leading-none">{listQuery.data.totals.attendingParties}</div>
              </div>
              <div className="flex flex-col">
                <div className="ui-label text-espresso/40 mb-2">Declined</div>
                <div className="font-display text-[48px] text-espresso/40 leading-none">{listQuery.data.totals.decliningParties}</div>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto w-full bg-ivory border border-taupe/30 shadow-sm">
              <table className="w-full text-left font-body text-[15px] text-espresso whitespace-nowrap">
                <thead>
                  <tr className="border-b border-taupe/40 bg-sand/50">
                    <th className="ui-label text-espresso/70 py-5 px-6 font-normal">Names</th>
                    <th className="ui-label text-espresso/70 py-5 px-6 font-normal">Status</th>
                    <th className="ui-label text-espresso/70 py-5 px-6 font-normal">Size</th>
                    <th className="ui-label text-espresso/70 py-5 px-6 font-normal">Email</th>
                    <th className="ui-label text-espresso/70 py-5 px-6 font-normal">Dietary / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-taupe/20">
                  {listQuery.data.responses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center italic text-espresso/50 text-[16px]">
                        No responses yet.
                      </td>
                    </tr>
                  ) : (
                    listQuery.data.responses.map((rsvp) => (
                      <tr key={rsvp.id} className="hover:bg-sand/30 transition-colors">
                        <td className="py-5 px-6 font-medium">{rsvp.names}</td>
                        <td className="py-5 px-6">
                          {rsvp.attendance === 'attending' 
                            ? <span className="text-olive">Attending</span> 
                            : <span className="text-espresso/40 italic">Declined</span>}
                        </td>
                        <td className="py-5 px-6 text-espresso/80">{rsvp.partySize > 0 ? rsvp.partySize : '-'}</td>
                        <td className="py-5 px-6 text-espresso/70">{rsvp.email}</td>
                        <td className="py-5 px-6 text-[14px] text-espresso/80 max-w-xs truncate" title={`${rsvp.dietaryNotes || ''} ${rsvp.message || ''} ${rsvp.songRequest || ''}`}>
                          {rsvp.dietaryNotes && <div className="truncate mb-1"><span className="ui-label text-saddle mr-2">Diet</span> {rsvp.dietaryNotes}</div>}
                          {rsvp.songRequest && <div className="truncate mb-1"><span className="ui-label text-saddle mr-2">Song</span> {rsvp.songRequest}</div>}
                          {rsvp.message && <div className="truncate"><span className="ui-label text-saddle mr-2">Msg</span> {rsvp.message}</div>}
                          {!rsvp.dietaryNotes && !rsvp.message && !rsvp.songRequest && <span className="opacity-30">-</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}
