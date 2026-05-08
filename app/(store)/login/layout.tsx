import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Street PlayR',
  description: 'Sign in to your Street PlayR membership.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Intentionally no Navbar/Footer — auth is a standalone cinematic experience
  return <>{children}</>;
}
