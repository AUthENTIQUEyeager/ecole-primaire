# École Primaire Privée Les Étoiles — Gestion scolaire

PWA de gestion scolaire offline-first pour une école primaire privée au Burkina Faso.
Next.js 14 (App Router) · Turso (libSQL) · Upstash Redis · NextAuth v5 · Dexie.js · next-pwa.

## Démarrage

```bash
npm install
cp .env.example .env.local   # renseigner Turso + Upstash + NextAuth
npm run db:migrate           # crée les tables dans Turso
npm run db:seed              # données de démonstration (30 élèves, etc.)
npm run dev
```

Comptes de démonstration créés par le seed :
- **Admin** : `admin@etoiles-bobo.bf` / `Admin2024!`
- **Fondatrice** : `fondatrice@etoiles-bobo.bf` / `Fond2024!`

## Ce qui est implémenté

**Architecture complète** : schéma Turso (13 tables + index), auth NextAuth v5
(admin/fondateur), middleware de séparation des rôles, cache Upstash pour les
agrégations, PWA (manifest + Workbox via next-pwa), synchronisation offline
(file IndexedDB/Dexie + rejeu FIFO à la reconnexion).

**Les 3 actions quotidiennes prioritaires**, optimisées à ≤2 clics :
1. Appel de classe / absences → `classes/[id]` (grille cocher présent/absent/retard)
2. Versement de paiement → modal accessible depuis `paiements` et la fiche élève,
   avec répartition automatique multi-tranches et reçu PDF
3. Consultation du statut de paiement d'un élève → recherche instantanée dans
   `élèves` et `paiements`, badges de couleur

**Modules complets** : tableau de bord, élèves (liste/ajout/fiche à 4 onglets),
classes (appel), notes (grille de saisie + bulletin PDF avec moyenne/rang),
absences (historique + stats), paiements (vue globale + rappels WhatsApp),
documents (reçu, bulletin, billet, convocation, carte scolaire — tous en PDF
via @react-pdf/renderer), annonces, salaires, dépenses, configuration,
dashboard fondateur (lecture seule).

**Toutes les routes API** listées dans le cahier des charges sont présentes
et appliquent la logique métier exacte (répartition des versements avec
débordement de tranche, calcul du statut de paiement, moyennes/rangs,
génération matricule/reçu, journal d'activité).

## Fonctionnalités ajoutées après la première livraison

- **Matières & coefficients modifiables** depuis Configuration (ajout, édition, suppression)
- **Logo de l'école** uploadable dans Configuration — apparaît automatiquement sur tous les
  documents PDF (reçu, bulletin, billet, carte, convocation)
- **Bouton Imprimer** à côté de Télécharger sur tous les documents PDF (composant partagé
  `components/documents/PDFActions.tsx`, utilise `usePDF` de react-pdf)
- **Photo élève facultative** (upload dans le formulaire, affichée sur la fiche et la carte scolaire)
- **Modification d'un élève** (bouton "Modifier" sur sa fiche, même formulaire que l'ajout)
- **Modification de l'enseignant principal d'une classe** (crayon sur la carte classe)
- **Modification d'un enseignant dans Salaires** (nom, matière, montant)
- **Versement : choix explicite de la tranche** avant de saisir le montant (le débordement
  vers les tranches suivantes reste automatique si le montant dépasse le reste dû)
- **Montant restant affiché** dans les listes Élèves et Paiements
- **Rang réel dans le bulletin** (calculé à partir des moyennes de toute la classe, plus un
  placeholder) + **appréciation générale éditable** avant génération du PDF

Aucune migration de base de données n'est nécessaire pour ces ajouts — les nouveaux champs
(logo, photo) utilisent des colonnes/texte déjà prévus dans le schéma initial.

## Correctifs offline-first (après retour utilisateur)

- **Crash `crypto.randomUUID is not a function` en mode hors ligne** — corrigé :
  `lib/sync/syncManager.ts` utilisait l'import Node.js `crypto`, qui ne fonctionne
  pas dans le navigateur. Remplacé par l'API Web Crypto native (`crypto.randomUUID()`).
- **Actions non reflétées sans connexion** — la plupart des écrans dépendaient d'un
  `router.refresh()` ou `window.location.reload()` après chaque action, ce qui
  nécessite le réseau et ne fonctionne pas hors ligne. Tous les écrans suivants
  tiennent maintenant leur propre état local et l'appliquent en optimiste, avant
  même la réponse du serveur : Élèves (ajout/édition), Paiements (versement,
  recalcul réel des tranches via `repartirVersement`), Matières, Annonces,
  Dépenses (avec totaux du mois), Salaires, Classes (enseignant principal), Notes.
- **`mutate()` distingue maintenant clairement** : une vraie coupure réseau (mise
  en file d'attente IndexedDB, synchronisée au retour de connexion) d'un refus du
  serveur (erreur affichée immédiatement, jamais mise en file silencieusement).
- **Nouvelle route `/api/paiements`** + mise à jour de `useOfflineData` : toutes
  les tranches de paiement de tous les élèves sont mises en cache local au
  chargement, pour pouvoir enregistrer un versement hors ligne même pour un
  élève dont la fiche n'a jamais été ouverte.
- Chaque élément ajouté/modifié hors connexion affiche un badge **"en attente"**
  jusqu'à sa synchronisation.

### Limite connue

Les pages listées (dashboard, élèves, classes, etc.) sont des Server Components
qui lisent Turso directement — elles ne se re-rendent donc pas depuis le cache
local hors ligne au chargement initial d'une page (il faut avoir déjà chargé la
page en ligne au moins une fois dans la session). Une fois la page chargée,
en revanche, toutes les actions qu'on y fait restent utilisables et visibles
sans connexion grâce aux correctifs ci-dessus.

## Ce qui reste à faire avant la mise en production

- **Connecter de vrais identifiants Turso/Upstash** — le code compile et
  `npm run build` passe intégralement (vérifié dans cet environnement avec
  des identifiants factices ; toutes les pages qui lisent la base sont
  marquées `force-dynamic` pour ne pas exiger de connexion DB au moment du
  build). Il faut créer un projet Turso et un projet Upstash réels, puis
  lancer `db:migrate` et `db:seed`.
- **Rang réel dans le bulletin** : le calcul `calculerRangs()` existe dans
  `lib/utils/notes.ts` mais n'est pas encore branché dans `DocumentsView`
  (actuellement rang = 1/1 en placeholder) — il faut charger les moyennes
  de toute la classe pour calculer le rang réel.
- **CSV import** des élèves (mentionné dans le cahier des charges) — non
  implémenté.
- **Icônes PWA** : des icônes de remplacement simples sont fournies dans
  `public/icons/` — à remplacer par le vrai logo de l'école.
- **Photo élève** : le champ `photo_url` existe en base mais il n'y a pas
  encore d'upload d'image dans le formulaire.
- Un test complet du flux offline→online (couper le réseau, enregistrer une
  absence, revenir en ligne, vérifier la synchronisation) doit être fait
  manuellement dans un vrai navigateur — non testable dans ce sandbox.

## Structure

Voir l'arborescence `app/`, `components/`, `lib/`, `hooks/`, `db/` — elle suit
exactement la structure de fichiers du cahier des charges.
