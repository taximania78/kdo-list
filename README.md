# Kdo List

Application de gestion de listes de cadeaux : créez des listes, ajoutez des idées
de cadeaux avec image, et partagez-les. Backend **FastAPI** (Python), frontend
**Next.js** (React/TypeScript), base **PostgreSQL**, le tout orchestré avec Docker.

## Stack

| Composant | Techno |
|-----------|--------|
| Frontend  | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend   | FastAPI, SQLAlchemy, JWT (auth) |
| Base de données | PostgreSQL 17 |
| Tests     | Pytest (backend), Jest + Playwright (frontend) |
| Déploiement | Docker Compose + Traefik |

## Structure du dépôt

```
.
├── kdoapp/            # Frontend Next.js
├── server/            # Backend FastAPI
├── docker-compose.yml # Orchestration des services
└── .env.local         # Variables d'environnement (non versionné)
```

## Démarrage rapide

### Prérequis
- Docker et Docker Compose
- (dev local) Node.js 24+ et Python 3.13+

### Configuration

Copiez `.env.local` à partir de l'exemple et renseignez vos valeurs :

```bash
cp .env.example .env.local
```

Variables principales :

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Clé secrète pour la signature des JWT (générer une valeur aléatoire forte) |
| `DATABASE_USER` / `DATABASE_PASSWORD` | Identifiants PostgreSQL |
| `DATABASE_NAME` / `DATABASE_HOST` / `DATABASE_PORT` | Connexion base |
| `NEXT_PUBLIC_API_URL` | URL de l'API exposée au frontend |
| `NEXT_PUBLIC_THEME` | Thème de l'interface (`christmas`, `birthday`, …) |

> ⚠️ Générez une `SECRET_KEY` forte, par exemple : `openssl rand -hex 32`.

### Lancer avec Docker

```bash
docker compose up --build
```

- Frontend : http://localhost:3001
- API : http://localhost:8000

### Développement local

Backend :
```bash
cd server
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend :
```bash
cd kdoapp
npm install
npm run dev
```

## Tests

```bash
# Backend
cd server && pytest -v

# Frontend (unitaires + e2e)
cd kdoapp && npm run test && npm run test:e2e
```

## Licence

Distribué sous licence MIT. Voir [LICENSE](LICENSE).
