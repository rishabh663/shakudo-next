import './globals.css';

export const metadata = {
  title: 'Shakudo · The OS for AI',
  description: 'Pick your stack. We build the rest.',
  icons: { icon: '/assets/logo-mark-copper.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
