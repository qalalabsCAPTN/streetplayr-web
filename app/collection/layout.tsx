import { Space_Mono, Archivo_Black } from "next/font/google";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo-black",
  display: "swap",
});

export default function CollectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${spaceMono.variable} ${archivoBlack.variable}`}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />
      <style>{`
        .material-symbols-outlined {
          font-family: "Material Symbols Outlined";
          font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 48;
        }
        .scanlines {
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.03) 50%,
            rgba(0, 0, 0, 0.03) 50%
          );
          background-size: 100% 4px;
          pointer-events: none;
        }
        .glow-sm:hover {
          text-shadow: 0 0 10px rgba(221, 183, 255, 0.8);
        }
        .product-card:hover .alt-face {
          opacity: 1;
        }
      `}</style>
      {children}
    </div>
  );
}
