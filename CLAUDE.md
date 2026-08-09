# CLAUDE.md — Mindway

Contexte permanent pour Claude Code. Lis ce fichier avant toute modification.

## Produit

Mindway est un **système cognitif quotidien anti-procrastination**, pas une to-do list ni un tracker : vider l'esprit → choisir UNE priorité (MIT) → construire une journée tenable → agir → apprendre. Priorités du système : qualité des décisions, discipline, robustesse psychologique, antifragilité. Jamais de culpabilisation, jamais de pression, jamais de correction silencieuse à la place de l'utilisateur.

## État du code

- **`index.html` = toute l'app** (~427 Ko dont ~246 Ko d'images WebP en data-URI). HTML/CSS/JS vanilla, zéro dépendance, zéro framework, un seul fichier. Ça reste ainsi tant qu'on est en phase web.
- Design system : tokens sémantiques (`--canvas`, `--surface-*`, `--text-*`, `--shadow-*`, `--accent`…) avec alias de compatibilité (`--bg`, `--s1`, `--t1`, `--gold`, `--e1`…) pointant dessus. **Clair = thème maître**, sombre = transposition (base « Obsidian » #0C0C0E). `--warm` est réservé à 4 moments : MIT accomplie, étoile/constellation, anneau bilan gagnant, dépassement de session — nulle part ailleurs.
- Matériaux : verre fin (capsules topbar + pilule tabbar flottante), verre régulier (cartes secondaires, sheets), pierre dépolie translucide sans blur (cartes de contenu, hero), mat (micros).
- Ambiance : couche `.at-img` (4 paysages générés : montagnes/dunes/nuages/cosmos en data-URI, sélection par moment via classes `u-*` sur `#phone`), scènes SVG en fallback dessous, brume/voile/poussière/vignette/grain par-dessus. Intro = toujours montagnes ; clôture = toujours cosmos ; Focus estompe. Sombre dérivé par `filter` (jamais d'invert). États : `t-dawn/day/dusk/night`, `u-*`, `amb-focus/won/closed`, `intro-on` — tous posés par `setAmb()`.
- Ouverture : overlay `#intro` à chaque lancement, CTA contextuel (Clarifier / Continuer / Reprendre ma priorité / Voir mon bilan), citation aléatoire par session (`qIntro`, anti-répétition via `settings.lastQ`).
- Citations : 197 en stock (176 tirables, 142 auteurs), **21 signées « Mindway » exclues de tous les tirages** (`QA`). **Toute attribution est vérifiée contre une source primaire avant intégration** — une citation inventée, mal attribuée ou seulement relayée par son auteur est inacceptable. Une attribution contestée se retire, elle ne se discute pas (cas Bashō, qui citait Kūkai). Les campagnes v3.11–v3.13 ont élargi vers la littérature mondiale, les sciences humaines, l'Amérique latine, l'Afrique, l'Asie, l'Europe de l'Est, les arts, la montagne, et rééquilibré la place des femmes (7 → 26 autrices). Ids = strings (`"q62"`). Contextes par catégorie (`Q_CTX`). Focus/bilan seedés par jour (`qPick`), validation aléatoire (`qValid`, ≤100 car., scène `#vwin`).

## Modèle de données — NE JAMAIS CASSER

localStorage `mindway_v2`, fallback mémoire si indisponible.
- `D.days[iso]` : `{mit, tasks[], quick[], mindset{clarte,energie,charge,elan,ctx[],note}, timer, plan, ritualsDone[], review, off, startedHour}` — `mindset` vaut `null` après un chemin express (aucune donnée inventée) ; `charge`/`elan` sont additifs et absents des journées d'avant.
- tâche : `{id,title,est,imp:0-3,urg:0-3,at|null,remind,done,spent}` (quick sans imp/urg)
- `D.rituals[]` (max 3) : `{id,title,time|null,days[1-7],remind, est?,imp?,urg?,from?}` (champs hérités de l'ancrage tâche→rituel — `saveRitual` doit les préserver via spread)
- `D.backlog[]` : `{id,title,est,imp,urg,when:'tomorrow'|'later',from}`
- `D.settings{theme,demo,lastQ,stopAtEnd,seenSystem}` — défaut theme `'light'`, un choix existant est respecté. `stopAtEnd` (défaut `true` par absence, lu via `stopAtEnd()`) : le chrono s'arrête au temps prévu. `seenSystem` : l'écran « Le système » a déjà été proposé.
- `timer.stopped` (bool) : session gelée à l'échéance (`acc = planned×60000`, `paused:true`). `timer.alarmed` : l'alerte de fin a déjà été émise — jamais deux fois pour la même session.
- `review.edited` (bool, optionnel) : jour corrigé après clôture — posé/retiré par comparaison avec l'état d'ouverture (`S.rcSnap`), jamais à l'aveugle.
- `plan.tried` / `plan.helped` (entiers, optionnels) : boucle d'apprentissage If-Then, sur le plan du jour **et** sur l'entrée correspondante de `D.plans`.
- Règles : champs additifs uniquement, defaults posés par `normalize()` (appelé par `load()` **et** après tout remplacement de `D`), import V1 et export/import JSON fonctionnels, **aucune réinitialisation, jamais**.

### Clés de stockage et filets

| Clé | Rôle |
|---|---|
| `mindway_v2` | données vivantes |
| `mindway_v2_bak` | sauvegarde de secours — écrite au 1er `save()` du jour, à la clôture, aux imports, à une correction et à la sortie de démo ; **jamais en mode démo** |
| `mindway_v2_realbackup` | copie des vraies données pendant le mode démo (écrite par `demoOn`, consommée par `demoOff`) |
| `mindway_v2_corrupt` | copie brute d'un contenu illisible, conservée avant toute restauration |

Garde-fous à ne pas casser : `store.get` sert la copie mémoire quand elle existe (un `setItem` refusé sur quota ne doit jamais faire lire une valeur périmée) ; `demoOn` refuse de basculer si la copie n'est pas réellement persistée ; `demoOff` sans sauvegarde exploitable garde les données en place au lieu de repartir de zéro ; `importJSON` sauvegarde **avant** de remplacer, normalise l'objet importé et neutralise `settings.demo` ; `load()` rejette un JSON valide mais non-objet (`null`, nombre) et restaure la sauvegarde de secours.

## Logique métier (invariants)

- Classification : 1 MIT (durée libre) / 3 secondaires (**≤45 min conseillé, pas imposé**) / 5 micros ≤10 min ; le reste → backlog. Swipe = navigation, **jamais** destructif. Au-delà de 45 min → recommandation avec choix explicites (garder / MIT / reporter / découper), jamais de blocage muet ni de correction silencieuse. Les deux variantes (flow et journée) offrent les mêmes issues ; quand les 3 secondaires sont prises, « garder » disparaît et la limite est annoncée. Le plafond dur reste le budget de 360 min noté par le score d'organisation.
- Score /100 : 60 MIT + 15 organisation (budget planifié ≤360 min) + 15 secondaires + 10 estimation. Gagnante ≥70. `computeParts` est la source de vérité — le mode démo (seed `20260842`, ~61 % gagnantes) doit toujours re-calculer identique.
- Insights verrouillés < 7 jours clôturés ; 8 règles actives (charge planifiée, durée MIT, matin, clarté, calibration d'estimation `est` vs `spent`, backlog qui traîne, charge mentale, élan). Toute règle doit tolérer une journée sans `mindset`. **Ce verrou J7 est le futur point de conversion Plus — ne pas le retirer.**
- Édition en journée : ajout (classé par les règles), report demain/plus tard (jamais si session en cours), remplacement de la MIT (jamais de suppression sèche — swap secondaire ou backlog).
- Correction d'un jour passé : cocher/décocher + note depuis le récap, score recalculé par `computeParts`. Le commit est unique (bouton « Terminé » **et** fermeture par le fond) : mêmes écritures, même rendu, même toast. Revenir à l'état de départ n'est pas une correction — pas de flag, pas de toast.
- Apprentissage If-Then : après « Je m'y tiens », un tap répond « Ça a aidé / Pas vraiment / Passer ». La stat affichée est cumulée depuis `D.plans`, jamais recalculée à la journée.
- Fin de session : à l'échéance, le chrono se **gèle** au temps prévu (réglable, actif par défaut) — son, vibration et notification système. La tâche n'est **jamais** cochée à la place de l'utilisateur : « Terminé » ou « Continuer » (`resumeOver()` repart en dépassement). Réglage off = ancien comportement (dépassement continu), l'alerte est émise dans les deux cas. La notification est planifiée par `setTimeout` (`almTO`) pour survivre au throttling d'un onglet en arrière-plan ; elle est reprogrammée sur pause/reprise/boot et annulée à la fin ou à l'abandon.
- Chemin express : `startExpress()` — deux écrans (coller en vrac → structure proposée, rôles et durées ajustables au tap) au lieu des six du flow. Les plafonds 1/3/5 restent fermes, le surplus part au backlog, et **aucune calibration n'est inventée** : `mindset` reste `null`, `openMindset()` permet de l'ajouter après coup depuis la journée.
- Calibration : 4 dimensions (clarté, énergie, charge mentale, élan) + contextes + **note libre**, affichée sous les chips de la journée. `importV1` récupère `stress`→`charge` et `motivation`→`elan` — des données v1 qu'on croyait perdues.
- If-Then : le « Si » est éditable comme le « Alors », dans le flow.
- Pédagogie : `openSystem()` explique le système (priorité unique dont la durée n'entre pas en compte, impact/urgence qui orientent sans décider, 3 secondaires ≤45 min conseillé, 5 micros ≤10 min, pourquoi ces ordres de grandeur, rien n'est figé). Accessible depuis Réglages et l'état vide, proposé **une seule fois** au premier lancement (jamais en démo, jamais si des jours existent). Deux rappels courts dans le flow (étapes Choisir et Construire). Toute affirmation chiffrée de cet écran doit rester vérifiable contre `computeParts` — « la priorité pèse 60 points » et « sans elle aucune journée n'est gagnante » (40 au mieux, seuil 70).
- Notifications web : best-effort uniquement, l'UI ne promet jamais plus. La fiabilité = natif (P2).

## Méthode de validation OBLIGATOIRE (leçons de la session)

1. **Syntaxe** : extraire le JS (`awk '/<script>/{f=1;next}/<\/script>/{f=0}f'`) → `node --check`.
2. **Boot réel** : jsdom (`runScripts:'dangerously'`, polyfill `matchMedia` en `beforeParse`, URL Pages) → zéro erreur, `#inCTA` rempli, classes sur `#phone`. Le stub maison ment (getElementById magique) — **seul jsdom valide le boot**.
3. **Régression métier** : re-calculer `computeParts` sur toute la démo (0 écart), `computeInsights` (4 règles), un flow complet, timer start/finish, ancrage, report, swap MIT, correction d'un jour passé, corruption/restauration.
   Harness de référence : `boot-test.js` (71 asserts, jsdom). Pour simuler une **nouvelle session** (corruption, quota), vider `store.mem` avant `load()` — sinon la copie mémoire masque la panne et le test passe à tort.
4. Édits par script avec **assert sur chaque remplacement** (`str.replace` silencieux = bug garanti).
5. Pièges connus : aperçu Fichiers iOS = JS désactivé (noscript + sentinelle en place) ; banding OLED sur dégradés sombres ; budget backdrop-filter ≤4 simultanés ; inputs ≥16 px sinon zoom Safari ; `\uXXXX` interprété seulement en JS, jamais en HTML statique.

## P1 — livré (7 août 2026)

Les deux différés sont faits, plus trois correctifs validés et une série de défauts trouvés en revue adversariale.

1. **Règle des 45 min → recommandation** ✅ — `flowSecOpts`/`flowKeepSec` (flow) et `dayTaskOpts`/`keepDaySec`/`dayTaskToMit`/`pendToBacklog`/`reopenAddTask` (journée). Un choix « garder » >45 min survit aux retours dans le flow (`S.flow.keptLong`, respecté par `prepSec`).
2. **Scène de validation** ✅ — 9 s (3,4 s à l'origine, passée à 6,5 s puis allongée à l'usage), tap-pour-fermer conservé, et l'overlay ne s'ouvre plus pendant la checklist du bilan.
3. **Correction d'un jour passé** ✅ — voir Logique métier.
4. **Sauvegarde de secours** ✅ — voir Modèle de données.
5. **Boucle d'apprentissage If-Then** ✅ — `deriveFb`, stats cumulées.

Défauts corrigés au passage (dont un préexistant) : les boutons « Proposer demain / Une autre fois » du sheet « limites atteintes » étaient **morts** (`JSON.stringify` d'un titre coupait l'attribut `onclick` au premier guillemet) ; `importJSON` d'un export fait en démo menait à un effacement total en deux taps ; `importJSON` écrasait la sauvegarde de secours avec le fichier entrant ; `store.get` ignorait la copie mémoire après un échec de quota.

### Reste ouvert (non fait, à décider)

- Aucune UI ne permet de récupérer `mindway_v2_corrupt` (accessible seulement via les DevTools).
- Les ids interpolés dans les `onclick` sont échappés (`jsq`) pour les nouveaux handlers uniquement ; les handlers historiques gardent le pattern d'origine.

## Roadmap

- **P2 — Capacitor iOS** : wrap du fichier tel quel ; `LocalNotifications` branchées sur la logique de `scheduleWebNotifs` (heures repères, rituels) ; haptics via les points d'appel de `buzz()` ; icône/splash depuis `icon-512` ; vérif safe-areas ; TestFlight en usage perso avant tout le reste.
- **P3 — Monétisation** : gratuit à vie = boucle quotidienne complète. **Mindway Plus** (StoreKit 2, abonnement léger ou lifetime) : insights avancés + historique long, constellation étendue, ambiances supplémentaires, sync iCloud, Watch. Porte d'entrée : au déverrouillage des insights (J7), jamais de paywall d'accueil.
- **P4 — Watch (compagnon, pas portage)** : chrono MIT, coche rituels, complication « priorité du jour ». SwiftUI. Après stabilisation iOS.

## Style de travail attendu

Audit → plan court → implémentation → validation, à chaque fois. MVP robustes, pas de sur-ingénierie, pas de dashboards gadgets. Trade-offs explicites, limites réelles dites franchement, jamais de complaisance. Les régressions de données sont inacceptables ; les régressions visuelles se jugent sur iPhone réel (demander une capture plutôt que deviner).
