import React from 'react';

export const metadata = {
  title: 'Bigsaws Podcast',
  description: 'The Pauli Universe podcast exploring quantum mechanics and storytelling',
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
