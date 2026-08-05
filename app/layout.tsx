import type { Metadata } from "next";
import { Bitter, Manrope } from "next/font/google";
import "./globals.css";

// Fraunces (the original pick) has no Cyrillic glyphs — Bitter keeps the same
// warm slab-serif character and weight/italic range while rendering Russian
// headlines with the real webfont instead of a silent system-font fallback.
const bitter = Bitter({
  variable: "--font-serif",
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Adana Pizza — пиццерия на Боровском шоссе",
  description:
    "Adana Pizza — пиццерия в Москве. Пицца на тонком тесте, наборы и салаты с доставкой и самовывозом. Всё лучшее для вас.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${bitter.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-flatbread text-char">{children}</body>
    </html>
  );
}
