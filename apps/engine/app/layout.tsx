import React from 'react';

export const metadata = {
  title: 'Pauli Creator Engine',
  description: 'Create and manage your Pauli Universe content',
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
