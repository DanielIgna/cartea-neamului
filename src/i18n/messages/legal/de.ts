import type { LegalCatalog } from "./ro";

export const deLegal: LegalCatalog = {
  Legal: {
    updated: "Zuletzt geändert: {date}",
    contactTitle: "Kontakt",
    contactLine: "{name}{person, select, yes {, Privatperson} other {}}. E-Mail: <mail>{email}</mail>.",
    Privacy: {
      metaTitle: "Datenschutzerklärung",
      metaDescription: "Welche Daten wir speichern, warum, wer sie sieht und wie du sie herunterlädst oder löschst.",
      label: "Datenschutzerklärung",
      title: "Wie wir mit den Daten deiner Familie umgehen",
      sections: {
        intro: {
          p1: "Das Familienbuch ist ein Ort, an dem Familien gemeinsam ihren Stammbaum aufbauen, ihre Erinnerungen bewahren und ihr Familienbuch drucken. Hier steht, kurz und ohne schwierige Worte, welche Daten wir speichern, warum, wer sie sieht und wie du sie herunterlädst oder löschst. Kurz gesagt: Stammbäume sind privat, du entscheidest, wer deine Erinnerungen sieht, wir verkaufen nichts und zeigen keine Werbung. Unser Partner PropManage erhält nur deine E-Mail-Adresse, und nur wenn du das ankreuzt.",
        },
        controller: {
          h: "Wer für die Daten verantwortlich ist",
          p1: "Verantwortlicher für die Daten im Familienbuch im Sinne der Datenschutz-Grundverordnung (Verordnung (EU) 2016/679, „DSGVO“) ist <b>{name}</b>{person, select, yes {, Privatperson} other {}}. Bei jeder Frage oder Bitte zu deinen Daten schreibst du uns an <mail>{email}</mail>.",
          beta: "Das Familienbuch wird gerade erprobt: Nur Familie und enge Freunde nutzen es, um uns zu sagen, was funktioniert und was nicht. Auch in dieser Zeit werden eure Daten so gespeichert und geschützt, wie es hier steht.",
        },
        data: {
          h: "Welche Daten wir speichern",
          l1: "<b>Dein Konto:</b> Name, E-Mail-Adresse und Passwort (nur als verschlüsselter Fingerabdruck gespeichert, den auch wir nicht lesen können). Wenn du dich mit Google anmeldest, die Kennung des Google-Kontos und sein Profilbild. Zur Sicherheit deines Kontos die Sitzungen, in denen du angemeldet bist, mit IP-Adresse und Art des Browsers.",
          l2: "<b>Die Stammbäume:</b> was du und deine Verwandten über Menschen schreiben: Namen, Daten und Orte von Geburt und Tod, wo die Lebenden wohnen, Beruf, Lebenslauf, Notizen, Fotos, eingescannte Dokumente und Verwandtschaftsbeziehungen. Wir merken uns auch, wer welche Änderung gemacht hat, damit sich Fehler korrigieren lassen.",
          l3: "<b>Die Erinnerungstruhe und die Autobiografie:</b> geschriebene oder mit der Stimme erzählte Erinnerungen (Tonaufnahmen), ihre Fotos, Fragen von Verwandten und die Antworten. Wenn ein Verwandter „bei den Großeltern“ die Geschichten von jemandem ohne Konto aufnimmt, speichern wir auch dessen Einwilligung, manchmal mit seiner Stimme.",
          l4: "<b>Der Glaube:</b> Was du im Kapitel „Glaube“ schreibst, zeigt deine religiösen Überzeugungen. Das Gesetz zählt sie zu einer besonderen Kategorie von Daten (Art. 9 DSGVO), darum speichern wir sie nur mit deiner ausdrücklichen Einwilligung, um die wir dich genau dort vor der ersten Antwort bitten.",
          l5: "<b>Die Nachrichten</b>, die Verwandte einander schreiben.",
          l6: "<b>„Bist du schon in einem Stammbaum?“:</b> Name und Geburtsdatum, die du eingibst, um deinen Eintrag zu finden. Nach der Suche behalten wir nur den gesuchten Familiennamen und ob etwas gefunden wurde, um die Suchen zu begrenzen (so kann niemand das Geburtsdatum eines anderen erraten, indem er Tag für Tag probiert).",
          l7: "<b>„Aus denselben Orten“:</b> nur wenn der Eigentümer des Stammbaums es einschaltet, die Dörfer der verstorbenen Vorfahren, ihre Familiennamen und die Jahre, damit andere Familien mit Wurzeln in denselben Dörfern ihre Verwandten finden. Wir speichern auch die Kontaktanfragen und die Antworten darauf.",
          l8: "<b>Wie viel du die Seite nutzt</b>, nur wenn du auf die Frage, die wir dir ein einziges Mal stellen, „Gut“ sagst: pro Tag, wie lange du in jedem Teil der Seite warst (zum Beispiel „Stammbaum · Baum“ oder „Familienkarte“), wie oft du ihn geöffnet hast und wie viel davon am Handy oder in der App auf dem Handy war. Wir zählen nur die Zeit, in der die Seite im Vordergrund ist und du darin etwas tust. Wir speichern nicht die Adresse der Seite, was du schreibst oder worauf du klickst.",
          l9: "<b>Vorteile von Partnern</b>, nur wenn du das ankreuzt (beim Erstellen des Kontos oder unter „Meine Daten“): jedes „Ja“ und jedes „Nein“, mit Datum, Version des angekreuzten Textes, Sprache und dem Ort, an dem du gewählt hast.",
          l10: "<b>Das alte Familienhaus:</b> was du auf der Seite einer Person über das Haus der Familie schreibst (Adresse oder Dorf, wer es gebaut hat, das Jahr, Fotos und seine Geschichte). Es sieht nur, wen du auswählst, wie bei den Erinnerungen.",
          l11: "<b>In deinem Browser:</b> das gewählte Design (hell oder dunkel), die Familienlinien, die du sehen willst, und ob du die Partnerkarte nach dem Herunterladen des Buches schon gesehen hast. Wenn du der Zeitmessung zugestimmt hast, auch die zuletzt gezählte Minute, höchstens eine Stunde, damit sie uns auch erreicht, wenn du die Seite eilig schließt.",
          l12: "<b>Die technischen Protokolle</b> des Servers (IP-Adresse, aufgerufene Seite, Uhrzeit), kurz aufbewahrt, damit wir Fehler beheben können.",
        },
        why: {
          h: "Warum und auf welcher Rechtsgrundlage",
          l1: "Damit funktioniert, worum du uns bittest: das Konto, die Stammbäume, die Erinnerungstruhe, die Nachrichten und das Buch. Rechtsgrundlage ist der Vertrag zwischen uns, also diese <terms>Nutzungsbedingungen</terms> (Art. 6 Abs. 1 lit. b DSGVO).",
          l2: "Um Konten und Stammbäume zu schützen: die Sitzungen, das Änderungsprotokoll und die Begrenzung der Suchen. Rechtsgrundlage ist unser berechtigtes Interesse, die Seite sicher zu halten (Art. 6 Abs. 1 lit. f).",
          l3: "Um zu sehen, was die Menschen nutzen und was besser werden muss: die Zahlen zu Konten und Stammbäumen im Verwaltungsbereich, ohne das, was ihr schreibt. Rechtsgrundlage ist unser berechtigtes Interesse, die Seite zu verbessern (Art. 6 Abs. 1 lit. f).",
          l4: "Für die lebenden Verwandten, die du in den Stammbaum einträgst, ist die Rechtsgrundlage das berechtigte Interesse der Familie, ihre Geschichte zu bewahren, mit Sorgfalt: Stammbäume sind privat, und Lebende sind nur in ihrem eigenen Stammbaum sichtbar, nie bei anderen Familien. Wer in einem Stammbaum eingetragen ist, kann verlangen, dass wir seine Daten berichtigen oder löschen.",
          l5: "Auf Grundlage deiner Einwilligung, die du jederzeit widerrufen kannst: das Kapitel „Glaube“ (Art. 9 Abs. 2 lit. a), die „bei den Großeltern“ aufgenommenen Geschichten, „Aus denselben Orten“, wie viel du die Seite nutzt und die Vorteile von Partnern (Art. 6 Abs. 1 lit. a). Der Widerruf ändert nichts an dem, was vorher mit der erteilten Einwilligung geschehen ist.",
        },
        who: {
          h: "Wer die Daten sieht",
          l1: "<b>Stammbäume sind privat.</b> Sie sehen nur die Mitglieder, die der Eigentümer einlädt oder nach einer Anfrage aufnimmt. Jeder hat eine Rolle: Der Besucher sieht nur, der Mitwirkende fügt hinzu, der Bearbeiter korrigiert, der Eigentümer entscheidet, wer hereinkommt.",
          l2: "<b>Lebende</b> sind nur in ihrem eigenen Stammbaum sichtbar. Sie erscheinen nicht unter „Aus denselben Orten“ und auch nicht bei anderen Familien. Der Einzige, der seinen Eintrag von außerhalb des Stammbaums finden kann, ist der Mensch selbst, mit seinem Namen und seinem vollständigen Geburtsdatum; dann entscheidet der Eigentümer des Stammbaums, ob er ihn aufnimmt, und bis dahin erfährt der Suchende nicht einmal, um welchen Stammbaum es geht.",
          l3: "<b>Erinnerungen</b> sieht nur, wen der Schreibende auswählt: nur er selbst (Entwurf), der, der gefragt hat, die nahe Familie bis zu einem bestimmten Verwandtschaftsgrad oder der ganze Stammbaum. Ins Familienbuch kommen nur die, die für das Buch angekreuzt sind.",
          l4: "<b>Nachrichten</b> sehen nur die beiden, die sie einander schreiben.",
          l5: "<b>Wir</b> sehen im Verwaltungsbereich nur Listen und Zahlen: die Konten (Name, E-Mail, wann und mit welcher Art von Gerät sie sich angemeldet haben), die Stammbäume (Name, wie viele Personen und Dateien sie haben), bei jedem Konto, wie viel es hinzugefügt hat (wie viele Personen, Erinnerungen, Fotos, Einladungen und Nachrichten), und bei denen, die „Gut“ gesagt haben, wie lange sie in jedem Teil der Seite sind. Dort können wir auch eine kurze Notiz zum Konto führen, zum Beispiel, dass es kostenlos bleibt. Erinnerungen und Nachrichten lesen wir nicht, und aus dem Kapitel „Glaube“ zählen wir nichts; wir sehen sie uns nur an, wenn du uns um Hilfe bittest oder das Gesetz uns dazu verpflichtet.",
          l6: "Wir verkaufen keine Daten, zeigen keine Werbung und geben sie niemandem sonst, außer den Dienstleistern unten, unserem Partner PropManage (nur die E-Mail-Adresse derer, die es angekreuzt haben, wie unten beschrieben) und Behörden, wenn das Gesetz uns dazu verpflichtet.",
        },
        vendors: {
          h: "Die Dienstleister, die uns helfen",
          p1: "Wir arbeiten mit einigen Dienstleistern, die die Daten nur verarbeiten, damit die Seite funktioniert, nach Verträgen, die sie verpflichten, sie zu schützen:",
          l1: "<b>Vercel Inc.</b> (USA) hostet die Seite und betreibt die Anwendung.",
          l2: "<b>Neon</b> (Databricks Inc., USA) speichert die Datenbank, die Fotos, Dokumente und Aufnahmen, in einem Rechenzentrum in Frankfurt (Deutschland, EU).",
          l3: "<b>Google</b> bestätigt deine Identität bei der Anmeldung, nur wenn du „Mit Google fortfahren“ wählst.",
          l4: "<b>OpenStreetMap</b> (OpenStreetMap Foundation, Vereinigtes Königreich) liefert die Kartenteile der „Familienkarte“. Dein Browser fordert sie direkt bei ihnen an, darum sehen sie die IP-Adresse, von der aus du sie anforderst.",
          p2: "Für Übermittlungen außerhalb der Europäischen Union nutzen diese Dienstleister die von der Europäischen Kommission genehmigten Standardvertragsklauseln oder den EU-US-Datenschutzrahmen. Über Lebende senden wir nichts an Dienste der künstlichen Intelligenz.",
        },
        partner: {
          h: "Unser Partner PropManage",
          p1: "PropManage (<pm>propmanage.ro</pm>) ist eine Plattform für Wohnungs- und Hauseigentümer und ein Partner des Familienbuchs. Du findest ihn nur auf der Seite <partners>Partner</partners>; im Stammbaum, in den Erinnerungen, in der Zeitleiste, auf der Karte und im Buch gibt es keine Werbung.",
          l1: "<b>Was er erhält:</b> nur deine E-Mail-Adresse, und nur, wenn du „{consent}“ angekreuzt hast. Das Kästchen ist getrennt, nicht von selbst angekreuzt, und nichts auf der Seite hängt davon ab. PropManage erhält nie etwas über deinen Stammbaum, die Menschen darin, die Verwandten, die du eingeladen hast, Dörfer, Erinnerungen, Fotos oder Stimme. Eingeladene Verwandte und die Menschen im Stammbaum erhalten nie Nachrichten von PropManage.",
          l2: "<b>Rechtsgrundlage:</b> deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Ab dem Moment, in dem PropManage die Adresse erhält, ist es als eigener Verantwortlicher nach seiner eigenen Datenschutzerklärung für sie verantwortlich und nutzt sie nur, um dir ab und zu Vorteile für dein Zuhause zu schicken.",
          l3: "<b>Wie lange:</b> solange deine Einwilligung besteht. Die Liste, die PropManage erhält, stellen wir jedes Mal neu aus den aktuellen Einwilligungen zusammen, sodass deine Adresse nach dem Widerruf nicht mehr dorthin gelangt. Wir bitten PropManage, deine Adresse zu löschen, sobald es erfährt, dass du deine Einwilligung widerrufen hast.",
          l4: "<b>Wie du sie widerrufst:</b> mit einem Klick unter <dataPartners>Meine Daten</dataPartners> (der Schalter „Vorteile von Partnern“) oder über den Abmeldelink in jeder erhaltenen E-Mail, ohne dich anzumelden. Der Widerruf ändert nichts an deinem Konto oder deinem Stammbaum.",
          l5: "Die Links zu PropManage auf der Seite (auf der Partnerseite, neben dem alten Familienhaus und nach dem Herunterladen des Buches) sind einfache Links: Sie zeigen nur, dass du vom Familienbuch kommst, ohne irgendwelche Daten über dich.",
        },
        keep: {
          h: "Wie lange wir die Daten speichern",
          p1: "Solange du ein Konto hast. Was du löschst, verschwindet sofort von der Seite, und die Sicherungskopien der Datenbank überschreiben sich spätestens nach 30 Tagen von selbst. Wenn du dein Konto löschst, geht alles, was dir gehört: das Konto, die Erinnerungen aus deiner Truhe, die Nachrichten, was du anderen geschrieben hast, und die Einwilligungen. Die Stammbäume bleiben der Familie: Ein Stammbaum mit anderen Mitgliedern geht an einen von ihnen über, und einer, in dem du allein bist, wird ganz gelöscht. Dein Eintrag in den Stammbäumen bleibt, damit der Stammbaum nicht zerreißt, ohne Verbindung zum Konto; wenn du willst, wird er auch von deinen Daten geleert. Wie viel du die Seite nutzt, speichern wir höchstens 13 Monate; wenn du „Ich will nicht mehr“ sagst, wird es sofort gelöscht.",
        },
        rights: {
          h: "Deine Rechte",
          p1: "Du kannst erfahren, welche Daten wir über dich haben, sie berichtigen, löschen, mitnehmen, verlangen, dass wir sie nicht mehr auf eine bestimmte Weise nutzen, und deine Einwilligung jederzeit widerrufen. Vieles erledigst du selbst auf der Seite <data>Meine Daten</data>: Du lädst alles herunter, was zu deinem Konto gehört, widerrufst deine Einwilligung für den „Glauben“ oder für die Vorteile von Partnern, stoppst die Messung der Zeit auf der Seite oder löschst dein Konto. Für alles andere schreibst du uns an <mail>{email}</mail>; wir antworten innerhalb von höchstens einem Monat.",
          p2: "Wenn du meinst, dass wir deine Rechte nicht beachtet haben, kannst du dich bei der Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP), B-dul G-ral. Gheorghe Magheru nr. 28-30, sector 1, București, <anspdcp>www.dataprotection.ro</anspdcp>, beschweren.",
        },
        kids: {
          h: "Kinder, die Lebenden und die, die nicht mehr sind",
          l1: "Das Konto ist für Menschen ab {minAge} Jahren. Kinder können von ihren Eltern in den Stammbaum eingetragen werden.",
          l2: "Wer als lebend in einem Stammbaum eingetragen ist, kann den Eigentümer des Stammbaums oder uns bitten, seine Daten zu berichtigen, zu verbergen oder zu löschen.",
          l3: "Das Datenschutzrecht gilt nicht für die, die nicht mehr leben, aber ihr Andenken bewahren wir mit demselben Respekt.",
        },
        cookies: {
          h: "Cookies",
          p1: "Wir verwenden nur die Cookies, ohne die die Seite nicht funktionieren würde, darum bitten wir dafür nicht um deine Einwilligung:",
          l1: "das, das dich im Konto angemeldet hält;",
          l2: "<code>limba</code>, mit der Sprache, in der du die Seite auf diesem Handy oder Computer lesen willst (zum Beispiel „ro“ oder „de“), ein Jahr lang gespeichert;",
          l3: "das mit dem gewählten Design (hell oder dunkel);",
          l4: "<code>cn-parteneri</code>, nur wenn du beim Erstellen des Kontos die Vorteile von Partnern ankreuzt: Es merkt sich das Häkchen höchstens 30 Minuten, gerade so lange, bis deine Wahl beim neuen Konto ankommt (auch wenn du es mit Google erstellst), und verschwindet dann.",
          p2: "Wir verwenden keine Werbe-Cookies und keine Cookies zum Zählen von Besuchen.",
        },
        safety: {
          h: "Sicherheit",
          p1: "Die Verbindung zur Seite ist verschlüsselt, Passwörter speichern wir nur als Fingerabdruck, und Fotos, Dokumente und Aufnahmen liegen an einem privaten Ort: Sie öffnen sich nur über Links, die nach wenigen Minuten ablaufen, nachdem wir geprüft haben, dass du sie sehen darfst.",
        },
        changes: {
          h: "Änderungen",
          p1: "Wenn wir etwas Wichtiges daran ändern, was wir speichern oder wem wir es zeigen, sagen wir es dir auf der Seite, bevor die Änderung gilt.",
        },
      },
    },
    Terms: {
      metaTitle: "Nutzungsbedingungen",
      metaDescription: "Was es heißt, ein Konto beim Familienbuch zu haben: was du hinzufügen kannst, wem es gehört und was wir versprechen.",
      label: "Nutzungsbedingungen",
      title: "Was es heißt, ein Konto beim Familienbuch zu haben",
      sections: {
        intro: {
          p1: "Das Familienbuch ist ein Ort, an dem Familien gemeinsam ihren Stammbaum aufbauen, ihre Erinnerungen bewahren und ihr Familienbuch drucken. Wenn du ein Konto erstellst, stimmst du diesen Bedingungen und der <privacy>Datenschutzerklärung</privacy> zu.",
          beta: "Das Familienbuch wird gerade erprobt: Es ist nur für Familie und enge Freunde offen, damit sie uns sagen, was funktioniert und was nicht. Es kann sich oft ändern und manchmal Fehler machen, darum bewahre dir auch selbst eine Kopie dessen auf, was dir wichtig ist: Du lädst sie jederzeit unter „Meine Daten“ herunter.",
        },
        account: {
          h: "1. Das Konto",
          l1: "Das Konto ist für Menschen ab {minAge} Jahren. Kinder können von ihren Eltern in den Stammbaum eingetragen werden.",
          l2: "Ein Konto gehört einem einzigen Menschen. Dein Passwort behältst du für dich; was von deinem Konto aus geschieht, liegt in deiner Verantwortung.",
          l3: "Das Probekonto hat ein öffentliches Passwort, gehört also allen: Trage darin nichts aus deiner Familie ein.",
        },
        content: {
          h: "2. Was du auf die Seite stellst",
          l1: "Du stellst nur ein, wozu du berechtigt bist: Fotos und Dokumente der Familie, Texte, die du selbst geschrieben hast, Aufnahmen, die mit Einwilligung der sprechenden Person gemacht wurden.",
          l2: "Über lebende Verwandte schreibst du mit Sorgfalt und Anstand. Wenn dich jemand bittet, seine Daten aus dem Stammbaum zu entfernen, entfernst du sie oder schreibst uns.",
          l3: "Du stellst nichts Rechtswidriges, Beleidigendes oder zu Hass Aufstachelndes ein, auch keine Daten anderer ohne Berechtigung.",
          l4: "Wir können verbergen oder löschen, was gegen diese Bedingungen oder das Gesetz verstößt, und sagen dir, warum.",
        },
        owner: {
          h: "3. Wem gehört, was du einstellst",
          p1: "Was du einstellst, bleibt deins und das deiner Familie. Uns gibst du nur die Erlaubnis, es zu speichern, es denen zu zeigen, die du ausgewählt hast, und es in das Buch zu setzen, das du bestellst, damit die Seite funktioniert. Wir nutzen es zu keinem anderen Zweck und verkaufen es nicht.",
        },
        trees: {
          h: "4. Stammbäume und Erinnerungen",
          l1: "Der Eigentümer des Stammbaums entscheidet, wer hereinkommt und welche Rechte er hat: Der Besucher sieht nur, der Mitwirkende fügt hinzu, der Bearbeiter korrigiert die Einträge.",
          l2: "Eine Erinnerung gehört dem, der sie schreibt: Nur er wählt, wer sie sieht, und nur er ändert oder löscht sie.",
          l3: "Das Kapitel „Glaube“ der Autobiografie ist nur für Lebende, die selbst antworten, mit ihrer Einwilligung.",
        },
        price: {
          h: "5. Der Preis",
          p1: "Im Moment ist alles kostenlos. Falls wir je ein Abonnement verlangen, für große Stammbäume oder für neue Funktionen, sagen wir es dir rechtzeitig. Was du eingestellt hast, bleibt deins, und das Ansehen des Stammbaums, die Einladungen und sein Herunterladen (GEDCOM) bleiben kostenlos.",
        },
        reliability: {
          h: "6. Wie zuverlässig die Seite läuft",
          p1: "Wir bemühen uns, dass die Seite gut läuft und nichts verloren geht, aber wir können nicht versprechen, dass es nie Unterbrechungen oder Fehler gibt. Bewahre auch selbst eine Kopie auf: den Stammbaum als GEDCOM, das Buch als PDF und deine Daten aus <data>Meine Daten</data>.",
        },
        end: {
          h: "7. Beendigung",
          p1: "Du kannst dein Konto jederzeit unter <data>Meine Daten</data> löschen. Wir können ein Konto sperren, das schwer gegen diese Bedingungen verstößt, nachdem wir dem Menschen geschrieben und ihm gesagt haben, warum.",
        },
        liability: {
          h: "8. Haftung",
          p1: "Im gesetzlich zulässigen Rahmen haften wir nicht für mittelbare Schäden aus der Nutzung der Seite. Nichts in diesen Bedingungen nimmt dir die Rechte, die dir das Gesetz als Verbraucher gibt.",
        },
        law: {
          h: "9. Anwendbares Recht",
          p1: "Für diese Bedingungen gilt rumänisches Recht. Eine Meinungsverschiedenheit versuchen wir zuerst gütlich zu klären; wenn das nicht geht, entscheiden die Gerichte in Rumänien.",
        },
        changes: {
          h: "10. Änderungen",
          p1: "Wenn wir an diesen Bedingungen etwas Wichtiges ändern, sagen wir es dir auf der Seite, bevor die Änderung gilt.",
        },
      },
    },
  },
};
