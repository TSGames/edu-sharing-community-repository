# Übergabe: Android-App für edu-sharing („Daten senden")

Stand der Arbeit, damit eine **neue Session** nahtlos weitermachen kann. Branch in diesem Repo:
`claude/android-app-data-sharing-orq5x4`.

## Ziel & Entscheidungen (bereits mit dem User geklärt)

- **Use-Case:** „An edu-sharing senden" (Android-Teilen → Login → Zielordner/Sammlung → Upload).
- **Umfang:** voller Mobile-Client; **Stufe 1 = nur Android**, iOS später (Stufe 2).
- **Architektur:** **schlanke native Shell + Remote-WebView.** Die native Android-Shell lädt die
  **Live-Server-SPA** (von `NgServlet` ausgeliefert) in einem `WebView` (same-origin → **kein
  CORS**, kein HTTP-Shim, keine Cordova/Capacitor-Plugins). Nur der Share-Intent wird nativ
  behandelt und über `window.eduBridge` an die Web-App gereicht.
- **Repo-Aufteilung:** native Shell in **eigenem Repo `TSGames/edu-sharing-android`**; die
  Frontend-Naht + Bridge-Vertrag liegen in diesem Repo. Entkoppelt über `window.eduBridge`.
- Voller Plan: `/root/.claude/plans/schau-dir-das-repo-fizzy-steele.md` (im Branch nicht
  enthalten; hier zusammengefasst).

## Was in DIESEM Repo erledigt & gepusht ist (Commit `4aa35fc`)

1. **`docs/android-app/eduBridge-contract.md`** — vollständiger `window.eduBridge`-Vertrag.
2. **`Frontend/src/app/services/cordova.service.ts`** — additiv auf `window.eduBridge` umgehängt
   (Legacy-/iOS-Pfade bleiben intakt):
   - Plattform-Erkennung + `deviceIsReady` über die Bridge; **`app-registry…/cordova.js`-Laden
     entfernt**.
   - Share-Zustellung: `eduBridge.getInitialShare()` (Kaltstart) + `window.eduBridgeOnShare(json)`
     (warm) → emittiert `{uri, file, mimetype, text}`, das per Router als QueryParams an
     `…/app/share` geht.
   - `getFileAsBlob` (base64→Blob), `exitApp`, Back/Resume (`eduBridgeOnBack`/`eduBridgeOnResume`),
     `restartCordova` (lädt Server-Origin neu) über die Bridge.
   - `isAndroid()/isIOS()` bevorzugen `this.platform`.
   - **`AppSharePageComponent` und `app-login-page` unverändert.**

⚠️ **Nicht build-verifiziert** — in dieser Umgebung kein `node_modules` (Angular-19-Install zu
schwer). **Vor Merge `cd Frontend && npm ci && npm run build` laufen lassen** und Typecheck prüfen.

## Was NOCH zu tun ist

### A. Native Shell scaffolden — Repo `TSGames/edu-sharing-android` (Hauptarbeit, blockiert)

**Blocker:** `add_repo TSGames/edu-sharing-android` verlangt eine Client-Freigabe, die in der
bisherigen Session nicht erteilt werden konnte. **Neue Session bitte mit diesem Repo im Scope
starten** (bzw. die `add_repo`-Freigabe dort erteilen). Repo existiert ggf. leer.

Zu bauen (Kotlin, modernes `targetSdk`):
- `MainActivity` mit `WebView`, lädt `https://<server>/`. Server-URL: native Erstauswahl
  (URL-Eingabe) oder konfigurierbarer Default; die SPA (`app-login-page`) übernimmt den Login.
- **Custom-UserAgent** mit Marker `edu-sharing-app` (+ `android` + Version), sonst greift die
  App-Erkennung nicht.
- `AndroidManifest`: `ACTION_SEND`-Intent-Filter für `text/plain`, `image/*`, `video/*`,
  `audio/*`, `application/pdf` (Quelle: `.legacy/Cordova/config.xml`). Permission `INTERNET`;
  Datei-Lesen via `ContentResolver` (kein Storage-Permission nötig).
- **`@JavascriptInterface`-Objekt `window.eduBridge`** (synchron, String-Rückgaben):
  - `getPlatform()` → `"android"`
  - `getAppVersion()` → z. B. `"1.0.0"`
  - `getInitialShare()` → JSON des Kaltstart-Shares oder `""`
  - `consumeShare()` → markiert Share als verarbeitet
  - `exitApp()`
  - `readFile(uri)` → base64 (optional; Inhalt sonst inline im `stream`)
- **Native → JS Callbacks** (aufrufen, sobald in der WebView definiert):
  `window.eduBridgeOnShare(payloadJson)` (warmer Share), `eduBridgeOnResume()`, `eduBridgeOnBack()`,
  optional `eduBridgeOnReady()`.
- **Share-Payload-JSON** (für `getInitialShare` und `eduBridgeOnShare`):
  ```json
  { "action":"SEND", "mimetype":"image/jpeg", "text":"link/text",
    "uri":"content://…", "fileName":"photo.jpg", "stream":"<base64>" }
  ```
  Regeln: Link/Text → `text` gesetzt, `mimetype:"text/plain"`. Datei → `uri`=`content://`,
  `stream`=base64 (nativ via `ContentResolver` gelesen), `fileName` gesetzt. Deep-Link →
  `action:"VIEW"`, `uri`=edu-sharing-URL.
- Gradle, Signing/Keystore, Play-Release einrichten.

### B. Frontend-Build verifizieren (dieses Repo)
`cd Frontend && npm ci && npm run build`; CordovaService-Änderung typprüfen. Danach ggf. echter
Geräte-Test des Share-Flows.

## Schlüssel-Fakten / Stolpersteine

- **OAuth:** App nutzt `client_id=eduApp`, `client_secret=secret`, Grants `password` +
  `refresh_token` an `POST /oauth2/token`. **Bereits Trusted Client**
  (`Backend/services/core/src/main/resources/org/edu_sharing/spring/authentication-services.xml:92`)
  → **keine Backend-Änderung nötig**.
- **Same-origin** (WebView lädt `https://<server>/`) → REST/OAuth über normalen Angular-`HttpClient`,
  kein CORS, kein nativer HTTP-Layer. Token/Server-URL in `localStorage`.
- **Empfänger-UI existiert:** `Frontend/src/app/pages/app-share-page/app-share-page.component.ts`
  liest `getLastIntent().stream` (base64) → `Helper.base64toBlob`; Link/Text über `uri`/`text`.
  Route: `[UIConstants.ROUTER_PREFIX, 'app', 'share']`.
- **Wichtig:** Der Share wird erst verarbeitet, wenn `hasValidConfig()` (gültiges OAuth) vorliegt —
  native Shell hält den Kaltstart-Share, bis JS via `getInitialShare()` abholt (Pull-Modell).
- `NgServlet` (`Backend/.../repository/server/NgServlet.java`) liefert die SPA-Shell; Deep-Links
  `/components/render/{nodeId}` laufen im selben WebView.

## Task-Status (Übergabe)

- [x] #2 Bridge-Vertrag dokumentiert
- [x] #3 CordovaService umgehängt (committet `4aa35fc`; **Build-Verifikation offen**)
- [x] #5 Backend-OAuth-Client (keine Änderung nötig — `eduApp` bereits trusted)
- [ ] #1 `add_repo TSGames/edu-sharing-android` (blockiert: Client-Freigabe)
- [ ] #4 Native Android-Shell scaffolden (wartet auf #1)
