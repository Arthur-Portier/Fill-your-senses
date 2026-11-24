# Feel Your Senses

Ton journal personnel de **films**, **séries**, **jeux vidéo** et **livres** : tu ajoutes tout ce que tu as vu ou joué, tu donnes une note sur 10 et tu écris ton commentaire.

## Fonctionnalités

- 🎬 📺 🎮 📚 Quatre catégories : films, séries, jeux vidéo, livres
- ★ Note de 1 à 10, statut (vu / en cours / envie / abandonné), coup de cœur ♥
- 📥 Import direct d'un export **Sequel** (menu ⋯ → « Importer depuis Sequel », le `.zip` tel quel) : films, séries (avec la progression en épisodes), jeux, livres, notes /5 converties en /10, commentaires et collections. Réimporter ne crée pas de doublons et n'écrase pas ce que tu as modifié dans l'app.
- ✍️ Un commentaire libre pour chaque œuvre
- 🔎 Recherche dans les titres et les commentaires, filtres par catégorie et par statut, tris (récents, mieux notés, A→Z, année)
- 📊 Statistiques : nombre d'œuvres par catégorie, note moyenne
- 🖼️ Affiche optionnelle (URL d'image), sinon une vignette colorée
- 💾 Données enregistrées dans ton navigateur (localStorage), avec export et import en JSON pour les sauvegarder ou les passer d'un appareil à l'autre
- 🌗 Thème clair / sombre automatique, adapté au mobile

## Lancer l'app

Aucune installation : ouvre `index.html` dans ton navigateur.

Pour l'avoir en ligne, active **GitHub Pages** sur le dépôt (Settings → Pages → Branch `main`, dossier `/root`).

## Fichiers

- `index.html` : la structure de la page
- `style.css` : le style
- `app.js` : la logique (ajout, modification, suppression, filtres, sauvegarde)
