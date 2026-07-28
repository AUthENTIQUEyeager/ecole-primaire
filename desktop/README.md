# École Primaire Les Étoiles — Application de bureau (admin)

Application de bureau (Windows/Mac) pour le personnel de l'école. Remplace le
PWA du navigateur : c'est un vrai logiciel installé, donc plus aucune des
fragilités des service workers (voir historique du projet web pour le détail
des bugs rencontrés). Elle fonctionne intégralement hors connexion et
synchronise automatiquement avec le serveur (déploiement Vercel du projet
`ecole-primaire`) dès qu'une connexion est disponible.

Le tableau de bord de la fondatrice reste sur le site web normal
(`ecole-primaire/app/fondateur`) — elle n'a pas besoin de cette application,
juste d'un navigateur.

## Architecture en un coup d'œil

- **Ce dossier** : l'interface (Next.js, exporté en fichiers statiques) +
  l'enveloppe Tauri (Rust) qui en fait un vrai `.exe`/`.dmg`.
- **Le serveur** (dossier `ecole-primaire/`, déployé sur Vercel) : base de
  données (Turso), API, et authentification. L'app de bureau lui parle
  uniquement par des appels réseau classiques (jamais de connexion directe à
  la base) — exactement comme le ferait un navigateur.
- **Données locales** : IndexedDB (via Dexie), identique à ce qui existait
  côté web — tout se lit et s'écrit localement en premier, la synchronisation
  vers le serveur se fait en arrière-plan.

## Obtenir les installeurs Windows (.msi) et Mac (.dmg)

Cet environnement de développement tourne sous Linux et ne peut pas produire
directement les binaires Windows/Mac. La solution mise en place : un pipeline
GitHub Actions (`.github/workflows/build-desktop.yml`) qui les construit pour
vous, gratuitement, à chaque déclenchement :

1. Poussez ce dossier sur un dépôt GitHub (peut être le même dépôt que
   `ecole-primaire/`, ou un dépôt séparé — peu importe).
2. Onglet **Actions** du dépôt → workflow **"Construire l'application de
   bureau"** → bouton **"Run workflow"**.
3. Attendez ~10-15 minutes. Une **Release brouillon** apparaît dans l'onglet
   **Releases** du dépôt, avec le `.msi` (Windows) et le `.dmg` (Mac) en
   pièces jointes.
4. Téléchargez, testez, puis publiez la Release quand vous êtes satisfait.

Vous pouvez relancer ce workflow à chaque nouvelle version du code.

## Configuration au premier lancement

Au premier lancement, l'écran de connexion demande :
1. **L'adresse du serveur** — l'URL Vercel du projet `ecole-primaire`
   (ex : `https://ecole-primaire-etoiles.vercel.app`). À saisir une seule fois.
2. **Email / mot de passe** — les identifiants admin habituels.

Une connexion internet n'est nécessaire que pour cette première connexion.
Ensuite, l'application s'ouvre et fonctionne normalement sans réseau, et se
synchronise toute seule dès qu'une connexion revient.

## Développement local (optionnel)

Nécessite Rust (via [rustup](https://rustup.rs)) et les dépendances système
Tauri pour votre OS (voir la
[documentation officielle](https://v2.tauri.app/start/prerequisites/)).

```bash
npm install
npm run tauri dev    # lance l'app en mode développement (rechargement à chaud)
npm run tauri build  # construit l'installeur pour VOTRE OS actuel uniquement
```

## Ce qui a changé par rapport au projet web

- Plus de service worker / PWA : l'installation du logiciel lui-même
  remplace ce rôle.
- Plus de NextAuth (sessions par cookie) : authentification par jeton
  (`Authorization: Bearer`), stocké localement — voir `lib/apiConfig.ts`.
  Le serveur (`ecole-primaire/lib/apiAuth.ts`) accepte les deux méthodes,
  donc le site web (fondatrice) continue de fonctionner sans changement.
- Les pages `/admin/eleves/[id]` et `/admin/classes/[id]` sont devenues
  `/admin/eleves/detail?id=...` et `/admin/classes/detail?id=...` : l'export
  statique Next.js ne peut pas générer de routes dynamiques dont les valeurs
  ne sont connues qu'à l'exécution.
- Tout le reste (composants, logique Dexie, calculs de paiement/notes) est
  identique au projet web.
