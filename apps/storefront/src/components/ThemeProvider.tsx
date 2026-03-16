'use client';
import { useEffect, useState } from 'react';
import { gql, DEFAULT_DISPENSARY_ID } from '@/lib/graphql';

const THEME_Q = `query($id: ID!) { dispensaryTheme(dispensaryId: $id) { themeCode customCss logoUrl brandName } }`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    gql<any>(THEME_Q, { id: DEFAULT_DISPENSARY_ID })
      .then(data => {
        const t = data.dispensaryTheme;
        if (t) {
          document.documentElement.setAttribute('data-theme', t.themeCode || 'default');
          if (t.customCss) {
            let style = document.getElementById('custom-theme-css');
            if (!style) { style = document.createElement('style'); style.id = 'custom-theme-css'; document.head.appendChild(style); }
            style.textContent = t.customCss;
          }
        }
      })
      .catch(() => { document.documentElement.setAttribute('data-theme', 'default'); });
  }, []);
  return <>{children}</>;
}
