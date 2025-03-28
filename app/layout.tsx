import '@mantine/core/styles.css';
import React from 'react';
import { MantineProvider, ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import { theme } from '../theme';
import CustomAppShell from './_components/AppShell';
import '@mantine/notifications/styles.css';

export const metadata = {
  title: 'FC Barca',
  description: 'Społeczność fanów FC Barcelona',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no" />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <CustomAppShell>{children}</CustomAppShell>
        </MantineProvider>
      </body>
    </html>
  );
}