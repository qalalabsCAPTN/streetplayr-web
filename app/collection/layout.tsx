import { Space_Mono } from "next/font/google";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export default function CollectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={spaceMono.variable}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />
      <style>{`
        .material-symbols-outlined {
          font-family: "Material Symbols Outlined";
          font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 48;
        }
        .glow-sm:hover {
          text-shadow: none;
        }
        .product-card:hover .alt-face {
          opacity: 1;
        }
      `}</style>
      {children}
    </div>
  );
}
