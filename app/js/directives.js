'use strict';

angular.module('Lantern').directive('timecodeInput', function ($filter, $browser) {
  return {
    require: 'ngModel',
    link: function ($scope, $element, $attrs, ngModelCtrl) {
      const formatTimecode = function (value) {
        let formattedValue = '';
        if (value) {
          const chunks = value.match(/(\d{1,2})/g).slice(0,4)
          formattedValue = chunks.join(':')
        } 
        return formattedValue;
      };

      const listener = function () {
        let value = $element.val().replace(/:/g, '');
        let formattedValue = formatTimecode(value);
        $element.val(formattedValue);
      };

      ngModelCtrl.$parsers.push(function (viewValue) {
        let value = viewValue.replace(/:/g, '');
        let formattedValue = formatTimecode(value);
        return formattedValue;
      });

      ngModelCtrl.$render = function () {
        let value = ngModelCtrl.$viewValue || '';
        let formattedValue = formatTimecode(value);
        $element.val(formattedValue);
      };

      $element.bind('change', listener);
      $element.bind('keydown', function (event) {
        let key = event.keyCode;
        if (key == 91 || (15 < key && key < 19) || (37 <= key && key <= 40)) {
          return;
        }
        $browser.defer(listener);
      });

      $element.bind('paste cut', function () {
        $browser.defer(listener);
      });

      // Function to manually trigger formatting
      $scope.formatTimecode = function () {
        var value = ngModelCtrl.$viewValue || '';
        var formattedValue = formatTimecode(value);
        $element.val(formattedValue);
      };
    }
  };
});

angular.module('Lantern').directive('timecodeInputEnhanced', function($filter, $browser) {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModelCtrl) {
      var listener = function() {
        var value = element.val().replace(/:/g, '');
        var formatedValue = '';
        for (var i = 0; i < value.length; i++) {
          if (i === 2 || i === 4 || i === 6) {
            formatedValue += ':';
          }
          formatedValue += value.charAt(i);
        }
        element.val(formatedValue);
      }
      ngModelCtrl.$parsers.push(function(viewValue) {
        var value = viewValue.replace(/:/g, '');
        var formatedValue = '';
        for (var i = 0; i < value.length; i++) {
          if (i === 2 || i === 4 || i === 6) {
            formatedValue += ':';
          }
          formatedValue += value.charAt(i);
        }
        ngModelCtrl.$setViewValue(formatedValue);
        ngModelCtrl.$render();
        return formatedValue;
      });
      ngModelCtrl.$parsers.push(function(modelValue) {
        var value = modelValue.replace(/:/g, '');
        return value;
      });
      element.bind('change', listener);
      element.bind('keydown', function(event) {
        var key = event.keyCode;
        if (key === 91 || (15 < key && key < 19) || (37 <= key && key <= 40)) {
          return;
        }
        $browser.defer(listener);
      });
      element.bind('paste cut', function() {
        $browser.defer(listener);
      });
    }
  };
});


// in  app\views\Technicien\requestDetailTechnicien.html
angular.module('Lantern').directive('commentInput', function ($filter, $browser) {
  return {
    require: 'ngModel',
    link: function ($scope, $element, $attrs, ngModelCtrl) {
      
      const commentsPossible = {}
      JSON.parse($attrs.commentInput).forEach((item) => { 
        if (item.element) {
          commentsPossible[item.element] = true 
        }
      })
      let getCommentInput = function () {
        if (!$element.val()) {
          $element.val('')
          return
        }

        const splitted = $element.val().split(':')
        if (splitted.length == 1) {
          $element.val('')
          return
        }
        if (splitted[1]) {
          splitted[1] = splitted[1].replace(/^\s+$/, '')
        }
        if (!splitted[1]) {
          return
        }
        if (!commentsPossible[splitted[0]]) {
          $element.val('comment type unknown, please, try again!')
          return
        }
      }


      $element.bind('change', getCommentInput)
    }
  }
})






angular.module('Lantern').directive('timeInput', function ($filter, $browser) {
  return {
    require: 'ngModel',
    link: function ($scope, $element, $attrs, ngModelCtrl) {

      var listener = function () {
        var value = $element.val().replace(/:/g, '');

        var formatedValue = '';
        for (var i = 0, len = value.length; i < len; i++) {
          if (i == 2 || i == 4) {
            formatedValue += ':';
          }
          formatedValue += value[i];

        }

        $element.val(formatedValue);
      }

      // This runs when we update the text field
      /*
            ngModelCtrl.$parsers.push(function(viewValue) {
                var value = viewValue.replace(/:/g, '');

                var formatedValue = '';
                for (var i = 0, len = value.length; i < len; i++) {
                    formatedValue += value[i];
                    if (i == 1 || i == 3 || i == 5) {
                        formatedValue += ':';
                    }
                }

                return formatedValue;
            })
*/
      // This runs when the model gets updated on the scope directly and keeps our view in sync
      /*
            ngModelCtrl.$render = function() {
                var value = $element.val().replace(/:/g, '');

                var formatedValue = '';
                for (var i = 0, len = value.length; i < len; i++) {
                    if (i == 2 || i == 4 || i == 6) {
                        formatedValue += ':';
                    }
                    formatedValue += value[i];

                }

                $element.val(formatedValue);
            }
*/
      $element.bind('change', listener)
      $element.bind('keydown', function (event) {
        var key = event.keyCode
        // If the keys include the CTRL, SHIFT, ALT, or META keys, or the arrow keys, do nothing.
        // This lets us support copy and paste too
        if (key == 91 || (15 < key && key < 19) || (37 <= key && key <= 40))
          return
        $browser.defer(listener) // Have to do this or changes don't get picked up properly
      })

      $element.bind('paste cut', function () {
        $browser.defer(listener);
      })
    }

  };
});

angular.module('Lantern').directive('starRating', function () {
  return {
    restrict: 'A',
    template: '<ul class="rating">' +
      '<li ng-repeat="star in stars" ng-class="star" ng-click="toggle($index)">' +
      '\u2605' +
      '</li>' +
      '</ul>',
    scope: {
      ratingValue: '=',
      max: '=',
      onRatingSelected: '&'
    },
    link: function (scope, elem, attrs) {

      var updateStars = function () {
        scope.stars = [];
        for (var i = 0; i < scope.max; i++) {
          scope.stars.push({
            filled: i < scope.ratingValue
          });
        }
      };

      scope.toggle = function (index) {
        scope.ratingValue = index + 1;
        scope.onRatingSelected({
          rating: index + 1
        });
      };

      scope.$watch('ratingValue', function (oldVal, newVal) {
        if (scope.ratingValue == null) {
          scope.ratingValue = 1;
          updateStars();
        }
        if (newVal) {
          updateStars();
        }
      });
    }
  };
});

angular.module('Lantern').directive('notificationBadge', function ($timeout) {
  return function (scope, elem, attrs) {
    $timeout(function () {
      elem.addClass('notification-badge');
    }, 0);
    scope.$watch(attrs.notificationBadge, function (newVal) {
      if (newVal > 0) {
        elem.attr('data-badge-count', newVal);
      } else {
        elem.removeAttr('data-badge-count');
      }
    });
  }
});

// DEPRECATED, replaced by date-wish
angular.module('Lantern').directive('requestDate', function ($filter, RequestService, $rootScope) {
  return {
    templateUrl: 'partials/template/request-date.html',
    scope: {
      request: "=data",
      cell: "="
    },
    link: function (scope) {}
  }
});

angular.module('Lantern').directive('workflow', function (WorkflowHelperService) {
  return {
    templateUrl: 'partials/template/workflow.html',
    scope: {
      workflow: "=data",
      overflowhidden: "=",
      tooltiphidden: "="
    },
    link: function (scope) {
      if (scope.workflow) {
        scope.workflow.color = colorizeWorkflow(scope.workflow);
        scope.workflow.description = WorkflowHelperService.describeWorkflow(scope.workflow);
      }
    }
  }
});

angular.module('Lantern').directive('focusMe', function ($timeout) {
  return {
    scope: {
      trigger: '=focusMe'
    },
    link: function (scope, element) {
      scope.$watch('trigger', function (value) {
        if (value === true) {
            element[0].focus();
            element[0].select();
          scope.trigger = false;
        }
      });
    }
  };
});

angular.module('Lantern')
    .directive('konamiCode', ['$document', function ($document) {
        var konamiKeysDefault = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

        return {
            restrict: 'A',
            link: function (scope, element, attr) {

                if (!attr.konamiCode) {
                    throw ('Konami directive must receive an expression as value.');
                }

                // Let user define a custom code.
                var konamiKeys = attr.konamiKeys || konamiKeysDefault;
                var keyIndex = 0;

                /**
                 * Fired when konami code is type.
                 */
                function activated() {
                    if ('konamiOnce' in attr) stopListening();
                    // Execute expression.
                    scope.$eval(attr.konamiCode);
                }

                /**
                 * Handle keydown events.
                 */
                function keydown(e) {
                    if (e.keyCode === konamiKeys[keyIndex++]) {
                        if (keyIndex === konamiKeys.length) {
                            keyIndex = 0;
                            activated();
                        }
                    } else {
                        keyIndex = 0;
                    }
                }

                /**
                 * Stop to listen typing.
                 */
                function stopListening() {
                    $document.off('keydown', keydown);
                }

                // Start listening to key typing.
                $document.on('keydown', keydown);

                // Stop listening when scope is destroyed.
                scope.$on('$destroy', stopListening);
            }
        };
    }]);

// un peu comme datewish, mais prend une série de farmers
angular.module('Lantern').directive('datesSessions', function ($rootScope, RequestService, FarmerService) {
  return {
    templateUrl: 'partials/template/dates-sessions.html',
    scope: {
      request: "=request",
      dates: "=dates",
      small: "=",
      getstatus: "=",
      cell: "="
    },
    link: function (scope) {
      if (scope.dates && scope.dates.length == 0) {
        scope.nodate = true
      } else {
        scope.allDates = scope.dates
        scope.dates.forEach((date) => {
          const data = date
          data.timestamp = parseInt(moment(date.day).format('x'))
          data.tooltip = FarmerService.setTooltip(date, date)
          data.class = FarmerService.getDateClass(date, scope.small)
        })
      }

    }
  }
})

angular.module('Lantern').directive('dateSession', function ($rootScope, RequestService, FarmerService) {
  return {
    templateUrl: 'partials/template/date-session.html',
    scope: {
      request: "=request",
      date: "=date",
      hide: "=",
      small: "="      
    },
    link: function (scope) {
      scope.date.timestamp = parseInt(moment(scope.date.day).format('x'))
      scope.date.tooltip = FarmerService.setTooltip(scope.date,scope.date)
      scope.getClasses = function () {
        const dateClass = FarmerService.getDateClass(scope.date, scope.small)
        return dateClass
      }
    }
  }
})

angular.module('Lantern').directive('dateWish', function ($filter, Request, RequestService, $rootScope, FarmerService, HelperService) {
  return {
    templateUrl: 'partials/template/date-wishes.html',
    scope: {
      request: "=data",
      hide: "=",
      small: "=",
      getstatus: "=",
      cell: "="
    },
    link: function (scope) {

      scope.$on('date-wish-updated', function(event, args) {
        angular.forEach(args.requests, function(request) {
          if (scope.request.id == request.id) {
            scope.request.ownFarmerbookings = request.ownFarmerbookings;
            init();
            getRequestStatus(scope);
          }
        });
      });

      /**
       * update data in wish page from change in suivi prod or any location
       * 
       * $rootScope.$broadcast is used in app\js\controllers\production\suiviProdCtrl.js
       * 
       */
      scope.$on('date-wish-update-sync', function(event, result) {

          if (scope.allDates.length == 0) {
            return;
          }
          let farmers = result.farmers
          let deleted = result.deleted
          let temp_alldates = [];
          let byTimeStamp = {};
          scope.allDates.forEach(
              function (date) {
                if (deleted[date.farmer_id]) {
                   scope.allFarmerDatesAreDone = true;
                   scope.nextDate = null;
                } else {
                  byTimeStamp[date.timestamp] = date;   
                }
              }
          );
          
          Object.keys(farmers).forEach(
            function (request_id) {
              if (scope.request.id == request_id) {
                
                farmers[request_id].forEach(
                  function (farmer) {
                    let parse = parseInt(moment(farmer.day).format('x'));
                    if (byTimeStamp[parse]) {
                        byTimeStamp[parse].is_wish = farmer.is_wish
                        byTimeStamp[parse].booking_id = farmer.booking_id
                        byTimeStamp[parse].is_farmer = (farmer.booking_id != null);
                        byTimeStamp[parse].farmer_id = farmer.id;
                        byTimeStamp[parse].is_selected = farmer.is_selected; 
                        if (farmer.is_farmer) {
                          scope.oneOrMoreDateAreFarmer = true;
                        }    
                        if (byTimeStamp[parse].is_farmer && farmer.is_selected != 1) {
                          scope.allFarmerDatesAreDone = false;
                          if (!scope.nextDate) {
                            var momentDate = moment(parse);
                            scope.nextDate = {
                              day: momentDate.format("DD"),
                              month: momentDate.format('MMM')
                            };
                          }
                        }  
                        byTimeStamp[parse].tooltip = FarmerService.setTooltip(byTimeStamp[parse],farmer); 
                        
                        temp_alldates.push(byTimeStamp[parse]);
                      
                    }  else {                   
                      byTimeStamp[parse] = {};
                      byTimeStamp[parse].is_wish = farmer.is_wish
                      byTimeStamp[parse].booking_id = farmer.booking_id
                      byTimeStamp[parse].timestamp = parse;
                      byTimeStamp[parse].is_farmer = (farmer.booking_id != null);
                      byTimeStamp[parse].farmer_id = farmer.id;  
                      byTimeStamp[parse].is_selected =  farmer.is_selected;                  
                      if (farmer.is_farmer) {
                        scope.oneOrMoreDateAreFarmer = true;
                      }    
                      if (byTimeStamp[parse].is_farmer && farmer.is_selected != 1) {
                        scope.allFarmerDatesAreDone = false;
                        if (!scope.nextDate) {
                          var momentDate = moment(parse);
                          scope.nextDate = {
                            day: momentDate.format("DD"),
                            month: momentDate.format('MMM')
                          };
                        }
                      }  
                      byTimeStamp[parse].tooltip = FarmerService.setTooltip(byTimeStamp[parse],farmer); 
                      temp_alldates.push(byTimeStamp[parse]);
                    }                    
                    
                                                                           
                  }
                );

              }
            }
          );
          
          if (temp_alldates.length > 0) {
            scope.allDates = temp_alldates;
          }
      })

      const i18nHourDisplay = HelperService.i18nHourDisplay()
      scope.role = $.cookie('role');
      function init() {
        if (scope.request) {
          
          scope.allDates = [];
          scope.request.ownFarmerbookings = objectInArray(scope.request.ownFarmerbookings); // On transforme l'objet des farmers en tableau
          // affichage lors de la création de la demande lien: sauvegarder et ajouter une demande supplémentaire
          if (scope.request.dateStartEnd && scope.request.dateStartEnd != null && scope.request.dateStartEnd.length > 0) { 
            angular.forEach(scope.request.dateStartEnd, function(desired) {
              if (desired.day != null) {
                let parse = parseInt(moment(desired.day).format('x'));
                let date = {};
                date.timestamp = parse;
                if (desired.start_time_h && desired.start_time_h != null) {
                  date.start_time =   (desired.start_time_h.value < 10 ? '0' + desired.start_time_h.value : desired.start_time_h.value)
                              + ':' +  (desired.start_time_m < 10 ? '0' + desired.start_time_m : desired.start_time_m)
                } else {
                  date.start_time = null;
                }
                if (desired.end_time_h && desired.end_time_h != null) {
                  date.end_time = (desired.end_time_h.value < 10 ? '0' + desired.end_time_h.value : desired.end_time_h.value)
                        + ':' +  (desired.end_time_m < 10 ? '0' + desired.end_time_m : desired.end_time_m)
                } else {
                  date.end_time = null;
                }
                date.old = false;
                date.is_farmer = false;
                date.tooltip = FarmerService.setTooltip(date);
                scope.allDates.push(date);
              }
            });
            
          }

          if (scope.request.ownFarmerbookings != null && scope.request.ownFarmerbookings.length > 0) {
            scope.allFarmerDatesAreDone = true;
            scope.oneOrMoreDateAreFarmer = false;
            scope.nextDate = null;
            angular.forEach(scope.request.ownFarmerbookings, function (farmer) {
              if (farmer.day != null) {
                const timestamped_date = parseInt(moment(farmer.day).format('x'))
                const date = {}
                date.is_wish = farmer.is_wish
                date.timestamp = timestamped_date
                date.booking_id = farmer.booking_id
                date.is_farmer = farmer.booking_id != null;
                date.is_selected = farmer.is_selected
                date.farmer_id = farmer.id
                if (scope.hide && farmer.is_wish == 0 && !farmer.booking_id) {
                  // on n'affiche pas la date
                } else {
                  if (date.booking_id) {
                    scope.oneOrMoreDateAreFarmer = true
                  }
                  date.tooltip =  FarmerService.setTooltip(date, farmer)
                  scope.allDates.push(date)
                  if (date.is_farmer && farmer.is_selected != 1) {
                    scope.allFarmerDatesAreDone = false
                  }
                  if (!scope.nextDate) {
                    var momentDate = moment(timestamped_date)
                    scope.nextDate = {
                      day: momentDate.format("DD"),
                      month: momentDate.format('MMM')
                    }
                  }
                }
              }
            })
          }

          scope.noDate = scope.allDates.length == 0;

          getRequestStatus(scope);

        }
      }
      init();

      scope.getClasses = function (date, small) {
        const dateClass = FarmerService.getDateClass(date, small)
        return dateClass
      }

      function getRequestStatus(scope) {
        if (scope.getstatus && scope.cell) {
          RequestService.getRequestStatus(scope.request, function(status) {
            scope.requestStatus = status;
            scope.cell.success = 0;
            scope.cell.error = 0;
            scope.cell.warning = 0;
            if (status.success) {
              scope.cell.success = 1;
            } else if (status.error) {
              scope.cell.error = 1;
            } else if (status.warning) {
              scope.cell.warning = 1;
            }
          });
        }
      }

    }
  }
});

angular.module('Lantern').directive('linkedRequests', function (MediaItems, Notification, WorkflowHelperService) {
  return {
    templateUrl: 'partials/template/linked-requests.html',
    scope: {
      request: "=data"
    },
    link: function (scope) {
      scope.role = $.cookie('role');
      if (scope.request.linked_requests) {
        angular.forEach(scope.request.linked_requests, function(link) {
          if (link.workflow) {
            link.workflow.color = colorizeWorkflow(link.workflow);
            link.workflow.description = WorkflowHelperService.describeWorkflow(link.workflow);
          }
          link.itemsInRequest = [];
          if (link.media_items && scope.request.action_type.etape_type.name == 'livraison' && link.action_type.etape_type.name == 'fabrication') {
            let itemsArray = link.media_items.split(',');
            itemsArray.forEach(function(item) {
              if (item != "") {
                let newItem = MediaItems.get({
                  itemId: item
                }, function(i) {
                  if (i.reference == 1) {
                    i.reference = true;
                  } else {
                    i.reference = false;
                  }
                  if (i.original_request_id == link.id) {
                    link.itemsInRequest.push(i);
                  }
                });
              }
            });
          }
        });
      }
      scope.showNotifSuccess = function(text) {
        Notification.success(text);
      }
    }
  }
});

angular.module('Lantern').directive('stFilteredCollection', function () {
    return {
      restrict: 'A',
      require: '^stTable',
      scope: {
        stFilteredCollection: '='
      },
      controller: 'SetCodeSecuriteSubprojectDialogCtrl',
      link: function (scope, element, attr, ctrl) {

        scope.$watch(function () {
          return ctrl.getFilteredCollection();
        }, function (newValue, oldValue) {
          scope.stFilteredCollection = ctrl.getFilteredCollection();
        });
      }
    };
  });

angular.module("Lantern").directive('customOnChange', function() {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var onChangeFunc = scope.$eval(attrs.customOnChange);
      element.bind('change', onChangeFunc);
    }
  }
})