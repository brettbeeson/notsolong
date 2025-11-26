import { create } from "zustand";

interface HistoryState {
  items: number[];
  index: number;
  record: (id: number) => void;
  setIndex: (index: number) => void;
  reset: (initialId?: number) => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  items: [],
  index: -1,
  record: (id) =>
    set((state) => {
      const upto =
        state.index >= 0 ? state.items.slice(0, state.index + 1) : [];
      const last = upto[upto.length - 1];
      if (last === id) {
        return state;
      }
      const nextItems = [...upto, id];
      return {
        items: nextItems,
        index: nextItems.length - 1,
      };
    }),
  setIndex: (index) =>
    set((state) => {
      if (index < 0 || index >= state.items.length || index === state.index) {
        return state;
      }
      return { ...state, index };
    }),
  reset: (initialId) => {
    if (typeof initialId === "number") {
      set({ items: [initialId], index: 0 });
    } else {
      set({ items: [], index: -1 });
    }
  },
}));
