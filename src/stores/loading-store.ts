import { create } from "zustand";

interface LoadingState {
  visible: boolean;
  title: string;
  description: string;
  showLoading: (title?: string, description?: string) => void;
  hideLoading: () => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  visible: false,
  title: "加载中",
  description: "",
  showLoading: (title = "加载中", description = "") =>
    set({ visible: true, title, description }),
  hideLoading: () =>
    set({ visible: false, title: "加载中", description: "" }),
}));
