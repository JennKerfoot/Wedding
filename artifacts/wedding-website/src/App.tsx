import { Route, Switch, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link } from 'wouter';
import Home from './pages/Home';
import Story from './pages/Story';
import WeddingParty from './pages/WeddingParty';
import Schedule from './pages/Schedule';
import Travel from './pages/Travel';
import Rsvp from './pages/Rsvp';
import Admin from './pages/Admin';

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ivory text-center px-6">
      <h1 className="font-display text-[72px] md:text-[96px] text-espresso leading-[0.9]">Not Found</h1>
      <p className="mt-6 font-body text-espresso max-w-md text-[18px]">The page you're looking for doesn't exist.</p>
      <Link href="/" className="btn-secondary mt-12">
        Return Home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/story" component={Story} />
          <Route path="/wedding-party" component={WeddingParty} />
          <Route path="/schedule" component={Schedule} />
          <Route path="/travel" component={Travel} />
          <Route path="/rsvp" component={Rsvp} />
          <Route path="/responses" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </WouterRouter>
    </QueryClientProvider>
  );
}
