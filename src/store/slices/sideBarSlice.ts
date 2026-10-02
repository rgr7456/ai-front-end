import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SideBarState {
  isOpen: boolean;
  activeItem: string | null;
}

const initialState: SideBarState = {
  isOpen: false,
  activeItem: null,
};

const sideBarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isOpen = !state.isOpen;
    },
    openSidebar: (state) => {
      state.isOpen = true;
    },
    closeSidebar: (state) => {
      state.isOpen = false;
    },
    setActiveItem: (state, action: PayloadAction<string>) => {
      state.activeItem = action.payload;
    },
  },
});

export const { toggleSidebar, openSidebar, closeSidebar, setActiveItem } = sideBarSlice.actions;
export default sideBarSlice.reducer;