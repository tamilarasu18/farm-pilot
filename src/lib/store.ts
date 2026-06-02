import { create } from "zustand";

interface GlobalState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeDrawingTool: "polygon" | "marker" | null;
  setActiveDrawingTool: (tool: "polygon" | "marker" | null) => void;
}

export const useStore = create<GlobalState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  activeDrawingTool: null,
  setActiveDrawingTool: (tool) => set({ activeDrawingTool: tool }),
}));
