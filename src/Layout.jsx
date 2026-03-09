import React from 'react';

export default function Layout({ children }) {
  return (
    <div>
      <style>{`
        .pb-safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
        .pt-safe-top { padding-top: env(safe-area-inset-top); }
        * { -webkit-tap-highlight-color: transparent; }
        body { overscroll-behavior: none; }
      `}</style>
      {children}
    </div>
  );
}