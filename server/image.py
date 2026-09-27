import os
import ipaddress
import socket
from urllib.parse import urlparse

import requests  # request img from web
from config import MODE

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 Mo
REQUEST_TIMEOUT = 5  # secondes

# Dossier des images des idées (partagé avec le frontend)
KDOS_DIR = "/shared/kdos" if MODE == "production" else "../kdoapp/public/kdos"


def _kdos_path(filename: str):
    """Chemin du fichier dans KDOS_DIR, ou None s'il en sortirait (défense en profondeur)."""
    base = os.path.realpath(KDOS_DIR)
    path = os.path.realpath(os.path.join(base, filename))
    if not path.startswith(base + os.sep):
        return None
    return path


def _is_blocked_ip(ip_str: str) -> bool:
    """True si l'IP est privée, loopback, link-local ou réservée (anti-SSRF)."""
    try:
        ip = ipaddress.ip_address(ip_str)
    except ValueError:
        return True
    return (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_reserved
        or ip.is_multicast
        or ip.is_unspecified
    )


def _is_safe_image_url(url: str) -> bool:
    """Schéma http(s) uniquement + aucune IP résolue ne doit être interne."""
    try:
        parsed = urlparse(url)
    except ValueError:
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    host = parsed.hostname
    if not host:
        return False
    try:
        infos = socket.getaddrinfo(host, None)
    except (socket.gaierror, UnicodeError):
        return False
    for info in infos:
        if _is_blocked_ip(info[4][0]):
            return False
    return True


def get_image(url, name):
    # Anti-SSRF : schéma http(s), IP résolues non internes, pas de redirection
    # suivie, timeout, plafond de taille, content-type image.
    # Risque résiduel ACCEPTÉ : DNS-rebinding (TOCTOU) entre _is_safe_image_url
    # et requests.get. Jugé faible (endpoint admin-gated, SSRF aveugle, exploit
    # coûteux). Non fermé volontairement ; voir le design doc.
    if not _is_safe_image_url(url):
        print('URL rejetée (SSRF)')
        return 'unknown.jpg'

    file_path = _kdos_path(name)
    if file_path is None:
        print('nom de fichier rejeté')
        return 'unknown.jpg'

    try:
        res = requests.get(url, stream=True, timeout=REQUEST_TIMEOUT, allow_redirects=False)
    except requests.RequestException:
        print('download NOK')
        return 'unknown.jpg'

    content_type = res.headers.get("Content-Type", "")
    if res.status_code != 200 or not content_type.startswith("image/"):
        print('download NOK')
        return 'unknown.jpg'

    downloaded = 0
    with open(file_path, 'wb') as f:
        for chunk in res.iter_content(chunk_size=8192):
            downloaded += len(chunk)
            if downloaded > MAX_IMAGE_BYTES:
                f.close()
                os.remove(file_path)
                print('image trop grande')
                return 'unknown.jpg'
            f.write(chunk)
    print('download ok')
    return name


def remove_image(pk):
    path = _kdos_path(f"{pk}.jpg")
    if path is not None and os.path.exists(path):
        os.remove(path)
