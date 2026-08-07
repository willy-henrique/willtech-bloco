import { useEffect, useState } from 'react';
import { AppProviders } from './providers';
import { AppRouter } from './router';
import { CommandPalette } from '../features/command-palette/CommandPalette';

function GlobalCommandListener() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('willtech:open-command', onOpen as EventListener);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('willtech:open-command', onOpen as EventListener);
    };
  }, []);

  return <CommandPalette open={open} onClose={() => setOpen(false)} />;
}

export default function App() {
  return (
    <AppProviders>
      <div className="min-h-dvh">
        <AppRouter />
        <GlobalCommandListener />
      </div>
    </AppProviders>
  );
}
