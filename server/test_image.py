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
