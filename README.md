# Detektiv-Spiel

Eine ganz einfache statische Webseite (kein Server, kein Build-Schritt) für
ein Detektiv-/Rätselspiel: Spieler geben einen 4-stelligen Code ein, den sie
irgendwo gefunden haben, und bekommen dazu einen Text angezeigt.

Alle Codes und ihre Texte werden im `localStorage` des Browsers gespeichert,
in dem sie über die Konfigurationsseite angelegt wurden. Das Spiel ist daher
für den Einsatz auf **einem gemeinsamen Gerät** gedacht (Tablet/Handy/Laptop,
das für alle Spieler benutzt wird) – öffnet jemand die Seite auf einem
anderen Gerät, sieht er die dort angelegten Codes nicht.

## Dateien

- `index.html` – die Spielseite (Code eingeben → Text anzeigen)
- `config.html` – Verwaltungsseite zum Anlegen/Bearbeiten der Codes,
  passwortgeschützt (Standard-Passwort `geburtstag`, änderbar in `config.js`)
- `storage.js` – gemeinsame Speicherlogik (localStorage)
- `game.js`, `config.js` – Logik der beiden Seiten
- `style.css` – gemeinsames Design

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
3. Codes + zugehörige Texte anlegen.
4. Über „Export (JSON)“ ein Backup herunterladen – falls der Browser-Speicher
   mal gelöscht wird, lässt sich der Stand per „Import“ wiederherstellen.
5. Zum Spielen: `index.html` (bzw. die Startseite) öffnen.

## Hinweise

- Der Passwortschutz auf `config.html` ist nur eine kleine Bremse gegen
  neugierige Gäste, **kein** echter Schutz – das Repo ist öffentlich, jeder
  kann den Quelltext lesen.
- Privates Browsing / Löschen der Browserdaten löscht auch die Codes –
  vorher exportieren!
- Ein Code muss aus genau 4 Ziffern bestehen; der Text darf beliebig lang
  sein und Zeilenumbrüche enthalten.
