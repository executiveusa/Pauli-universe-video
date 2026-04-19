import React from 'react';

export const metadata = {
  title: "Where's Pauli?",
  description: 'The ultimate hiding game with AI-generated content',
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
