bonsServices.factory('HelperService', ['$resource', 'Session', 'USER_ROLES', '$rootScope', '$timeout',
  function($resource, Session, USER_ROLES, $rootScope, $timeout) {
    var helperService = {};
    helperService.arrayObjectIndexOf = function(myArray, searchTerm, property) {
      for (var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property] === searchTerm) return i;
      }
      return -1;
    }

    // in html <button class="btn btn-danger" ng-if="errorMessageFlag"><i class="fa fa-warning" aria-hidden="true"></i> {{errorMessage}} </button>
    // in component $scope.errorMessageFlag = false
    // HelperService.setPopupMessage($scope, 'mon joli message' , 5000)
    helperService.setPopupMessage = function ($scope, message, specialDuration) {
      const duration = specialDuration ? specialDuration : 5000
      $scope.errorMessageFlag = true
      $scope.errorMessage = message
      $timeout(function(){
          $scope.errorMessageFlag = false
      }, duration);
  }

    helperService.difference = function(modified, original) {
      var object = {};
      for (var key in modified) {
        if (modified[key] != original[key] && modified[key] != null) {
          if (typeof modified[key] == 'object') {
            for (var key2 in modified[key]) {
              if (modified[key][key2] != original[key][key2] && modified[key][key2] != null) {
                object[key] = {};
                object[key][key2] = modified[key][key2];
              }
            }
          } else {
            object[key] = modified[key];
          }
        }
      }
      return object;
    }

    helperService.getDurationInMinutes = function (dateStart, dateEnd) {
      return (new Date(dateEnd).getTime() - new Date(dateStart).getTime()) / 1000 / 60
    }

    helperService.weeksBetween =  function (d1, d2) {
      return Math.round((d2 - d1) / (7 * 24 * 60 * 60 * 1000));
    }

    helperService.getWeekNumber = function (d) {
      // Copy date so don't modify original
      d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
      // Set to nearest Thursday: current date + 4 - current day number
      // Make Sunday's day number 7
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
      // Get first day of year
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
      // Calculate full weeks to nearest Thursday
      const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
      // Return array of year and week number
      return weekNo
    }

    // reconstruit un datetime à partir du jour et de l'heure au format HH:MM ou HHhmm
    // A noter que si l'heure est entre 00:00 et 06:00, on passe au jour suivant
    helperService.buildDateTime = function (day, hour ) {
      if (!hour) {
        return day
      }
      let dateTime = ''
      const hourStandard = hour.replace('h',':')
      const inMn = helperService.fromHourToMinutes(hourStandard)
      if (inMn >= 1080) {
        const newDay = moment(day).add(1, "days").format('YYYY-MM-DD')
        dateTime = newDay + ' ' + hourStandard + ':00'
      } else {
        const splitted = day.split(' ')
        dateTime = splitted[0] + ' ' + hourStandard + ':00'
      }
      return dateTime
    }

    // heures en minutes, mais à partir de 6h du matin
    helperService.fromMinutesToHour = function (rangeTime) {
      const start = 360
      const current = rangeTime + start
      const hourBrut = parseInt((current % 1440) / 6 / 10)
      const hour = hourBrut < 10 ? '0' + hourBrut : hourBrut
      const minutesBrut = parseInt(((current % 1440) % 60))
      const minutes = minutesBrut < 10 ? '0' + minutesBrut : minutesBrut
      return hour + ':' + minutes
    }
    // inverse du précédent 
    helperService.fromHourToMinutes = function (hour) {
      if (!hour) {
        return 0
      }
      const splitted = hour.split(':')
      let res = (+splitted[0]) * 60 + (+splitted[1])
      // 1080 correspond à minuit, tout est ce qui est en dessous de 6 heures, passe après minuit le lendemain
      res += res < 360 ? 1080 : -360
      return res
    }

    // tableau de minutes de 6h à 6h par 15 minutes pour utiliser dans un select
    // i18nHour est le format international
    helperService.buildMinutesArray = function () {
      const hourI18nTransformer  = transformHourInI18nFormat(Session.branchId())
      const arrayHours = []
      for (let i = 0 ; i <= 1440; i += 15) {
        const hour = helperService.fromMinutesToHour(i)
        const entry = {}
        entry.position = i
        entry.name = hour
        entry.id = i
        entry.i18nHour = hourI18nTransformer(entry.name) 
        arrayHours.push(entry)
      }
      return arrayHours
    }

    
    helperService.addTimeSlot = function (start, entries, addon) {
      const hourI18nTransformer  = transformHourInI18nFormat(Session.branchId())
      tempo = []
      for (let i = 0; i < entries.length; i++ ) {
          const entry = entries[i]
          if (start > entry.start && start < entry.end) {
              const first = { 
                start: entry.start, end: start, width: start - entry.start, 
                startHour: helperService.fromMinutesToHour(entry.start),
                endHour: helperService.fromMinutesToHour(start),
                ...addon
              }
              first.currentStartHour = hourI18nTransformer(first.startHour)
              first.currentEndHour = hourI18nTransformer(first.endHour)
              first.width = first.end - first.start
              const second = { 
                start: start, end: entry.end, width:  entry.end - start,
                startHour: helperService.fromMinutesToHour(start),
                endHour: helperService.fromMinutesToHour(entry.end)
              }
              second.currentStartHour = hourI18nTransformer(second.startHour)
              second.currentEndHour = hourI18nTransformer(second.endHour)
              second.width = second.end - second.start     
              tempo.push(first, second)
          } else {
              entry.width = entry.end - entry.start
              tempo.push(entry)
          }
      }
      entries = tempo
      return entries
    }

    helperService.removeTimeSlot = function (start, entries) {
      const hourI18nTransformer  = transformHourInI18nFormat(Session.branchId())
      let deleteIndex = 0
      if (entries.length === 1) {
        return entries
      }
      for (let i = 0; i < entries.length; i++ ) {
       if (start == entries[i].start) {
          deleteIndex = i
          if (!entries[i - 1]) {
            entries[i + 1].start = entries[i].start
            entries[i + 1].width = entries[i + 1].end - entries[i + 1].start
            entries[i + 1].startHour = helperService.fromMinutesToHour(entries[i].end)
            entries[i + 1].currentStartHour = hourI18nTransformer(entries[i + 1].startHour)            
          } else {
            entries[i - 1].end = entries[i].end
            entries[i - 1].width = entries[i - 1].end - entries[i - 1].start
            entries[i - 1].endHour = helperService.fromMinutesToHour(entries[i].end)
            entries[i - 1].currentEndHour = hourI18nTransformer(entries[i - 1].endHour)
          }
       }
      }
      entries.splice(deleteIndex, 1)
      return entries
    }

    helperService.setBaseTimeSlot = function () {
      const hourI18nTransformer  = transformHourInI18nFormat(Session.branchId())
      const timeSlot = {}
      timeSlot.start = 0
      timeSlot.end = 1440
      timeSlot.width = 1440
      timeSlot.startHour = helperService.fromMinutesToHour(0)
      timeSlot.endHour = helperService.fromMinutesToHour(1440)
      timeSlot.currentStartHour = hourI18nTransformer(timeSlot.startHour)
      timeSlot.currentEndHour = hourI18nTransformer(timeSlot.endHour)
      return timeSlot
    }

    helperService.getMonday = function (d) {
      d = new Date(d)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      return new Date(d.setDate(diff))
    }
    
    helperService.getWeekNumber = function (d) {
      // Copy date so don't modify original
      d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
      // Set to nearest Thursday: current date + 4 - current day number
      // Make Sunday's day number 7
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
      // Get first day of year
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
      // Calculate full weeks to nearest Thursday
      const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
      // Return array of year and week number
      return weekNo
    }    

    helperService.formatInternalDate = function (date2format) {
      const date = new Date(date2format)
      let day = date.getDate()
      if (day < 10) day = '0' + day
      let month = date.getMonth() + 1
      if (month < 10) month = '0' + month
      const jour = date.getFullYear() + '-' + month + '-' + day
      return jour
    }

    // retourne une date complete (mer. 21 sept. 2022 00:00) au format adapté à chaque pays
    helperService.fullDateDisplay = function () {
      return function (date) {
        return moment(date).format('LLLL')
      }
    }

    helperService.getDay = () => (date) => moment(date).format('D');
    helperService.getMonth = () => (date) => moment(date).format('M');
    helperService.getMonthShortName = () => (date) => moment(date).format('MMM').replace('.', '');
    helperService.getYear = () => (date) => moment(date).format('YY');

    helperService.i18nHourDisplay = function () {
      const hourI18nTransformer  = transformHourInI18nFormat(Session.branchId())
      return function (hour) {
        return hourI18nTransformer(hour)
      }
    }

    helperService.getScreenerFullProductName = function(product)
    {
      var name = product.project_name;
      var parts = [];

      if (product.subproject_nature_translation_id)
        parts.push($rootScope._T[product.subproject_nature_translation_id]);
      else if (product.subproject_name)
        parts.push(product.subproject_name);

      if (product.subproject_season)
        parts.push(product.season);

      name += " - " + parts.join(" ");

      parts = [];

      if ($rootScope._T[product.product_description_translation_id])
        parts.push($rootScope._T[product.product_description_translation_id]);
      else if (product.product_description_text)
        parts.push(product.product_description_text);

      if (product.episode)
        parts.push(product.episode);

      if (product.reel)
        parts.push(product.reel);

      name += " - " + parts.join(" ");

      return name;
    }

    helperService.isNextDay = function (start, end) {
      const startHour = start.split(/:|h/)[0]
      const endHour = end.split(/:|h/)[0]
      if (endHour < startHour) {
        return true
      } else {
        return false
      }
    }

    helperService.getFilenameFromResponse = function (response) {
      let filename = '';
  
      if (response && response.headers && response.headers('content-disposition')) {
        let parts = response.headers('content-disposition').split('filename=');
        if (parts[1]) {
          filename = parts[1];
  
          if (filename.startsWith('"')) filename = filename.substring(1);
          if (filename.endsWith('"')) filename = filename.substring(0, filename.length - 1);
        }
      }
  
      return filename;
    }
    
    return helperService;
  }
]);
