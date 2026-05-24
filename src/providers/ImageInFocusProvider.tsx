'use client'

import { createContext, useContext, useState, ReactNode } from 'react';

type ImageInFocusContextType = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  image: string;
  setImage: React.Dispatch<React.SetStateAction<string>>;
};

const ImageInFocusContext = createContext<ImageInFocusContextType | null>(null);

export const ImageInFocusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [image, setImage] = useState<string>('');

  return (
    <ImageInFocusContext.Provider value={{
      open,
      setOpen,
      image,
      setImage,
    }}>
      {children}
    </ImageInFocusContext.Provider>
  );
};

export const useImageInFocus = () => {
  const context = useContext(ImageInFocusContext);
  if (!context) {
    throw new Error('useImageInFocus must be used within a ImageInFocusProvider');
  }
  return context;
};