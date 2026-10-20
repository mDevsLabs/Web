// Point d'entrée de l'APPLICATION AUTONOME.
//
// Elle possède le document : le jeu est monté sur `<body>` (son conteneur) et
// sa racine est `<html>` (le document entier, sur lequel la feuille de style
// d'origine s'applique telle quelle).
//
// L'hôte mAI fait EXACTEMENT LA MÊME CHOSE, avec un conteneur `.blackline-root`
// qui lui sert de racine. Les deux pointent donc sur le même code de
// montage (`src/entry.ts`) : il n'y a pas deux montages à diverger.
//
// Ce fichier ne fait que composer le HTML de la page autonome. La feuille de
// style et le contrat d'intégration sont importés par `src/mount.ts`, qui
// est le point d'entrée PUBLIC du build.

import './mount.ts';
