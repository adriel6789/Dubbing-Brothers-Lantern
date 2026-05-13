/*
 * Fichier à renommer en "config.js” et à éditer
 */

//URL vers l’API Centrale
var URL_API = "http://10.0.1.28/adriel-lee/restler/public/central-api";

//URL vers le serveur WebSocket (serveur Node.JS dédié)
var IP_SOCKET = "http://10.0.1.28:8080/";

// URL pour les rediréction vers users-manager(Saloon)
var SALOON_URL = "http://10.0.1.28/users-manager/";
var APP_CODE = 'bons-travaux-auto';

// Mettre à true si besoin de désactiver le login via Saloon utils pour le mode dev.
var LOGIN_WITHOUT_SALOON = true;

//Paramètres TMDB
var TMDB_URL = "https://api.themoviedb.org/3/";
var TMDB_API_KEY = "d83b02f7b4428e797eefa8ec1eebfafa";

//Variable pour les forms dynamiques
// var dynamicForm = [];
var Verwalter = ['benoit.saucles@dubbing-brothers.com','koceila.medjnoun@dubbing-brothers.com', 'pintilies@gmail.com', 'jessica.miles@dubbing-brothers.com'];
var superVerwalter = ['koceila.medjnoun@dubbing-brothers.com', 'pintilies@gmail.com'];

// Désactivation des notifications
var DISABLE_NOTIFICATIONS = false;

// intervals in synchro, see suiviProd
let intervals_config = {
    'contextInfos'    : 90000,
    'attachments'     : 60000,
    'returns'         : 50000,
    'farmers'         : 30000,
    'farmertech'      : 30000,
    'suivicells'      : 60000
}

// ERytmo Factory APP CODE
var APP_CODE_FACTORY = "factory";
const DEBUG_NOTIF = false;
const LIST_SERVICES_NOTIF =['planning', 'digitalmedia'];
const SIZE_DROPDOWN_LIST = 20;

// related to Phelix module 
const DOUBLAGE_TYPE_ID_VALUES =  ['1','2'];
const FORMAT_MIX_ID_VALUES =  ['2','4'];
const WORKFLOW_TYPE_ID_VALUE  =  '1';
const CLIENT_ID_VALUES  =  [66]; // Alula
const ACTION_TYPE_ID_VALUES  =  [461,462]; // 