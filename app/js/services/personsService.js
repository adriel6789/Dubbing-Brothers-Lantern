'use strict';

/* Services */
Lantern.factory('PersonsService', ['ApiRest', 'Session', '$rootScope', '$localstorage','localUpdates', 'User',
  function(ApiRest, Session, $rootScope, $localstorage, localUpdates, User) {
    const branchId = Session.branchId()
    const service = {};

    service.getPersonById = function(params, successCallback, errorCallback) {
      ApiRest.get('/persons/' + params.id, params, function(person) {
        return successCallback(person);
      }, function(error) {
        return errorCallback(error);
      });
    };

    // SearchIdsByFullname
    service.SearchIdsByFullname = function(params, successCallback, errorCallback) {
      ApiRest.get('/persons/searchidsbyfullname.json?q=' + params, {}, function(person) {
        return successCallback(person);
      }, function(error) {
        return errorCallback(error);
      });
    };
    // en cas d'utilsation futur
    service.getIdPersonByName = function(params, successCallback, errorCallback) {
      ApiRest.get('/persons/searchByFullName.json?q=' + params, {}, function(person) {
        return successCallback(person);
      }, function(error) {
        return errorCallback(error);
      });
    };
    // en cas d'utilsation futur
    service.postCreatePersonId = function(params, successCallback, errorCallback) {
          var names = params.split(" ");
          var personFirstname = names[0];
          names.splice(0, 1)
          var personLastname = names.join(" ");
      ApiRest.post('/persons', {}, {
            firstname: personFirstname,
            lastname: personLastname,
            export_sc_lantern: 1
          }, function(person) {
            // person created
            return successCallback(person);
          }, function(error) {
            return errorCallback(error);
          });
    };

    service.getOrCreatePersonId = function(params, successCallback, errorCallback) {
      ApiRest.get('/persons/searchByFullName.json?q=' + params, {}, function(persons) {
        if(persons.length > 0) {
          return successCallback(persons[0].id);
        } else {
          var names = params.split(" ");
          var personFirstname = names[0];
          names.splice(0, 1)
          var personLastname = names.join(" ");
          ApiRest.post('/persons', {}, {
            firstname: personFirstname,
            lastname: personLastname,
            export_sc_lantern: 1
          }, function(person) {
            // person created
            return successCallback(person.id);
          }, function(error) {
            return errorCallback(error);
          });
        }
      }, function(error) {
        return errorCallback(error);
      });
    };

    // enregistrement par person_id, parce qu'ils sont enregistrés comme ça dans la table farmerbookings
    $rootScope.directors = {}
    service.getArtisticDirectors = function(successCallback, errorCallback) {
      const toCheck = localUpdates.checkUpdates('directors', 300)
      const directors = $localstorage.getObject('lantern_directors_' + branchId)
      if (directors && !toCheck) {
        directors.forEach((director) => {
          const data = {
            id: director.id, 
            lastname: director.lastname, 
            firstname: director.firstname,
            fullname: director.firstname + ' ' + director.lastname,
            user_id: director.user_id
            }
            $rootScope.directors[director.id]  = data      
        })
        return successCallback(directors);
      }      
      // oups la fôte arti**c**ticDirectors ! :)
      ApiRest.get('/persons/articticDirectors/all/', {}, function(artisticDirectors) {
        if (artisticDirectors && artisticDirectors.error) {
          return errorCallback(artisticDirectors)
        }
        artisticDirectors.forEach((director) => {
          const data = {
              id: director.id, 
              lastname: director.lastname, 
              firstname: director.firstname,
              fullname: director.firstname + ' ' + director.lastname,
              user_id: director.user_id
            }
            $rootScope.directors[director.id]  = data      
        })        
        $localstorage.setObject('lantern_directors_' + branchId, artisticDirectors)
        return successCallback(artisticDirectors)
      }, function(error) {
        return errorCallback(error)
      });
    }
      //chargés de prod

    // 62: planning, parce que certains techniciens peuvent accéder à Vega avec un autre rôle (planning par exemple) et ça ne gère pas deux rôles
    // Le planning demande a des techs de faire le planning et pour ça ils doivent avoir les droits (soupir)
    $rootScope.allTechnicians = {}
    let allContributors = null
    service.getContributors = function(successCallback, errorCallback) {
      const toCheck = localUpdates.checkUpdates('contributors', 300)
      let contributors = $localstorage.getObject('lantern_contributors_' + branchId)
      if (contributors && !toCheck) {
        Object.keys(contributors).forEach((id) => {
          const contributor = contributors[id]
          if (contributor.app_role_id == 65 || contributor.app_role_id == 66 || contributor.app_role_id == 67 || contributor.app_role_id == 68 || contributor.app_role_id == 70 || contributor.app_role_id == 62) {
            $rootScope.allTechnicians[id] = contributor
          }
        })
        Object.keys($rootScope.lanternTechniciansById).forEach((techId) => {
          if (!$rootScope.allTechnicians[techId]) {
            $rootScope.allTechnicians[techId] = $rootScope.lanternTechniciansById[techId]
          }
        })
        allContributors = contributors
      }
      if (allContributors) {
        return successCallback(allContributors)
      } else {
        ApiRest.get('/booking/contributors/', {}, function(contributors) {
          if (contributors.error) {
            return errorCallback(contributors)
          }
          Object.keys(contributors).forEach((id) => {
            const contributor = contributors[id]
            if (contributor.app_role_id == 65 || contributor.app_role_id == 66 || contributor.app_role_id == 67 || contributor.app_role_id == 68 || contributor.app_role_id == 70 || contributor.app_role_id == 62) {
              $rootScope.allTechnicians[id] = contributor
            }
          })
          Object.keys($rootScope.lanternTechniciansById).forEach((techId) => {
            if (!$rootScope.allTechnicians[techId]) {
              $rootScope.allTechnicians[techId] = $rootScope.lanternTechniciansById[techId]
            }
          })
          allContributors = contributors
          $localstorage.setObject('lantern_contributors_' + branchId, allContributors)
          return successCallback(contributors);
        }, function(error) {
          return errorCallback(error);
        });
      }
    }

    service.postCreatePersonId = function(params, successCallback, errorCallback) {
          var names = params.split(" ");
          var personFirstname = names[0];
          names.splice(0, 1)
          var personLastname = names.join(" ");
      ApiRest.post('/persons', {}, {
            firstname: personFirstname,
            lastname: personLastname,
            export_sc_lantern: 1
          }, function(person) {
            // person created
            return successCallback(person);
          }, function(error) {
            return errorCallback(error);
          });
    };

    service.manageContributorError = function (error) {
      console.log(error)
    }
    // recupère les personnes de Lantern ayant le rôle de technicien
    $rootScope.lanternTechniciansById = {}
    service.getTechnicians = function (successCallback, errorCallback) {
      const toCheck = localUpdates.checkUpdates('techniciens', 300)
      let gotIt = false
      let lanternTechniciansById = $localstorage.getObject('lantern_techniciens_' + branchId)
      if (lanternTechniciansById && !toCheck) {
        $rootScope.lanternTechniciansById = lanternTechniciansById
        gotIt = true
      }
      if (lanternTechniciansById && gotIt) {
        return successCallback(lanternTechniciansById)
      } else {
        ApiRest.get('/bookingcontributor/find/lantern/users/technicien', 
          {}, function(techs) {
            if (techs.error) {
              return errorCallback(techs)
            }
            const techsById = {}
            techs.forEach((tech) => {
              techsById[tech.id] = {
                user_id : tech.id,
                id : tech.id,
                firstname: tech.firstname,
                lastname: tech.lastname,
                email: tech.email,
                status: 'active',
                person_id: tech.person_id,
                main_location: tech.main_location,
                phone: tech.phone
              }
            })
            $rootScope.lanternTechniciansById = techsById
            $localstorage.setObject('lantern_techniciens_' + branchId, techsById)
          })
      }

    }
    service.manageTechniciansError = function (error) {
      console.log(error)
    }

    // recupère les personnes de Lantern ayant le rôle de stage_manager
    $rootScope.stageManagersById = {}
    service.getStageManagers = function (successCallback, errorCallback) {
      const toCheck = localUpdates.checkUpdates('stage_managers', 300)
      let gotIt = false
      let stageManagersById = $localstorage.getObject('lantern_stage_managers_' + branchId)
      if (stageManagersById && !toCheck) {
        $rootScope.stageManagersById = stageManagersById
        $rootScope.stageManagers = Object.values(stageManagersById)
        gotIt = true
      }
      if (stageManagersById && gotIt) {
        return successCallback(stageManagersById)
      } else {
        ApiRest.get('/bookingcontributor/find/lantern/users/stage_manager', 
          {}, function(stagesManager) {
            if (stagesManager.error) {
              return errorCallback(stagesManager)
            }
            const stageManagersById = {}
            stagesManager.forEach((person) => {
              stageManagersById[person.id] = {
                user_id : person.id,
                id : person.id,
                firstname: person.firstname,
                lastname: person.lastname,
                email: person.email,
                status: 'active',
                person_id: person.person_id,
                phone: person.phone,
                main_location: person.main_location
              }
            })
            $rootScope.stageManagersById = stageManagersById
            $rootScope.stageManagers = Object.values(stageManagersById)
            $localstorage.setObject('lantern_stage_managers_' + branchId, stageManagersById)
          })
      }

    }

    service.manageStageManagersError = function (error) {
      console.log(error)
    }






    return service;
  }
]);
