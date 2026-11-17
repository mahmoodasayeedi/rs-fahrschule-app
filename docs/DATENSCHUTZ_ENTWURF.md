# Datenschutzerklärung – ENTWURF

> **Status: technischer Entwurf, keine Rechtsberatung.** Dieser Text beschreibt, welche Daten die App tatsächlich verarbeitet. Er muss vor dem Go-Live von RS Fahrschule und einer fachkundigen Person (Rechtsanwalt oder externer Datenschutzbeauftragter) geprüft, ergänzt und freigegeben werden. Alle Stellen mit [PLATZHALTER] sind offen.

## 1. Verantwortlicher

[PLATZHALTER Name und Anschrift der Fahrschule, Inhaber, Telefon, E-Mail]

Datenschutzbeauftragter (falls benannt): [PLATZHALTER]

## 2. Welche Daten wir verarbeiten und wofür

| Daten | Zweck | Rechtsgrundlage (zu prüfen) |
|---|---|---|
| Name, Anschrift, Geburtsdatum, Telefon, E-Mail | Anmeldung und Verwaltung der Fahrausbildung, Kontakt | Art. 6 Abs. 1 lit. b DSGVO (Vertrag) |
| Führerscheinklasse, Anmeldedatum, Ausbildungsstand, Anzahl und Art der Fahrstunden | Durchführung und Dokumentation der Ausbildung | Art. 6 Abs. 1 lit. b DSGVO; ggf. gesetzliche Ausbildungsnachweise |
| Terminanfragen, Termine, Abholort, Zielort, Stornierungen, Nichterscheinen | Terminplanung und Abrechnung | Art. 6 Abs. 1 lit. b DSGVO |
| Prüfungstermine, Prüfungsergebnisse, Wahl der Mitfahrt zur Prüfung | Organisation der Prüfungen | Art. 6 Abs. 1 lit. b DSGVO |
| Interne Notizen (Ausbildung, Büro) | Ausbildungsverlauf und Organisation | Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse) [prüfen] |
| Zahlungen, Rechnungen, Rechnungsnummern | Abrechnung und steuerliche Pflichten | Art. 6 Abs. 1 lit. b und c DSGVO |
| Mitteilungen in der App (Terminbestätigungen, Erinnerungen) | Information zu Terminen | Art. 6 Abs. 1 lit. b DSGVO |
| Technische Daten (Anmeldezeitpunkt, Konto-ID) | Betrieb und Sicherheit der App | Art. 6 Abs. 1 lit. f DSGVO |

Zahlungen, Rechnungen und interne Notizen sind **nicht** für Fahrschüler in der App sichtbar. Fahrlehrer sehen nur die Daten ihrer zugewiesenen Fahrschüler und nur Ausbildungsnotizen.

## 3. Empfänger und Dienstleister

- Hosting und Datenbank: Supabase, Rechenzentrum Frankfurt (EU). [PLATZHALTER: Auftragsverarbeitungsvertrag abschließen; Übermittlung an Konzernmutter in Drittland prüfen (Standardvertragsklauseln / Data Privacy Framework)]
- E-Mail-Versand: [PLATZHALTER Anbieter, sobald festgelegt]
- Push-Mitteilungen: [PLATZHALTER, erst relevant, wenn eingeführt (Expo / Apple / Google)]
- Prüforganisation (z. B. TÜV/DEKRA) erhält Daten nur, soweit für die Prüfungsanmeldung erforderlich. [PLATZHALTER klären]

## 4. Speicherdauer

[PLATZHALTER: Aufbewahrungsfristen von RS Fahrschule und Steuerberater festlegen lassen.]
Rechnungen und Zahlungsbelege unterliegen gesetzlichen Aufbewahrungsfristen, unabhängig von der Löschung personenbezogener Ausbildungsdaten. Selbstregistrierte Konten, die nicht innerhalb von 14 Tagen im Büro bestätigt werden, werden automatisch gelöscht.

## 5. Ihre Rechte

Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20), Widerspruch (Art. 21). Beschwerde bei der zuständigen Aufsichtsbehörde: [PLATZHALTER zuständige Landesdatenschutzbehörde].

## 6. Minderjährige

Fahrschüler können unter 18 Jahre alt sein. [PLATZHALTER: Einwilligung bzw. Mitwirkung der Erziehungsberechtigten rechtlich klären lassen.]

## 7. Technische und organisatorische Maßnahmen (Auszug)

- Zugriffsschutz auf Datenbankebene (Row Level Security): Fahrschüler sehen nur eigene Daten.
- Rollenmodell: Fahrschüler, Fahrlehrer, Büro, Administrator mit getrennten Rechten.
- Wichtige Änderungen (Zuweisungen, Zahlungen, Rechnungen, Notizen) werden protokolliert.
- Verschlüsselte Übertragung (HTTPS).

## 8. Offene Punkte vor Veröffentlichung

1. Verantwortlichen, Datenschutzbeauftragten und Aufsichtsbehörde eintragen.
2. Auftragsverarbeitungsverträge mit allen Dienstleistern.
3. Löschkonzept und Aufbewahrungsfristen festlegen.
4. Einwilligungen und Minderjährige klären.
5. Verzeichnis von Verarbeitungstätigkeiten (Art. 30) anlegen.
6. Rechtliche Prüfung des gesamten Textes.
