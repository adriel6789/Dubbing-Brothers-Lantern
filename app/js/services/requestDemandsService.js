Lantern.factory('RequestDemandsService', [
  '$http', '$filter','$rootScope',
  function ($http, $filter, $rootScope) {
    let service = {};
    let itemsSelected = [];

    service.countObject = function (obj) {
      return Number(Object.keys(obj).length);
    };

    service.filterGroup = function (projects, planningType) {
      $rootScope.user_main_location = $rootScope.user_entity.permissions[0].main_location
      const is_planning = false;
      // On parcours tous les groupes de projets retournés par l'API
      angular.forEach(projects, function (project) {
        project.sortedRequests = {}; // On prépare un objet des demandes triées par action, workflow et dates
        angular.forEach(project.requests, function (request) { // Pour chaque demande du groupe
          let isFarmer = false; // Si la demande a des séances farmers

          if (request.ownFarmerbookings != null) { // Si l'on a des séances farmers
              request.ownFarmerbookings = objectInArray(request.ownFarmerbookings); // On transforme l'objet des farmers en tableau
              isFarmer = request.ownFarmerbookings.length > 0;
          }

          let index = getHashRequest(request); // L'index du tableau pour grouper les demandes
          if (project.sortedRequests[index] == null) { // Si l'index n'a jamais été créé
            project.sortedRequests[index] = {}; // On initialise l'objet
            project.sortedRequests[index].date_for_order = null; // Service pour le tri par date dans le front
            project.sortedRequests[index].requests = []; // Servira à stocker les demandes du groupe
            project.sortedRequests[index].hash = index;

          }
          if (request.delai_souhaite != null) {
            request.delai_souhaite_sorted = $filter('orderBy')(request.delai_souhaite.split(','));
          }

          let dateToOrder = null;
          if (!is_planning) {
            if (request.delai_souhaite != null) {
              dateToOrder = request.delai_souhaite_sorted[0];
            }
            if (isFarmer) {
              request.ownFarmerbookings = $filter('orderBy')(request.ownFarmerbookings, ['day', 'start_time']);
              dateToOrder = moment(request.ownFarmerbookings[0].day).format('x');
            }
          }

          project.sortedRequests[index].date_for_order = dateToOrder;
          if (project.date_order_project == null || project.date_order_project === "" || project.date_order_project > dateToOrder) // Récupère la date la plus "ancienne"
          {
            project.date_order_project = dateToOrder;
          }
          if (request.product.subproject.nature.name === 'serie') {
            request.product_name = "Épisode " + request.product.episode_number;
          } else if (request.product.subproject.nature.name === 'film') {
            if (request.product && request.product.description) {
              request.product_name = request.product.description.value;
            } else {
              request.product_name = 'product name missing'
            }
          } else {
            request.product_name = request.product.description_text;
          }    
          project.withRequests = true
          if (planningType && planningType.main_location) {
            if (parseInt($rootScope.mainLocationList[planningType.main_location].loc_value) & parseInt(request.workflow.dub_place_value)) {
              project.sortedRequests[index].requests.push(request); // On ajoute la demande au groupe
            }
            
          } else {
            project.sortedRequests[index].requests.push(request); // On ajoute la demande au groupe
          }
          // si aucune request, voir allemagne qui a des gestions par site et peut se retrouver sans requete associée
          if (project.sortedRequests[index].requests.length == 0) {
            project.withRequests = false
          }
          
        });
      });
      return projects;
    };

    service.setSelectItem = function (requests) {
      itemsSelected = itemsSelected.concat(requests);
    };

    service.getSelectItem = function (requests) {
      return itemsSelected;
    };

    return service;

  }
]);
