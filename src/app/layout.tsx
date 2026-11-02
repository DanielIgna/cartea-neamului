import type { Metadata } from "next";
import Link from "next/link";
import { Alegreya, Alegreya_Sans } from "next/font/google";
import "./globals.css";
import { currentUser } from "@/lib/access";
import UserMenu from "@/components/UserMenu";
import ThemeSwitch from "@/components/ThemeSwitch";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import { cookies } from "next/headers";

const display = Alegreya({ subsets: ["latin", "latin-ext"], weight: ["500", "700"], variable: "--font-display" });
const body = Alegreya_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "700"], variable: "--font-body" });

export const metadata: Metadata = { title: "Cartea Neamului", description: "Arborele familiei, construit împreună, tipărit ca o carte." };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await currentUser();
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang="ro" className={`${display.variable} ${body.variable}`} data-theme={theme === "auto" ? undefined : theme}>
      <body>
        <div className="wrap">
          <header className="top">
            <div className="brand"><Link href="/" style={{ textDecoration: "none", color: "inherit" }}><h1>Cartea Neamului</h1></Link></div>
            <ThemeSwitch initial={theme} />
            {me && <UserMenu name={me.name} />}
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
