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

## Architecture locale-first (refonte connectivité)

L'app a été repensée pour fonctionner comme une application locale : **IndexedDB
(Dexie) est la source de vérité pour l'interface admin**, Turso ne sert plus
qu'à la synchronisation en arrière-plan. Avant cette refonte, chaque page admin
était un Server Component qui interrogeait Turso à chaque navigation — sur une
connexion faible ou absente (le cas de la majorité des écoles), cela rendait
l'app lente et parfois inutilisable hors ligne.

**Ce qui a changé :**

- **13 tables IndexedDB** (`lib/sync/indexedDB.ts`) reflètent tout le schéma
  Turso (avant : 5 tables seulement — absences, notes, versements, dépenses,
  salaires et annonces n'étaient pas mises en cache).
- **Toutes les pages `app/admin/**`** sont désormais des Client Components qui
  lisent Dexie via `useLiveQuery` (`dexie-react-hooks`) — plus aucune requête
  réseau au chargement d'une page ou à un clic. Le `npm run build` les marque
  toutes en statique (`○`), preuve qu'elles ne dépendent plus d'une connexion
  DB au rendu.
- **`lib/localdb/repo.ts`** centralise chaque écriture métier (élève, absence,
  versement, dépense, salaire, annonce, matière, configuration) : elle écrit
  d'abord dans Dexie (instantané, visible partout dans l'app immédiatement),
  puis pousse vers le serveur via `mutate()` (file d'attente si hors ligne).
- **`/api/sync/pull`** renvoie toutes les tables en un seul aller-retour réseau
  (plutôt que 10 requêtes séparées) ; **`hooks/useAutoSync.ts`** orchestre la
  reconnexion : vide d'abord la file d'attente (envoie ce qui est en attente),
  *puis* retélécharge les données fraîches (dans cet ordre, pour éviter de
  retélécharger avant que ses propres écritures soient arrivées).
- **IDs générés côté client** : les routes API (`eleves`, `matieres`,
  `depenses`, `salaires`, `annonces`, `absences`, `notes`, `versements`)
  acceptent désormais l'id généré localement, pour que l'enregistrement local
  et l'enregistrement serveur soient identiques dès la création — plus de
  doublon après resynchronisation.
- **Choix volontaire** : synchronisation complète (« full pull ») plutôt
  qu'incrémentale par horodatage — plus simple et plus robuste sur une
  connexion qui coupe en cours de route (pas d'état "à moitié synchronisé"),
  et largement suffisant pour le volume de données d'une école primaire.

Résultat : l'app s'ouvre et répond instantanément (lecture ET écriture),
connexion ou non — seul le tout premier chargement (avant d'avoir jamais été
en ligne) nécessite le réseau, pour peupler IndexedDB une première fois.

### Correctif : lien Vercel → localhost

`NEXTAUTH_URL` était figé sur `http://localhost:3000` dans les variables
d'environnement. Remplacé par `trustHost: true` (`lib/auth.config.ts`), qui
déduit l'URL depuis la requête — plus besoin de définir `NEXTAUTH_URL` sur
Vercel (et il ne faut surtout pas le faire, sous peine de reproduire le bug).

## Ce qui reste à faire avant la mise en production

- **Connecter de vrais identifiants Turso/Upstash** — le code compile et
  `npm run build` passe intégralement (vérifié dans cet environnement avec
  des identifiants factices). Il faut créer un projet Turso et un projet
  Upstash réels, puis lancer `db:migrate` et `db:seed`.
- **CSV import** des élèves (mentionné dans le cahier des charges) — non
  implémenté.
- **Icônes PWA** : des icônes de remplacement simples sont fournies dans
  `public/icons/` — à remplacer par le vrai logo de l'école.
- **Photo élève** : le champ `photo_url` existe en base et le formulaire
  d'upload est branché (`redimensionnerImage`), à valider avec de vraies photos.
- Un test complet du flux offline→online (couper le réseau, faire l'appel
  d'une classe et enregistrer un versement, revenir en ligne, vérifier la
  synchronisation) doit être fait manuellement dans un vrai navigateur — non
  testable dans ce sandbox.

## Structure

Voir l'arborescence `app/`, `components/`, `lib/`, `hooks/`, `db/` — elle suit
exactement la structure de fichiers du cahier des charges.
