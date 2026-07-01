# `window.eduBridge` — Vertrag zwischen Angular-App und nativer Android-Shell

Dieser Vertrag ist die **einzige Kopplung** zwischen diesem Repo (Angular-Frontend) und der
nativen Android-Shell (`TSGames/edu-sharing-android`). Die native Shell lädt die vom Server
(`NgServlet`) ausgelieferte SPA in einem `WebView` und injiziert das Objekt `window.eduBridge`.
`CordovaService` (`Frontend/src/app/services/cordova.service.ts`) liest ausschließlich diesen
Vertrag; `AppSharePageComponent` bleibt unverändert und kennt nur `CordovaService`.

Ziel der Modernisierung: Ersatz der toten Cordova-Plugin-Globals
(`window.plugins.intent.*`, `resolveLocalFileSystemURL`, `cordova.openwith`,
`window.device`, `NativeStorage`, `navigator.app`) durch eine kleine, eigene,
plugin-freie Bridge.

> **Stufe 1 = nur Android.** iOS (Stufe 2) erfüllt später denselben Vertrag über eine
> `WKWebView`+Share-Extension-Shell. Plattform-spezifische Felder sind unten markiert.

---

## 1. Erkennung „läuft in der App"

Die native Shell setzt einen **Custom-UserAgent** mit dem Marker `edu-sharing-app` (zusätzlich
`android` und eine Versionsnummer `x.y.z`), z. B.:

```
Mozilla/5.0 (... Android ...) edu-sharing-app/1.0.0 android
```

`CordovaService.isReallyRunningCordova()` / Plattform-Erkennung greift auf diesen Marker.
Zusätzlich gilt das Vorhandensein von `window.eduBridge` als verbindlicher App-Indikator.

---

## 2. JS → Native: `window.eduBridge`

Alle Methoden sind synchron (Android `@JavascriptInterface`) und geben **String** (JSON oder
primitiv) zurück bzw. `void`.

| Methode | Rückgabe | Zweck |
|---|---|---|
| `getPlatform()` | `"android"` | Plattform-Kennung (ersetzt `window.device.platform`). |
| `getAppVersion()` | `"1.0.0"` | App-Version (Diagnose, Feature-Gates). |
| `getInitialShare()` | `string \| ""` | JSON des Share, der die App **kalt** gestartet hat, sonst leer. Beim Start einmal abrufen. |
| `consumeShare()` | `void` | Markiert den letzten Share als verarbeitet (verhindert erneutes Feuern beim Resume). |
| `exitApp()` | `void` | App beenden (ersetzt `navigator.app.exitApp()`). |
| `readFile(uri)` | `string` (base64) | Optional: base64-Inhalt einer `content://`-URI nachladen, falls nicht inline geliefert. |
| `takePhoto()` | `void` | Startet die native Kamera-Aufnahme **asynchron** (ersetzt `navigator.camera.getPicture(...)`). Kehrt sofort zurück; das Ergebnis kommt über `window.eduBridgeOnPhotoTaken` (§3/§5). Permission-Handling (`CAMERA`) übernimmt die Shell intern — kein separater Bridge-Aufruf nötig. |

Persistenter Speicher (OAuth-Token, Server-URL) nutzt **`window.localStorage`** direkt —
keine Bridge-Methode nötig (same-origin Remote-WebView; das alte `NativeStorage`-Backup
entfällt auf Android).

**Ausnahme vom Sync-Muster:** `takePhoto()` ist bewusst **nicht** synchron wie die übrigen
Methoden — eine Kamera-Aufnahme kann durch Nutzerinteraktion beliebig lange dauern, und ein
synchroner `@JavascriptInterface`-Aufruf würde die JS-Ausführung der Seite für diese Zeit
blockieren (Risiko einer „Seite reagiert nicht"-Warnung im WebView). Stattdessen kehrt
`takePhoto()` sofort zurück und liefert das Ergebnis asynchron über den Callback
`window.eduBridgeOnPhotoTaken` (siehe §3, §5) — analog zum bestehenden Push-Modell für
Warm-Shares (`eduBridgeOnShare`).

---

## 3. Native → JS: Event-Callbacks

Die Shell ruft global definierte Funktionen auf, sobald vorhanden (die App definiert sie beim
Start):

| Callback | Argument | Zweck |
|---|---|---|
| `window.eduBridgeOnReady()` | – | Shell ist initialisiert (optional; `eduBridge`-Präsenz genügt). |
| `window.eduBridgeOnShare(payloadJson)` | `string` (JSON, siehe §4) | Neuer `ACTION_SEND` während die App **läuft** (warm). |
| `window.eduBridgeOnResume()` | – | App kam aus dem Hintergrund (> ~1 min) zurück. |
| `window.eduBridgeOnBack()` | – | Hardware-Zurück-Taste; App entscheidet (WebView-History vs. `exitApp`). |
| `window.eduBridgeOnPhotoTaken(payloadJson)` | `string` (JSON, siehe §5) | Ergebnis einer per `takePhoto()` gestarteten Kamera-Aufnahme (Erfolg, Abbruch oder Fehler). |

Kaltstart-Shares kommen über `getInitialShare()`, Warm-Shares über `eduBridgeOnShare`.

---

## 4. Share-Payload (JSON)

Einheitliches Schema für `getInitialShare()` und `eduBridgeOnShare(...)`:

```json
{
  "action":   "SEND",                 // oder "VIEW" (Deep-Link auf eine edu-sharing-URL)
  "mimetype": "image/jpeg",           // Intent-Type
  "text":     "https://… oder Text",  // android.intent.extra.TEXT (Link/Text-Snippet)
  "uri":      "content://…",          // android.intent.extra.STREAM (Datei) ODER der Link
  "fileName": "photo.jpg",            // Anzeigename, falls bekannt
  "stream":   "<base64>"              // Dateibytes als base64 (bei Datei-Shares)
}
```

Regeln:
- **Link/Text-Share:** `text` gesetzt, `stream`/`fileName` leer. `mimetype` = `text/plain`.
- **Datei-Share** (`image/*`, `video/*`, `audio/*`, `application/pdf`): `uri` = `content://`,
  `stream` = base64 der Bytes (die Shell liest die `content://`-URI nativ via
  `ContentResolver`), `fileName` = Anzeigename, `mimetype` = konkreter Typ.
- **Deep-Link** (`action: "VIEW"`): `uri` = vollständige edu-sharing-URL; die App navigiert
  den WebView dorthin.

Dieses Schema bedient die bestehende `AppSharePageComponent` ohne Änderung: sie liest
`getLastIntent().stream` (base64) → `Helper.base64toBlob(stream, mimetype)`, und für
Link/Text `uri`/`text` über `isLink()`/`isTextSnippet()`.

---

## 5. Photo-Capture-Payload (JSON)

Argument von `window.eduBridgeOnPhotoTaken(payloadJson)`, ausgelöst nach `takePhoto()`:

```json
{
  "success":  true,
  "mimetype": "image/jpeg",
  "fileName": "photo_20260701_120000.jpg",
  "stream":   "<base64>"
}
```

Bei Abbruch (Nutzer bricht die Kamera-App ab) oder Fehler:

```json
{ "success": false, "error": "CANCELLED" }
```

Regeln:
- `stream` ist immer ein JPEG (die Shell korrigiert die EXIF-Rotation vor der Kodierung),
  unabhängig vom `options`-Parameter der alten Cordova-API — `getPhotoFromCamera` reicht
  `options` weiterhin entgegen, die eduBridge-Implementierung ignoriert sie aber bewusst
  (keine Konfigurationsfläche über die Bridge, um die Shell einfach zu halten).
- Nur eine Aufnahme gleichzeitig: ein erneuter `takePhoto()`-Aufruf, während bereits eine
  Aufnahme läuft, überschreibt den ausstehenden Callback nicht — `CordovaService` serialisiert
  das analog zum bisherigen Cordova-Verhalten (kein gleichzeitiger Zugriff aus der SPA).

---

## 6. Mapping alt (Cordova) → neu (`eduBridge`)

| Heute in `CordovaService` (tot) | Neu |
|---|---|
| `window.plugins.intent.getCordovaIntent(cb)` (Kaltstart) | `eduBridge.getInitialShare()` |
| `window.plugins.intent.setNewIntentHandler(cb)` (warm) | `window.eduBridgeOnShare` |
| `intent.extras['android.intent.extra.TEXT']` | `payload.text` |
| `intent.extras['android.intent.extra.STREAM']` | `payload.uri` |
| `intent.type` | `payload.mimetype` |
| `intent.clipItems[0].file` / base64 | `payload.stream` (base64) / `payload.fileName` |
| `resolveLocalFileSystemURL(...)` (`getFileAsBlob`) | inline `payload.stream`, optional `eduBridge.readFile(uri)` |
| `window.device.platform` (`isAndroid`/`isIOS`) | `eduBridge.getPlatform()` |
| `NativeStorage.*` (iOS-Backup) | entfällt (Android: nur `localStorage`) |
| `navigator.app.exitApp()` | `eduBridge.exitApp()` |
| dynamisches `app-registry…/cordova.js`-Laden | entfällt (Bridge ist nativ injiziert) |
| `navigator.camera.getPicture(win, fail, opts)` (`cordova-plugin-camera`) | `eduBridge.takePhoto()` + `window.eduBridgeOnPhotoTaken` (§5) |
| `cordova.plugins.permissions` (`CAMERA`-Check vor Aufnahme) | entfällt (Shell holt die Berechtigung intern; kein Bridge-Aufruf) |

---

## 7. Auth & Netzwerk

Same-origin (WebView lädt `https://<server>/`): OAuth `POST /oauth2/token`
(`grant_type=password`/`refresh_token`) und alle `/rest/*`-Aufrufe laufen über den normalen
Angular-`HttpClient` — **kein CORS, kein nativer HTTP-Layer**. Token/Server-URL liegen in
`localStorage`. Backend-seitig muss nur die App-`client_id`/`client_secret` in
`TokenService.validateClient` akzeptiert werden.
