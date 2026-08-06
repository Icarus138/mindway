# Mindway — V2

**Clarifie ta journée. Réalise l'essentiel.** Mindway n'est pas une to-do list : c'est un système cognitif quotidien — vider l'esprit, choisir une seule priorité, construire une journée tenable, agir, apprendre. Une priorité. Une journée gagnante.

## Utiliser

L'app est un **fichier unique autonome** (`index.html`) : HTML/CSS/JS vanilla, zéro dépendance, zéro serveur.

- **Sur iPhone** : ouvrir l'URL GitHub Pages dans **Safari** → Partager → *Sur l'écran d'accueil*. L'app s'installe avec son icône, plein écran.
- ⚠️ Ne pas ouvrir le fichier via l'aperçu de l'app **Fichiers** : iOS y désactive JavaScript (écran explicatif intégré le cas échéant).
- Les données vivent en **localStorage** local à l'appareil. Export/Import JSON intégrés, import Mindway V1 pris en charge, aucune migration destructive.

## V2 — ce qui est dedans

Flow guidé (Vider → Comprendre → Choisir → Construire → Calibrer → Si-Alors) · brain dump illimité · impact+urgence · 1 MIT / 3 secondaires (≤45 min) / 5 micros (≤10 min) · presets de durée + roulette · heures repères et rappels facultatifs · chrono intégré à la carte MIT (états attente/session/pause/dépassement/accompli) · sessions secondaires et micros en carrousels · rituels (3 ancres) + **ancrage d'une tâche en rituel** (hérite impact/urgence/heure) · ajout et report de tâches en cours de journée · remplacement de la priorité · backlog · score /100 · journées gagnantes, étoiles, constellation · insights (verrou 7 jours) · 102 citations, tirage d'ouverture aléatoire par session, scène de validation · 4 paysages générés (montagnes/dunes/nuages/cosmos) selon le moment · mode clair maître + sombre transposé · démo · notifications web best-effort (fiabilité réservée au natif).

## Stack & principes

Un fichier. Vanilla. Tokens sémantiques (`--canvas`, `--surface-*`, `--shadow-*`…), matériaux (verre/pierre/mat/hero), lumière commune haut-gauche, `prefers-reduced-motion` respecté. Antifragile : rien ne casse les données existantes, tout est observable, testé hors navigateur (harness) + DOM réel (jsdom).

## Limites connues (honnêtes)

- Notifications fiables (app fermée, écran verrouillé) : **impossibles en PWA iOS** → version native.
- Haptics réels : natif uniquement.
- localStorage : non persistant en navigation privée Safari.

## Roadmap

**P1 — Usage réel (maintenant).** Vivre avec la V2 quelques jours, ajuster : règle des 45 min en recommandation, durée de la scène de citation, finitions visuelles.

**P2 — Natif iOS (Capacitor).** Wrap de ce même fichier : LocalNotifications contextuelles (heures repères, rituels), haptics, icône/splash, safe-areas natives. StoreKit en préparation. → TestFlight → App Store.

**P3 — Monétisation (freemium aligné).** Gratuit à vie : la boucle quotidienne complète (flow, MIT, chrono, score) — c'est elle qui crée l'habitude, la paywaller tuerait le produit. **Mindway Plus** (abonnement léger ou lifetime) : insights comportementaux avancés + historique long, constellation étendue, ambiances/paysages supplémentaires, sync iCloud, app Watch. Point de conversion organique : le **déverrouillage des insights à J7** — le produit crée lui-même le moment où la valeur payante devient visible.

**P4 — Apple Watch (compagnon, pas portage).** Le chrono de la MIT au poignet, coche des rituels, une complication « priorité du jour ». SwiftUI.
