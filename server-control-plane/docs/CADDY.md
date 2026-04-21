# Caddy (Reverse Proxy)

Das Control Plane sollte **nicht** ungeschützt im Internet hängen. Typische Optionen:

## 1. Basic Auth (einfach)

```caddy
control.example.com {
    basicauth {
        admin JDJhJDE0JEVCNmdaNEg2Ti5...  # bcrypt hash, siehe `caddy hash-password`
    }
    reverse_proxy 127.0.0.1:3040
}
```

Ersetze `127.0.0.1:3040` durch den Port aus `docker-compose.yml` (`CONTROL_PLANE_PORT`).

## 2. Authelia / OAuth (empfohlen für Produktion)

Leite nur authentifizierte Nutzer an den Upstream weiter (bestehende Authelia-`forward_auth`-Konfiguration deines Servers).

## 3. Nur VPN / internes Netz

Caddy lauscht nur auf internem Interface oder Firewall erlaubt nur VPN-IPs.

## TLS

Caddy übernimmt automatisch Let’s Encrypt, wenn `control.example.com` öffentlich erreichbar ist und Port 80/443 frei sind.
