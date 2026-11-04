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
import { db } from "@/db";
import { unreadCount } from "@/lib/chat";
import { pendingContacts } from "@/lib/shared-places";
import { pendingJoins } from "@/lib/join";
import ThemeSwitch from "@/components/ThemeSwitch";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import { cookies } from "next/headers";
import { and, eq, isNotNull } from "drizzle-orm";
import { person } from "@/db/schema";
import { safeAccountImage } from "@/lib/tree-data";
import { isAdminEmail } from "@/lib/admin";


export const metadata: Metadata = { title: "Cartea Neamului", description: "Arborele familiei, construit împreună, tipărit ca o carte." };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await currentUser();
  // Pe „Mesaje”: mesajele necitite plus cererile care îmi așteaptă răspunsul („Din aceleași locuri” și intrări în arbore).
  const unread = me ? (await Promise.all([unreadCount(db, me.id), pendingContacts(db, me.id), pendingJoins(db, me.id)].map((p) => p.catch(() => 0)))).reduce((a, b) => a + b, 0) : 0;
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  // Poza de lângă nume: cea pusă pe fișa ta din arbore; altfel poza din contul Google; altfel inițialele.
  const myPhoto = me
    ? await db.select({ photo: person.photoDocumentId }).from(person).where(and(eq(person.claimedByUserId, me.id), isNotNull(person.photoDocumentId))).limit(1)
        .then((r) => r[0]?.photo ?? null).catch(() => null)
    : null;
  const avatar = myPhoto ? `/api/document/${myPhoto}` : safeAccountImage(me?.image);
  return (
    <html lang="ro" data-theme={theme === "auto" ? undefined : theme}>
      <body>
        <div className="wrap">
          <header className="top">
            <div className="brand"><Link href="/" style={{ textDecoration: "none", color: "inherit" }}><h1>Cartea Neamului</h1></Link></div>
            <ThemeSwitch initial={theme} />
            {me && <UserMenu name={me.name} unread={unread} image={avatar} admin={isAdminEmail(me.email)} />}
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
