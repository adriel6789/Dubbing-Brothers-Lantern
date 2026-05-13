'use strict';

/* Services */
Lantern.factory('ResponseToastService', ['ApiRest', 'Session',
  function(ApiRest, Session) {
    var response = {
      error: {
        message: "Nous avons eu un problème, merci de réessayer.",
        "409" : "Element que vous essayez d'ajouter existe déjà"
      }
    };
    return response;
  }
]);