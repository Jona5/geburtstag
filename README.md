# Detektiv-Spiel

Eine ganz einfache statische Webseite (kein Server, kein Build-Schritt) für
ein Detektiv-/Rätselspiel: Spieler geben einen Code beliebiger Länge ein, den
sie irgendwo gefunden haben, und bekommen dazu die Lösung (Überschrift, Text,
optional Bild und Sprachnachricht) angezeigt.

Alle Codes und ihre Texte werden im `localStorage` des Browsers gespeichert,
in dem sie über die Konfigurationsseite angelegt wurden. Das Spiel ist daher
für den Einsatz auf **einem gemeinsamen Gerät** gedacht (Tablet/Handy/Laptop,
das für alle Spieler benutzt wird) – öffnet jemand die Seite auf einem
anderen Gerät, sieht er die dort angelegten Codes nicht.

## Features

- **Landing Page** (`landing.html`) als Ziel für einen QR-Code: eigene
  Begrüßungsseite mit konfigurierbarer Überschrift, Text und optional Bild,
  plus „Los geht's“-Button weiter zum Spiel (`index.html`).
- **Rätsel müssen der Reihe nach gelöst werden**: Ein Code wird nur
  akzeptiert, wenn das vorherige Rätsel bereits gelöst wurde (Fortschritt
  wird im Browser gespeichert). Sobald das Finale erreicht ist, setzt sich
  der Fortschritt automatisch zurück, damit die nächste Gruppe am selben
  Gerät wieder bei Rätsel 1 beginnt. Manuell zurücksetzen geht in
  `config.html` über „🔄 Spielfortschritt zurücksetzen“.
- **Konfiguration als Assistent, analog zum Spielablauf**: Seite 1 ist die
  Landing Page, Seite 2 die Willkommens-Seite (Texte + Darstellung), jede
  weitere Seite ist genau ein Rätsel (Code + Lösung), die letzte Seite ist
  eine dedizierte **Finale-Seite** (eigene Überschrift, Text und Bild) –
  wird automatisch zusätzlich angezeigt, wenn der Code des letzten Rätsels
  gelöst wird. Navigation per Zurück/Weiter oder über die Seiten-Punkte oben.
- Jeder Rätsel-Schritt kann zusätzlich ein **Bild** enthalten (z. B. für eine
  finale Abschluss-Seite mit Überschrift, Text und Bild) – wird beim
  Hochladen automatisch verkleinert/komprimiert, damit localStorage nicht
  überläuft.
- Codes dürfen **beliebige Zeichen und beliebige Länge** haben (kein festes
  Format, jedes Rätsel kann einen anders langen Code haben) → hinterlegte
  **Überschrift + Beschreibung des nächsten Rätsels** (und optional eine im
  Browser aufgenommene Sprachnachricht). Codes werden beim Eingeben/Anlegen
  automatisch in Großbuchstaben umgewandelt, damit Groß-/Kleinschreibung
  beim Tippen keine Rolle spielt. Da die Länge nicht mehr feststeht, wird
  ein Code im Spiel per Enter oder „Prüfen“-Button bestätigt (kein
  automatisches Absenden mehr).
- Konfigurierbare Texte der Rätsel-Seite (Titel, Untertitel, Meldung bei
  falschem Code)
- 5 auswählbare Farb-Themes (Film Noir, Neon Cyber, Pergament, Blutrot,
  Waldgrün)
- 10 auswählbare Hintergrundbilder: 5 Vintage-Detektiv-Motive (Korkbrett,
  altes Papier, neblige Stadt, Blaupause, Tatort-Absperrband) und 5 moderne
  Gradient-/Glow-Hintergründe (Aurora, Dusk, Punktraster, Glow Orbs, Wellen)
  – alles als SVGs im Repo, keine externen Bilder
- 6 auswählbare Töne für falsche Codes, 6 für richtige Codes – synthetisch
  per Web Audio API erzeugt (gefilterte Sinus-/Dreieckstöne statt roher
  8-Bit-Wellen, damit es moderner klingt), keine Audio-Dateien nötig
- Auf der Ergebnisseite lässt sich eine Sprachnachricht per Button erneut
  abspielen (Erfolgston läuft nur, wenn keine Sprachnachricht hinterlegt ist)
- Sprachnachrichten: pro Code kann in `config.html` direkt über das
  Mikrofon eine Nachricht aufgenommen werden, die beim richtigen Code
  automatisch abgespielt wird
- Für Mobilgeräte optimiert (große Touch-Ziele, kein iOS-Auto-Zoom bei
  Eingabefeldern, Safe-Area-Unterstützung für Geräte mit Notch)

## Dateien

- `landing.html` – Begrüßungsseite als QR-Code-Ziel, verlinkt zu `index.html`
- `index.html` – die Spielseite (Code eingeben → Text/Sprachnachricht anzeigen)
- `config.html` – Verwaltungsseite als Seiten-Assistent (Landing Page +
  Willkommen + je eine Seite pro Rätsel + Finale), passwortgeschützt
  (Standard-Passwort `geburtstag`, änderbar in `config.js`)
- `storage.js` – gemeinsame Speicherlogik (localStorage); Rätsel werden als
  geordnete Liste von Schritten gespeichert, alte Daten (Vorgängerversion)
  werden beim ersten Laden automatisch migriert
- `theme.js` – wendet Theme + Hintergrundbild an
- `sounds.js` – synthetische Feedback-Töne
- `game.js`, `config.js`, `landing.js` – Logik der drei Seiten
- `style.css` – gemeinsames Design, alle 5 Themes
- `backgrounds/*.svg` – die 5 Hintergrundbilder

## Deployment auf GitHub Pages

1. Neues Repository auf GitHub anlegen (z. B. `detektiv-spiel`) und diese
   Dateien hineinpushen:
   ```bash
   git init
   git add .
   git commit -m "Detektiv-Spiel"
   git branch -M main
   git remote add origin https://github.com/<dein-user>/detektiv-spiel.git
   git push -u origin main
   ```
2. Im Repo: **Settings → Pages → Source** auf „Deploy from a branch“ stellen,
   Branch `main`, Ordner `/ (root)` auswählen, speichern.
3. Nach ein bis zwei Minuten ist die Seite live unter
   `https://<dein-user>.github.io/detektiv-spiel/`.

## Spiel vorbereiten

1. Auf **genau dem Gerät**, das beim Spiel benutzt wird, die Konfigurations-
   seite öffnen: `https://<dein-user>.github.io/detektiv-spiel/config.html`
2. Passwort eingeben (Standard: `geburtstag`, vorher in `config.js` ändern).
3. Auf Seite 1 („📱 Landing Page“) Überschrift/Text/Bild für die
   Begrüßungsseite festlegen – dorthin soll der QR-Code zeigen.
4. Auf Seite 2 („👋 Willkommen“) Titel/Untertitel/Fehlermeldung, Design,
   Hintergrundbild und Sounds festlegen.
5. Mit „Weiter →“ (bzw. „+ Neues Rätsel“ oder den Punkten oben) durch die
   Rätsel-Seiten gehen und pro Seite Code, Überschrift, Beschreibung und
   optional eine Sprachnachricht eintragen. Auf der letzten Seite („🏁
   Finale“) die Abschluss-Seite festlegen.
6. Über „Export (JSON)“ ein Backup herunterladen – falls der Browser-Speicher
   mal gelöscht wird, lässt sich der Stand per „Import“ wiederherstellen
   (ersetzt dabei die komplette Rätsel-Liste).
7. QR-Code auf `https://<dein-user>.github.io/detektiv-spiel/landing.html`
   erzeugen (z. B. mit einem beliebigen Online-QR-Generator) und ausdrucken/
   aufstellen. Zum direkten Spielen/Testen geht auch `index.html`.

## Hinweise

- Der Passwortschutz auf `config.html` ist nur eine kleine Bremse gegen
  neugierige Gäste, **kein** echter Schutz – das Repo ist öffentlich, jeder
  kann den Quelltext lesen.
- Privates Browsing / Löschen der Browserdaten löscht auch die Codes –
  vorher exportieren!
- Ein Code darf beliebige Zeichen und beliebige Länge haben; der Text darf
  ebenfalls beliebig lang sein und Zeilenumbrüche enthalten.
- Sprachnachrichten benötigen Mikrofon-Zugriff (Browser fragt beim ersten
  Aufnehmen danach) und eine sichere Verbindung – auf `https://…github.io`
  und `localhost` funktioniert das, auf `http://` nicht.
- Wiedergabe läuft intern über eine `blob:`-URL statt direkt über die
  gespeicherte data-URL, weil Safari von MediaRecorder aufgenommenes,
  fragmentiertes MP4 sonst nicht abspielen kann (Dauer bleibt "Infinity",
  kein Ton). Das betrifft sowohl die Vorschau in `config.html` als auch die
  Wiedergabe im Spiel.
- Aufnahmen werden als Base64 im localStorage gespeichert (Browser-Limit
  meist 5–10 MB pro Seite) – Nachrichten daher kurz halten. Der JSON-Export
  wird durch Sprachnachrichten entsprechend größer.
