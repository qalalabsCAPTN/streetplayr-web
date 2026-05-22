import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Member Access | StreetPlayR',
  description: 'Restricted access terminal.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Intentionally no Navbar/Footer — auth is a standalone cinematic experience
  return <>{children}</>;
}
