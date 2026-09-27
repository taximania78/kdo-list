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
| `INTERNAL_API_URL` | URL de l'API vue par le serveur Next.js (défaut : `NEXT_PUBLIC_API_URL`, `http://kdo-api:8000` en Docker) |

> ⚠️ Générez une `SECRET_KEY` forte, par exemple : `openssl rand -hex 32`.

### Déployer avec Docker

Docker Compose sert au **déploiement** : dans `.env.local`, mettez `NODE_ENV=production`
et une `SECRET_KEY` forte (l'API refuse de démarrer sinon).

`docker-compose.yml` n'expose aucun port : l'accès passe par un reverse-proxy, décrit
dans un `docker-compose.override.yml` (non versionné). Partez de l'exemple Traefik fourni :

```bash
cp docker-compose.override.example.yml docker-compose.override.yml   # puis adaptez-le
docker compose --env-file .env.local up --build -d
```

### Thème

Le thème (`Anniversaire` ou `Noël`) se choisit dans **Admin → Super admin → Apparence**.
Il est enregistré en base et s'applique à tous les utilisateurs au chargement suivant,
sans rebuild ni redémarrage.

### Base de données et migrations

Le schéma est géré par **Alembic** (`server/migrations/`). Au démarrage, le conteneur
API applique automatiquement les migrations manquantes (`alembic upgrade head`) : une
mise à jour se résume à `docker compose --env-file .env.local up --build -d`.

**Installation neuve** : les tables sont créées au premier démarrage. Créez ensuite le
premier super administrateur (`SUPERADMIN_NAME` / `SUPERADMIN_PASSWORD` dans `.env.local`) :

```bash
docker compose exec fastapi python create_superadmin.py
```

**Ajouter une migration** (après avoir modifié `server/models.py`) :

```bash
cd server
alembic revision --autogenerate -m "description du changement"
```

Relisez le fichier généré dans `server/migrations/versions/` avant de le commiter.
`test_migrations.py` échoue si les modèles et les migrations divergent.

### Développement local

Il faut une base PostgreSQL accessible (`DATABASE_*` dans `.env.local`, par ex.
`DATABASE_HOST=localhost`). Hors production, l'API charge automatiquement le
`.env.local` de la racine du dépôt (une variable déjà définie dans le shell reste prioritaire).

Backend :
```bash
cd server
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
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
