# Mindway

> Système cognitif anti-procrastination — capture spontanée, priorité du jour, état d'esprit, plans If-Then.
> 100% local, sans backend, sans tracking.

[**▶ Ouvrir Mindway**](https://icarus138.github.io/mindway/)

---

## Philosophie

Mindway n'est pas un to-do list. C'est un **système décisionnel et d'analyse comportementale** qui aide à :

- Capturer rapidement ce qui te traverse l'esprit
- Choisir **une seule** priorité du jour qui rendrait la journée gagnante
- Te calibrer avant d'agir (état d'esprit, contexte)
- Préparer des plans **If-Then** pour revenir à l'action en cas de dérive
- Lire honnêtement tes patterns cognitifs sur le temps long

L'objectif n'est pas la productivité maximale, mais la **clarté décisionnelle** et la résilience antifragile.

---

## Fonctionnalités

- **Jour** — priorité du jour (MIT), 3 tâches max (45 min), 5 actions rapides (10 min), état d'esprit
- **Plans** — bibliothèque If-Then : *« Si X arrive, alors je fais Y »*
- **Historique** — calendrier 30 jours, édition de n'importe quel jour
- **Patterns** — carte cognitive, heatmap d'évolution mentale, contextes associés, citations adaptatives

### Guided Brain Dump

Au premier ouvrage de la journée, un flow guidé propose en 4 étapes :

1. **Capture spontanée** — vide ce que tu veux faire, on classera ensuite
2. **Clarification** — impact / urgence / temps estimé par tâche
3. **Choix de la MIT** — parmi les tâches triées, tu choisis l'essentielle
4. **État d'esprit** — calibration métriques + contexte rapide
5. (Conditionnel) **Plan If-Then** — si friction détectée, suggestion contextuelle

---

## Stockage local

Les données utilisateur sont stockées **localement dans le navigateur** via localStorage.
Chaque utilisateur garde ses propres données sur son appareil. **Aucun backend n'est utilisé pour l'instant.**

Clés utilisées :
- `mindway_v1` — journées (jours, tâches, mood, tags, notes)
- `mindway_it_v1` — bibliothèque If-Then

Conséquences :
- Pas de synchronisation entre appareils
- Données effacées si tu vides le cache navigateur
- Pas de partage, pas de connexion, pas de tracking
- 100% offline après le premier chargement

---

## Stack

- **HTML/CSS/JS vanilla** (un seul fichier `index.html`)
- **localStorage** pour la persistance
- **PWA-ready** (manifest, theme-color, mobile-first)
- DM Mono · palette monochrome avec accent ambre pour les frictions

Aucune dépendance npm. Aucun build. Tu peux ouvrir `index.html` directement dans un navigateur.

---

## Installation locale

```bash
git clone https://github.com/Icarus138/mindway.git
cd mindway
# ouvrir index.html dans ton navigateur, ou :
python3 -m http.server 8000
# puis http://localhost:8000
```

Pour l'installer comme app mobile (iOS Safari ou Chrome Android) :
1. Ouvre l'URL Pages dans le navigateur
2. *Partager → Sur l'écran d'accueil* (iOS) ou *Installer l'application* (Android)
3. Mindway s'ouvre comme une app standalone

---

## Roadmap (idées)

- Export / Import JSON (backup manuel)
- Sortie de mode démo (transition vers vraies données)
- Activation If-Then en temps réel sur Today quand friction détectée
- Mode "Reprise" après une journée vide

---

## Licence

Personnel — pas encore de licence open source attribuée. Code privé partagé en lecture.

---

*Mindway · construit pour ralentir au bon moment, pas pour pousser plus fort.*
