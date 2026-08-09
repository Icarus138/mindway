# Tests — Mindway

Harness de non-régression. Aucune dépendance dans le dépôt : jsdom est installé à la demande.

```bash
cd test && npm install && npm test
```

147 asserts couvrant : boot sans erreur, recalcul du scoring sur toute la démo (0 écart),
insights, flow complet, chemin express, chrono et alarme de fin de session, dérive If-Then,
correction d'un jour passé, corruption et restauration des données, intégrité du stock de citations.

## Deux pièges qui ont déjà fait passer des tests à tort

1. **La copie mémoire de `store.mem` masque les corruptions.** Pour simuler une nouvelle
   session (JSON illisible, quota dépassé), vider `store.mem` avant `load()`.
2. **Les assertions synchrones ratent ce que `requestAnimationFrame` défait.** Après une
   action qui appelle `render()`, appeler `paintTimer()` explicitement avant d'asserter.

Un test qui passe du premier coup sur un chemin asynchrone ou un état de secours mérite
d'être vérifié contre la version buguée avant d'être cru.
