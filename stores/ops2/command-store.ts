import { create } from 'zustand';

interface CommandStore {
  open: boolean;
  query: string;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
  setQuery: (q: string) => void;
}

export const useCommandStore = create<CommandStore>()((set) => ({
  open: false,
  query: '',
  openPalette:  () => set({ open: true }),
  closePalette: () => set({ open: false, query: '' }),
  togglePalette: () => set((s) => ({ open: !s.open, query: s.open ? '' : s.query })),
  setQuery: (query) => set({ query }),
}));
