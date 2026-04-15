import React from 'react';

export const metadata = {
  title: 'Pauli Cinema Studio',
  description: 'AI-powered video generation platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
