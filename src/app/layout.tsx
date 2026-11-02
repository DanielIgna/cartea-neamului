import type { Metadata } from "next";
import Link from "next/link";
// Fonturile vin din pachete npm (fără descărcare de la Google la build, care pica intermitent pe Vercel).
import "@fontsource/alegreya/500.css";
import "@fontsource/alegreya/700.css";
import "@fontsource/alegreya-sans/400.css";
import "@fontsource/alegreya-sans/500.css";
import "@fontsource/alegreya-sans/700.css";
import "./globals.css";
import { currentUser } from "@/lib/access";
import UserMenu from "@/components/UserMenu";
import ThemeSwitch from "@/components/ThemeSwitch";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import { cookies } from "next/headers";


export const metadata: Metadata = { title: "Cartea Neamului", description: "Arborele familiei, construit împreună, tipărit ca o carte." };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await currentUser();
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang="ro" data-theme={theme === "auto" ? undefined : theme}>
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
