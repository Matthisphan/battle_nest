# Battle Nest API

API NestJS de gestion de joueurs, jeux, tournois et matchs.

Toute la validation est prévue via Swagger.

## 1. Prerequis

- Docker Desktop
- Docker Compose v2
```bash
pnpm install
```

## 2. Fichiers d environnement

Creer deux fichiers a la racine du projet s'il n'est pas existant.

### .env.dev

```env
NODE_ENV=development
PORT=3000

DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=battle_nest_dev

JWT_SECRET=super-secret-dev-key

SEED_ON_BOOT=true

PGADMIN_DEFAULT_EMAIL=admin@admin.com
PGADMIN_DEFAULT_PASSWORD=admin
```

### .env.prod

```env
NODE_ENV=production
PORT=3000

DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=battle_nest_prod

JWT_SECRET=super-secret-prod-key

SEED_ON_BOOT=false
```

Important:
- Les comptes admin/player de test sont seeds uniquement en mode development avec SEED_ON_BOOT=true.
- En production, cree tes comptes via les routes auth.

## 3. Lancer le projet

### DEV

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up --build
```

### PROD

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up --build
```

Arreter les conteneurs:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml down
docker compose --env-file .env.prod -f docker-compose.prod.yml down
```

## 4. URLs utiles

- API: http://localhost:3000
- Swagger: http://localhost:3000/api
- PgAdmin (dev): http://localhost:5050
  ```bash
  DB_HOST=db
  DB_PORT=5432
  DB_USERNAME=postgres
  DB_PASSWORD=postgres
  DB_NAME=battle_nest_dev
  ```
## 5. Recuperer les tokens depuis les logs

Pour les routes suivantes, le token est affiche dans les logs Nest:
- verification email
- reset password

Commande utile:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f app
```

Tu peux aussi filtrer visuellement dans les logs sur:
- Email verification token:
- Password reset token:

## 6. Comptes de test seedes en dev

- Admin:
```json
{
  "email": "admin@battle.com",
  "password": "Admin123!"
}
```
- User1:
```json
{
  "email": "player1@battle.com",
  "password": "Player123!"
}
```

- User2:
```json
{
  "email": "player2@battle.com",
  "password": "Player123!"
}
```
- User (banni):
```json
{
  "email": "banned@battle.com",
  "password": "Player123!"
}
```

## 7. Procedure rapide avant demo

1. Lancer la stack dev.
2. Ouvrir Swagger.
3. Faire login admin et login user pour recuperer les JWT.
4. Cliquer sur Authorize dans Swagger et coller un token selon le test.

## 8. Checklist de tests manuels route par route

Legende:
- Public: pas de token
- Auth: token utilisateur connecte
- Admin: token admin requis

### Auth

1. POST /auth/register (Public)

Payload exemple:

```json
{
  "username": "test",
  "email": "test@test.test",
  "password": "password123"
}
```

Attendu:
- 201
- message de succes
- utilisateur cree non verifie
- token de reset dans les logs

2. GET /auth/verify-email?token=... (Public)

   Attendu:
   - 200
   - email verifie


3. POST /auth/login (Public)

Payload admin:

```json
{
  "email": "admin@battle.com",
  "password": "Admin123!"
}
```

Payload user:

```json
{
  "email": "player1@battle.com",
  "password": "Player123!"
}
```

Payload user banni:

```json
{
  "email": "banned@battle.com",
  "password": "Player123!"
}
```

Attendu:
- 201
- accessToken retourne
- 403 pour le user banni

4. POST /auth/forgot-password (Public)

```json
{
  "email": "test@test.test"
}
```

Attendu:
- 201
- message generique
- token de reset dans les logs docker

5. POST /auth/reset-password (Public)

```json
{
  "token": "xxxxx",
  "newPassword": "newPassword123"
}
```

Attendu:
- 201
- mot de passe change

Cas d erreur a montrer:
- token invalide ou expire => 400

### Games

1. GET /games (Public)

Attendu:
- 200
- liste des jeux

2. GET /games/{name} (Public)

Attendu:
- 200 si existe
- 404 sinon

Note:
- encoder le nom si espaces, ex Street%20Fighter%206

3. POST /games (Admin)

```json
{
  "name": "The King of Fighters XV",
  "publisher": "SNK",
  "releaseDate": "2022-02-17",
  "genre": "Fighting"
}
```

Attendu:
- 201 en admin
- 403 avec token user

4. PATCH /games/{name} (Admin)

```json
{
  "publisher": "SNK Corporation"
}
```

Attendu:
- 200 en admin

5. DELETE /games/{name} (Admin)

Attendu:
- 200
- message Game deleted successfully

### Players

1. GET /players (Public ou Auth)

Attendu:
- sans token: profils publics uniquement
- avec token admin: profils prives

2. GET /players/{username} (Public ou Auth)

Attendu:
- public: profil public
- admin: profil prive

3. GET /players/{username}/stats (Public ou Auth)

Attendu:
- 200
- totalMatches, wins, losses, winRate, history

4. GET /players/me (Auth)

Attendu:
- 200
- profil du compte connecte

5. GET /players/me/stats (Auth)

Attendu:
- 200
- stats du compte connecte

6. DELETE /players/me (Auth)

Attendu:
- 200
- compte supprime

7. PATCH /players/admin/{id}/ban (Admin)

```json
{
  "banned": true
}
```

Attendu:
- 200
- utilisateur banni

Puis tester login du compte banni:
- POST /auth/login => 403

8. DELETE /players/admin/{id} (Admin)

Attendu:
- 200
- utilisateur supprime

### Tournaments

1. GET /tournaments (Admin)

Attendu:
- 200 en admin
- 403 en user

2. GET /tournaments/{id} (Admin)

Attendu:
- 200 en admin
- 404 si inexistant

3. POST /tournaments (Admin)

```json
{
  "name": "Spring Clash 2026",
  "description": "Tournoi de printemps",
  "startDate": "2026-05-01",
  "endDate": "2026-05-15",
  "maxParticipants": 16,
  "status": "upcoming"
}
```

Attendu:
- 201

4. PATCH /tournaments/{id} (Admin)

```json
{
  "status": "ongoing"
}
```

Attendu:
- 200

5. DELETE /tournaments/{id} (Admin)

Attendu:
- 200

6. POST /tournaments/{id}/join (Auth)

Attendu:
- 201 ou 200 selon cas
- impossible sans token (401)
- impossible si user banni (403)
- impossible si tournoi plein (400)

### Matches

Toutes les routes matches sont Admin.

1. POST /matches

```json
{
  "tournamentId": "TOURNAMENT_UUID_OPTIONNEL",
  "playerOneId": "PLAYER_ONE_UUID",
  "playerTwoId": "PLAYER_TWO_UUID",
  "winnerId": "PLAYER_ONE_UUID",
  "score": "2-1",
  "playedAt": "2026-06-01T20:00:00.000Z",
  "status": "finished"
}
```

Attendu:
- 201 en admin
- 403 en user

2. GET /matches

Attendu:
- 200

3. GET /matches/{id}

Attendu:
- 200
- 404 si inexistant

4. PATCH /matches/{id}

```json
{
  "score": "3-2"
}
```

Attendu:
- 200

5. DELETE /matches/{id}

Attendu:
- 200

## 9. Jeu de verification final (demo rapide)

Ordre conseille:

1. Login admin et user.
2. Creer un tournoi (admin).
3. Join tournoi avec user.
4. Creer un match (admin) entre player1 et player2 avec winner.
5. Verifier /players/player1/stats et /players/player2/stats.
6. Bannir player2.
7. Montrer que player2 ne peut plus se connecter.

## 10. Tests automatises

En local hors Docker:

```bash
pnpm test -- --runInBand
pnpm run test:all
pnpm run test:routes
pnpm run test:services
pnpm run test:seed
pnpm build
```
