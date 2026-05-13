'use strict';

/* Services clients */
Lantern.factory('ClientService', ['ApiRest', 'Session','$rootScope','$http','$localstorage','localUpdates',
  function(ApiRest, Session, $rootScope, $http, $localstorage, localUpdates) {
    $rootScope.broadcasters = {}
    $rootScope.distributors = {}

    const service = {}

    const branchId = Session.branchId()
    let  urlClients
    // permet de ne plus chercher que les clients sans images
    // Mais va conserver en local la dernière recherche et sinon, va chercher si une image existe une fois par jour
    const checkimage = function (client, done) {
      if ($localstorage.getObject('url_clients_' + branchId)) {
        urlClients = $localstorage.getObject('url_clients_' + branchId)
      } else {
        urlClients = {}
      }
      if (typeof urlClients[client.id] == "boolean") {
        client.url = 'img/clients/' + client.id + '.png'
        return done(client.url)
      } else {
        if (urlClients[client.id] && urlClients[client.id] + 86400000 > new Date().getTime() ) {
          if ($rootScope.imagesFromBase[client.id]) {
            client.url = $rootScope.imagesFromBase[client.id]
          } else {
            client.url = 'img/clients/no-customer.png'
          }
          return done(client.url)
        }
      }
      $http.get('img/clients/'+ client.id + '.png')
      .success(function(data, status){
         if(status==200){
          client.url = 'img/clients/' + client.id + '.png'
          urlClients[client.id] = true
          $localstorage.setObject('url_clients_' + branchId, urlClients)
         } else {
          urlClients[client.id] = new Date().getTime()
          $localstorage.setObject('url_clients_' + branchId, urlClients)
          if ($rootScope.imagesFromBase[client.id]) {
            client.url = $rootScope.imagesFromBase[client.id]
          } else {
            client.url = 'img/clients/no-customer.png'
          }
         }
         return done(client.url)
         
      })
      .error(function(data,status){
         if(status==200){
          client.url = 'img/clients/' + client.id + '.png'
         } else {
          client.url = 'img/clients/no-customer.png'
         }
      })
    }
    service.manageClientError = function (error) {
      console.log(error)
    }
    $rootScope.clientsLight = {}
    $rootScope.imagesFromBase = {}
    let updateClient
    service.getClients = function(params, successCallback, errorCallback) {
      // vérif au-delà de 30 secondes
      const toCheck = !updateClient || ((updateClient + 30000) < new Date().getTime())  ? true  :  false
      let clients
      if (!toCheck) {
        clients = $localstorage.getObject('lantern_clients_' + branchId)
        if (clients) {
          clients.forEach((client) => {
            if (client.type_id) {
              $rootScope.clientsLight[client.id] = client
              checkimage(client, function (url) {
                $rootScope.clientsLight[client.id] = client
              })
            }
          })
        }

      }
      if (clients && !params.direct) {
        return successCallback(clients)
      } else {
        updateClient = new Date().getTime()
        ApiRest.get('/clients', params, function(response) {
          if (response && response.error)  {
            return errorCallback(response)
          }
          clients = []
          response.forEach((client) => {
            if (client.type_id) {
              if (client.url) {
                $rootScope.imagesFromBase[client.id] = client.url
              }
              client.url = null
            }
            clients.push(client)
          })
          // clients = response

          $localstorage.setObject('lantern_clients_' + branchId, clients)
          clients.forEach(function (client) {
            if (client.type_id) {
              checkimage(client, function (url) {
                $rootScope.clientsLight[client.id] = client
              })
            }
          })
          return successCallback(response)
        }, function(error) {
          return errorCallback(error);
        })
      }
    }

    // stocke les clients en interne, mais pas en localStorage à cause des images
    service.getAllClients = function (successCallback, errorCallback) {
      if (Object.keys($rootScope.clients).length > 0) {
        return successCallback()
      } else {
        ApiRest.get('/clients/', {}, 
          function(data) {
            data.forEach(function (item) {
              if (item.type_id) {
                $rootScope.clients[item.id] = item
              } 
            })            
            return successCallback()
          }, 
          function(error) {
            return errorCallback(error)
          })
      }
    }
    const distributorFilter = {
      where: {type_id : 1},
      fields: ['id', 'name']
    }
    // destinée à remplacer Client.getClientsBy dans services.js
    service.getClientsByDistributor = function (successCallback, errorCallback) {
      if (Object.keys($rootScope.distributors).length > 0) {
        return successCallback()
      }
      else if (Object.keys($rootScope.clients).length > 0) {
        Object.keys($rootScope.clients).forEach(function (id) {
          if ($rootScope.clients[id].type_id == 1) {
            $rootScope.distributors[id] = { id: id, name: $rootScope.clients[id].name }
          }
        })
        return successCallback()
      } else {
        ApiRest.post('/clients/filtered/', null, distributorFilter, 
          function(data) {
            data.forEach(function (item) {
              $rootScope.distributors[item.id] = item
            })            
            return successCallback()
          }, 
          function(error) {
            return errorCallback(error)
          })
      }
    }
    const broadcasterFilter = {
      where: {type_id : 2},
      fields: ['id', 'name']
    }
    // destinée à remplacer Client.getClientsBy dans services.js
    service.getClientsByBroadcaster = function (successCallback, errorCallback) {
      if (Object.keys($rootScope.broadcasters).length > 0) {
        return successCallback()
      }
      else if (Object.keys($rootScope.clients).length > 0) {
        Object.keys($rootScope.clients).forEach(function (id) {
          if ($rootScope.clients[id].type_id == 2) {
            $rootScope.broadcasters[id] = { id: id, name: $rootScope.clients[id].name }
          }
        })
        return successCallback()
      } else {
        ApiRest.post('/clients/filtered/', null, broadcasterFilter, 
          function(data) {
            data.forEach(function (item) {
              $rootScope.broadcasters[item.id] = item
            })            
            return successCallback()
          }, 
          function(error) {
            return errorCallback(error)
          })
      }
    }

    return service
  }
])