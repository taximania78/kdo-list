import pytest
import image
from image import _is_blocked_ip, _is_safe_image_url, get_image


@pytest.mark.parametrize("ip", ["127.0.0.1", "169.254.169.254", "10.0.0.5", "192.168.1.1", "::1"])
def test_blocked_ips(ip):
    assert _is_blocked_ip(ip) is True


@pytest.mark.parametrize("ip", ["8.8.8.8", "93.184.216.34"])
def test_public_ips(ip):
    assert _is_blocked_ip(ip) is False


def test_unsafe_scheme():
    assert _is_safe_image_url("ftp://example.com/x.jpg") is False
    assert _is_safe_image_url("file:///etc/passwd") is False


def test_unsafe_private_host():
    assert _is_safe_image_url("http://127.0.0.1/x.jpg") is False
    assert _is_safe_image_url("http://169.254.169.254/latest/meta-data/") is False


def test_safe_public_literal_ip():
    assert _is_safe_image_url("https://93.184.216.34/image.jpg") is True


def test_get_image_blocked_url_never_fetches(monkeypatch):
    def fake_get(*args, **kwargs):
        raise AssertionError("requests.get ne doit pas être appelé pour une URL bloquée")
    monkeypatch.setattr("image.requests.get", fake_get)
    assert get_image("http://169.254.169.254/x", "1.jpg") == "unknown.jpg"


def test_get_image_rejects_redirect(monkeypatch):
    """Finding A: les redirections 3xx doivent être rejetées (allow_redirects=False)."""
    recorded = {}

    class FakeResponse:
        status_code = 302
        headers = {}

    def fake_get(*args, **kwargs):
        recorded["kwargs"] = kwargs
        return FakeResponse()

    monkeypatch.setattr("image.requests.get", fake_get)
    result = get_image("https://93.184.216.34/x.jpg", "1.jpg")
    assert result == "unknown.jpg"
    assert recorded["kwargs"].get("allow_redirects") is False


def test_is_safe_image_url_fails_closed_on_unicode_error(monkeypatch):
    """Finding B: une UnicodeError (IDNA) doit faire échouer en fail-closed."""
    def fake_getaddrinfo(*args, **kwargs):
        raise UnicodeError("malformed hostname")

    monkeypatch.setattr("image.socket.getaddrinfo", fake_getaddrinfo)
    assert _is_safe_image_url("http://xn--bad/x.jpg") is False


class _FakeImageResponse:
    status_code = 200
    headers = {"Content-Type": "image/jpeg"}

    def iter_content(self, chunk_size):
        yield b"fake-jpeg"


def test_get_image_writes_inside_kdos_dir(monkeypatch, tmp_path):
    """Le fichier doit être écrit DANS le dossier des images (pas à côté : 'kdos1.jpg')."""
    monkeypatch.setattr(image, "KDOS_DIR", str(tmp_path))
    monkeypatch.setattr(image, "_is_safe_image_url", lambda url: True)
    monkeypatch.setattr("image.requests.get", lambda *a, **k: _FakeImageResponse())

    assert get_image("https://93.184.216.34/x.jpg", "1.jpg") == "1.jpg"
    assert (tmp_path / "1.jpg").read_bytes() == b"fake-jpeg"


def test_remove_image_deletes_inside_kdos_dir(monkeypatch, tmp_path):
    monkeypatch.setattr(image, "KDOS_DIR", str(tmp_path))
    (tmp_path / "5.jpg").write_bytes(b"x")

    image.remove_image(5)

    assert not (tmp_path / "5.jpg").exists()


def test_get_image_refuses_path_outside_kdos_dir(monkeypatch, tmp_path):
    """Défense en profondeur : un nom de fichier ne doit jamais sortir du dossier des images."""
    kdos = tmp_path / "kdos"
    kdos.mkdir()
    monkeypatch.setattr(image, "KDOS_DIR", str(kdos))
    monkeypatch.setattr(image, "_is_safe_image_url", lambda url: True)
    monkeypatch.setattr("image.requests.get", lambda *a, **k: _FakeImageResponse())

    assert get_image("https://93.184.216.34/x.jpg", "../evil.jpg") == "unknown.jpg"
    assert not (tmp_path / "evil.jpg").exists()


def test_remove_image_refuses_path_outside_kdos_dir(monkeypatch, tmp_path):
    kdos = tmp_path / "kdos"
    kdos.mkdir()
    monkeypatch.setattr(image, "KDOS_DIR", str(kdos))
    (tmp_path / "evil.jpg").write_bytes(b"x")

    image.remove_image("../evil")

    assert (tmp_path / "evil.jpg").exists()


# ─── Destinations Internet publiques uniquement ─────────────────────────
# Aucun test ne contacte le réseau : DNS et HTTP sont simulés.

def _fake_dns(*ips):
    """getaddrinfo simulé : renvoie les IP données, sans résolution réelle."""
    def fake_getaddrinfo(host, *args, **kwargs):
        return [(None, None, None, "", (ip, 0)) for ip in ips]
    return fake_getaddrinfo


def _dns_failure(*args, **kwargs):
    raise image.socket.gaierror("résolution impossible")


@pytest.mark.parametrize("ip", [
    # loopback
    "127.0.0.1", "::1",
    # réseaux privés
    "10.0.0.5", "172.16.0.1", "192.168.1.1", "fc00::1", "fd7a:115c:a1e0::1",
    # link-local
    "169.254.169.254", "fe80::1", "fe80::1%eth0",
    # espace partagé 100.64.0.0/10 (CGNAT, Tailscale) : bornes et intérieur
    "100.64.0.0", "100.64.0.1", "100.127.255.255",
    # IPv4 représentée en IPv6
    "::ffff:100.64.0.1", "::ffff:127.0.0.1", "::ffff:10.0.0.1",
    # multicast (is_global vaut True : doit rester bloqué)
    "224.0.1.1", "ff0e::1",
    # non spécifiées
    "0.0.0.0", "::",
    # NAT64 vers 127.0.0.1 (is_global vaut True : doit rester bloqué)
    "64:ff9b::7f00:1",
    # chaîne invalide
    "pas-une-ip",
])
def test_non_public_ips_are_blocked(ip):
    assert _is_blocked_ip(ip) is True


@pytest.mark.parametrize("ip", [
    "8.8.8.8", "93.184.216.34",
    # juste hors de 100.64.0.0/10
    "100.63.255.255", "100.128.0.0",
    "2001:4860:4860::8888", "::ffff:8.8.8.8",
])
def test_public_ips_are_allowed(ip):
    assert _is_blocked_ip(ip) is False


def test_hostname_resolving_to_shared_space_is_rejected(monkeypatch):
    monkeypatch.setattr("image.socket.getaddrinfo", _fake_dns("100.64.0.1"))
    assert _is_safe_image_url("https://images.example/x.jpg") is False


def test_mixed_resolution_public_and_shared_space_is_rejected(monkeypatch):
    monkeypatch.setattr("image.socket.getaddrinfo", _fake_dns("93.184.216.34", "100.64.0.1"))
    assert _is_safe_image_url("https://images.example/x.jpg") is False


def test_mixed_resolution_public_and_private_ipv6_is_rejected(monkeypatch):
    monkeypatch.setattr("image.socket.getaddrinfo", _fake_dns("93.184.216.34", "fd7a:115c:a1e0::1"))
    assert _is_safe_image_url("https://images.example/x.jpg") is False


def test_dns_failure_is_rejected(monkeypatch):
    monkeypatch.setattr("image.socket.getaddrinfo", _dns_failure)
    assert _is_safe_image_url("https://images.example/x.jpg") is False


def test_public_only_resolution_is_allowed(monkeypatch):
    monkeypatch.setattr("image.socket.getaddrinfo", _fake_dns("93.184.216.34", "2001:4860:4860::8888"))
    assert _is_safe_image_url("https://images.example/x.jpg") is True


def test_ipv4_mapped_shared_space_literal_url_is_rejected(monkeypatch):
    monkeypatch.setattr("image.socket.getaddrinfo", _fake_dns("::ffff:100.64.0.1"))
    assert _is_safe_image_url("http://[::ffff:100.64.0.1]/x.jpg") is False


def test_get_image_shared_space_never_fetches(monkeypatch, tmp_path):
    monkeypatch.setattr(image, "KDOS_DIR", str(tmp_path))
    monkeypatch.setattr("image.socket.getaddrinfo", _fake_dns("100.64.0.1"))

    def fake_get(*args, **kwargs):
        raise AssertionError("requests.get ne doit pas être appelé après un rejet")

    monkeypatch.setattr("image.requests.get", fake_get)
    assert get_image("http://images.example/x.jpg", "1.jpg") == "unknown.jpg"
    assert list(tmp_path.iterdir()) == []


def test_get_image_public_destination_downloads(monkeypatch, tmp_path):
    monkeypatch.setattr(image, "KDOS_DIR", str(tmp_path))
    monkeypatch.setattr("image.socket.getaddrinfo", _fake_dns("93.184.216.34"))
    calls = []

    def fake_get(url, **kwargs):
        calls.append((url, kwargs))
        return _FakeImageResponse()

    monkeypatch.setattr("image.requests.get", fake_get)
    assert get_image("https://images.example/x.jpg", "1.jpg") == "1.jpg"
    assert len(calls) == 1
    assert calls[0][1]["allow_redirects"] is False
    assert calls[0][1]["timeout"] == image.REQUEST_TIMEOUT == 5
    assert (tmp_path / "1.jpg").read_bytes() == b"fake-jpeg"
