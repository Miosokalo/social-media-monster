/** User-facing hints for common API status codes used in the app. */
export function messageForApiStatus(status: number, code?: string): string {
  if (status === 402) {
    if (code === "quota_publish")
      return "Post-Limit erreicht — bitte Plan upgraden oder nächsten Monat warten.";
    if (code === "quota_studio")
      return "Studio-Nachrichten-Limit erreicht — Plan upgraden oder später erneut versuchen.";
    return "Kontingent erschöpft — siehe Billing in den Einstellungen.";
  }
  if (status === 403) {
    return "Keine Berechtigung für diese Aktion.";
  }
  if (status === 503) {
    return "Dienst vorübergehend nicht verfügbar — bitte später erneut versuchen.";
  }
  if (status === 401) {
    return "Nicht angemeldet — bitte einloggen.";
  }
  return "Anfrage fehlgeschlagen.";
}
