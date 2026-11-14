import { Inter, Poppins, Space_Grotesk, Playfair_Display } from "next/font/google";

// Server-only font loaders. The selectable list + css lives in ./font-options
// (plain data, safe to import in client components and the public pages).
export const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
export const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-poppins", display: "swap" });
export const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });
export const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

/** Space-joined class list to put on <html> so the font variables exist. */
export const fontVars = `${inter.variable} ${poppins.variable} ${grotesk.variable} ${playfair.variable}`;
