# Projet Lantern
---
- ~~Toujours changer le numéro de version lors d'un changement (app/index.html)~~ (obsolete)
- remplir le changelog
- La branche master git de l'URL lantern-vega PROD  http://lantern-vega.france.dubbing-brothers.com/app/#/  :  feature/vegaprod

## Auto deploy

Ce projet utilise le déploiement automatique de Gitlab.
Les ajout du `index.html` pour eviter les problèmes de cache sont maintenant gérés automatiquement.

Un `push` sur les branches ci-dessous déclenchera automatiquement un déploiement.


| Branch | Config file | target |
|--------|-------------|--------|
|develop|`app/js/config.preprod.js`|`10.0.1.28:/var/www/lantern/`|
|master|`app/js/config.prod.js`|`10.0.1.32:/var/www/lantern/`|