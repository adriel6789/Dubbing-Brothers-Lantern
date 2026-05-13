
/* Services gestion des salles */
Lantern.factory('RoomService', ['ApiRest', 'Session', '$q', '$rootScope', "$localstorage", 'localUpdates', 
  function(ApiRest, Session, $q, $rootScope, $localstorage, localUpdates) {
    const branchId = Session.branchId()
    const service = {}

    const positionLocations = {
      1: ["Montjoie", "Procession", "Sonodi", "Belgique"],
      2: ["Berlin", "München"],
      3: ['Burbank'],
      4: ["Malcesine", "Boccardo", "PIEVE"]
    }

    const activity2number = {
      studio: 1,
      editing: 2,
      nodal: 3
    }

    // used in page security
    service.getStagesByBranch = function (rooms) {
      const listStages = {}
      positionLocations[branchId].forEach(function (location) {
        let ai = 0
        if (!listStages[location]) {
          listStages[location] = []
        }
        rooms.forEach(function (room) {
          if ((room.active && room.active == 1) || !room.active) {
            let nbOrder = pad(ai, 2)
          
            if (room && room.location === location) {
              if (room.name.match(/\d/)) {
                const re = new RegExp(/(\d+)/);
                const res = re.exec(room.name)
                nbOrder = pad(res[1], 2)
              }
              let activityNumber = activity2number[room.activity] ? activity2number[room.activity] : ''
              listStages[location].push(
                {
                  order: location + activityNumber + nbOrder,
                  name: room.name,
                  long_name: room.long_name,
                  type: room.activity,
                  stage: location, 
                }
              )
              ai++
            }
          }
        })
      })
      return listStages
    }
    
    service.getRooms = function (successCallback, errorCallback) {
        const params = {activities: ['studio','nodal','editing']}
        ApiRest.post('/bookingobject/rooms/filtered/' + branchId + '/', null, params, 
          function(rooms) {
            return successCallback(rooms)
          }, 
          function(error) {})
    }

    // 20220826, redondant, mais je suis pressé, phv :)
    service.manageRoomError = function (error) {
      console.log(error)
    }    
    let allRooms = []
    
    service.getRoomsForABranch = function (done, errorCallback) {
      if (!$rootScope.user_entity) return done() 
      const toCheck = localUpdates.checkUpdates('rooms', 3600)
      const rooms = $localstorage.getObject('lantern_rooms_' + branchId)
      $rootScope.allRoomsById = {}
      $rootScope.allRoomsByName = {}
      if (rooms && !toCheck) {
        allRooms = []
        Object.keys(rooms).forEach((roomId) => {
          allRooms.push({ name: rooms[roomId].name, place: rooms[roomId].location, id: rooms[roomId].id, long_name: rooms[roomId].long_name,
            dubbing_step: rooms[roomId].dubbing_step, location: rooms[roomId].location, active: rooms[roomId].active, main_location: rooms[roomId].main_location 
          })
        })
        $rootScope.allRooms = allRooms
        allRooms.forEach((room) => {
          $rootScope.allRoomsById[room.id] = room
          $rootScope.allRoomsByName[room.name] = room.id
        })        
      }
      if (allRooms.length > 0) {
        $rootScope.allRooms = allRooms
        allRooms.forEach((room) => {
          $rootScope.allRoomsById[room.id] = room
          $rootScope.allRoomsByName[room.name] = room.id
        })
        return done(rooms)
      }
      allRooms = []
      // vega Object managed in Vega
      ApiRest.get('/bookingobject/rooms/' + $rootScope.user_entity.person.branch_id, null, function(response) {
      if (response && response.error) {
        return errorCallback(response)
      }  
      if  (response && typeof response === 'object') {
          Object.keys(response).forEach(function (roomId) {
          if (response[roomId].location && response[roomId].activity != 'indispo' && response[roomId].activity != 'waiting' ) {
            allRooms.push({ name: response[roomId].name, place: response[roomId].location, id: response[roomId].id, long_name: response[roomId].long_name,
              dubbing_step: response[roomId].dubbing_step, location: response[roomId].location, active: response[roomId].active, main_location: response[roomId].main_location })
          }
          })
          $rootScope.allRooms = allRooms
          allRooms.forEach((room) => {
            $rootScope.allRoomsById[room.id] = room
            $rootScope.allRoomsByName[room.name] = room.id
          })
          $localstorage.setObject('lantern_rooms_' + branchId, response)
          return done(response)
      }
  }, 
      function(error){
          service.setErrorLoading(true);
      })
  }    

    return service;
  }
]);
