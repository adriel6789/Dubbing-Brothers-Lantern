Lantern.controller('CreateCustomTemplateCtrl', ['$scope', '$timeout', '$rootScope', '$anchorScroll', '$http', '$q', '$state', '$location', 'Project', '$cookies', '$stateParams', '$filter', 'ngDialog', 'Product', 'Valuelist', 'Subproject', 'Record', 'Request', 'Workflow', 'Return', 'MediaItems', 'RequestGroup', 'Attachments', 'Client', 'User', 'Group', 'FileUploader', 'Favorite', 'StepsList', 'Notification', 'ContextualInfo', 'Comment', 'ApiRest', 'Session', 'workflows',
  function($scope, $timeout, $rootScope, $anchorScroll, $http, $q, $state, $location, Project, $cookies, $stateParams, $filter, ngDialog, Product, Valuelist, Subproject, Record, Request, Workflow, Return, MediaItems, RequestGroup, Attachments, Client, User, Group, FileUploader, Favorite, StepsList, Notification, ContextualInfo, Comment, ApiRest, Session, workflows) {
    var rest = {};
    $scope.userTemplatesTab = true;
    $scope.totalSelected = 0;
    rest.getTemplates = function() {
      ApiRest.get('/tableausuivicustomtemplate', {}, function(response) {
        $scope.templates = response;
        $scope.user_templates = [];
        response.forEach(function(template) {
          if(template.user_id == Session.userId())
            $scope.user_templates.push(template);
        });
      }, function(error) {

      });
    };

    rest.addTemplate = function(params) {
      ApiRest.post('/tableausuivicolumns', {}, params, function(cells) {
        count += 1;
        ngDialog.close();
        if (count == templateSelected.list.length) {
          $rootScope.$broadcast('closeDialogWindow');
        };
      }, function(error) {

      });
    }
    rest.init = function() {
      rest.getTemplates();
    }();

    $scope.selectWorkflowPartElement = function(id, element) {
      $scope.workflowPartElementSelected[id] = !$scope.workflowPartElementSelected[id];
      if ($scope.workflowPartElementSelected[id]) {
        element.nbpCol++;
        $scope.totalSelected++;
      } else {
        element.nbpCol--;
        $scope.totalSelected--;
      }
    }

    $scope.save = function(templateSelected) {
      var count = 0;

      workflows.forEach(function(workflow) {
        templateSelected.list.forEach(function(element) {
          if (workflow.workflow_type_id == element.workflow_type_id) {
            if (!workflow.doublage_type_id && !element.doublage_type_id || workflow.doublage_type_id == element.doublage_type_id) {
              if (!workflow.norme_mix_id && !element.norme_mix_id || workflow.norme_mix_id == element.norme_mix_id) {
                if ($scope.workflowElementSelected[workflow.id + "_" + element.id]) {
                  ApiRest.post('/tableausuivicolumns', {}, {
                    tableausuivi_id: $scope.$parent.subproject.tableausuivi_id,
                    position: count,
                    action_id: element.action_id,
                    workflow_id: workflow.id,
                    type: workflow.norme_mix_id ? 'norme_mix' : 'other',
                    user_id: Session.userId()
                  }, function(cells) {
                    $scope.done = true;
                    $scope.delete = false;
                    $scope.doneDelete = false;
                    $scope.modify = false;
                    $scope.doneModify = false;
                    $scope.apply = false;
                    $scope.doneApply = false;
                  }, function(error) {

                  });
                  count += 1;
                }
              }
            }
          }
        });
      });
      $scope.nbCol = count;
    };
    $scope.close = function() {
      ngDialog.close();
      $rootScope.$broadcast('closeDialogWindow');
    }

    $scope.changeTab = function(userTemplatesTab) {
      $scope.userTemplatesTab = userTemplatesTab;
      $scope.templateSelected = undefined;
      $scope.workflowElementSelected = [];
      $scope.totalSelected = 0;
    }

    $scope.selectTemplate = function(template) {
      $scope.templateSelected = template;
      $scope.workflowElementSelected = [];
      $scope.totalSelected = 0;
      $scope.templateSelected.list.forEach(function(element) {
        element.nbCol = 0;
        workflows.forEach(function(workflow) {
          if (workflow.workflow_type_id == element.workflow_type_id) {
            if (!workflow.doublage_type_id && !element.doublage_type_id || workflow.doublage_type_id == element.doublage_type_id) {
              if (!workflow.norme_mix_id && !element.norme_mix_id || workflow.norme_mix_id == element.norme_mix_id) {
                $scope.workflowElementSelected[workflow.id + "_" + element.id] = true;
                element.nbCol++;
                $scope.totalSelected++;
              }
            }
          }
        });
      });
    }

    $scope.save = function(templateSelected) {
      var count = 0;

      workflows.forEach(function(workflow) {
        templateSelected.list.forEach(function(element) {
          if (workflow.workflow_type_id == element.workflow_type_id) {
            if (!workflow.doublage_type_id && !element.doublage_type_id || workflow.doublage_type_id == element.doublage_type_id) {
              if (!workflow.norme_mix_id && !element.norme_mix_id || workflow.norme_mix_id == element.norme_mix_id) {
                if ($scope.workflowElementSelected[workflow.id + "_" + element.id]) {
                  ApiRest.post('/tableausuivicolumns', {}, {
                    tableausuivi_id: $scope.$parent.subproject.tableausuivi_id,
                    position: count,
                    action_id: element.action_id,
                    workflow_id: workflow.id,
                    type: workflow.norme_mix_id ? 'norme_mix' : 'other',
                    user_id: Session.userId()
                  }, function(cells) {
                    $scope.done = true;
                    $scope.delete = false;
                    $scope.doneDelete = false;
                    $scope.modify = false;
                    $scope.doneModify = false;
                    $scope.apply = false;
                    $scope.doneApply = false;
                  }, function(error) {

                  });
                  count += 1;
                }
              }
            }
          }
        });
      });
      $scope.nbCol = count;
    };

    $scope.selectWorkflowElement = function(id, element) {
      $scope.workflowElementSelected[id] = !$scope.workflowElementSelected[id];
      if ($scope.workflowElementSelected[id]) {
        element.nbCol++;
        $scope.totalSelected++;
      } else {
        element.nbCol--;
        $scope.totalSelected--;
      }
    }

    $scope.saveDelete = function(template) {
      swal({
        title: $rootScope._T["g2lm6cmr"],
        text: $rootScope._T["lg4b51h0"],
        type: "warning",
        showCancelButton: true,
        cancelButtonText: $rootScope._T["ficbz281"],
        confirmButtonColor: "#DD6B55",
        confirmButtonText: $rootScope._T["5ygcxbsu"],
        closeOnConfirm: true
      }, function() {
        ApiRest.delete('/tableausuivicustomtemplatename/'+template.id+'?user_id='+Session.userId(), {}, function(response) {
          $scope.delete = false;
          $scope.doneDelete = true;
          $scope.modify = false;
          $scope.doneModify = false;
          $scope.done = false;
          $scope.apply = false;
          $scope.doneApply = false;
        }, function(error) {
        });
      });

    }

    $scope.saveModify = function(template) {
      swal({
        title: $rootScope._T["g2lm6cmr"],
        text: $rootScope._T["f7o60n0c"],
        type: "warning",
        showCancelButton: true,
        cancelButtonText: $rootScope._T["ficbz281"],
        confirmButtonText: $rootScope._T["5ygcxbsu"],
        closeOnConfirm: true
      }, function() {
        ApiRest.delete('/tableausuivicustomtemplate/'+template.id+'?user_id='+Session.userId(), {}, function(response) {
          let count = 0;
          for (var i = 0; i < $scope.columns.length; i++) {
            var column = $scope.columns[i];
            if (column.hide != "1" && column.action_id != null && column.workflow != null) {
              ApiRest.post('/tableausuivicustomtemplate', {}, {
                template_id: template.id,
                action_id: column.action_id ? column.action_id : null,
                workflow_type_id: column.workflow ? column.workflow.workflow_type.id : null,
                norme_mix_id: column.workflow ? column.workflow.norme_mix_id : null,
                doublage_type_id: column.workflow ? column.workflow.doublage_type_id : null,
                position: count
            }, function() {
                $scope.delete = false;
                $scope.doneDelete = false;
                $scope.modify = false;
                $scope.doneModify = true;
                $scope.done = false;
                $scope.apply = false;
                $scope.doneApply = false;
              }, function(error) {
              });
              count += 1;
            }
          }
        }, function(error) {
        });
      });

    }

    $scope.saveApply = function(templateSelected) {
      let count = 0;
      let promises = [];
      let columns = $scope.$parent.columns;
      $scope.isLoading = true;

      angular.forEach(columns, function(column) {
        column.hide = true;
        column.position = 0;
      });

      workflows.forEach(function(workflow) {
        templateSelected.list.forEach(function(element) {
          if (workflow.workflow_type_id == element.workflow_type_id) {
            if (!workflow.doublage_type_id && !element.doublage_type_id || workflow.doublage_type_id == element.doublage_type_id) {
              if (!workflow.norme_mix_id && !element.norme_mix_id || workflow.norme_mix_id == element.norme_mix_id) {
                if ($scope.workflowElementSelected[workflow.id + "_" + element.id]) {
                  let column = $filter('filter')(columns, {
                    workflow_id: workflow.id,
                    action_id: element.action_id
                  }, true);
                  if(column.length > 0) {
                    column[0].hide = false;
                    column[0].position = count;
                  } else {
                    let promise = addColumn(count, element.action_id, workflow, $scope.$parent.subproject.tableausuivi_id, Session.userId());
                    promises.push(promise);
                  }
                  count += 1;
                }
              }
            }
          }
        });
      });

      function addColumn(count, actionId, workflow, tableausuiviId, userId) {
        let deferred = $q.defer();

        ApiRest.post('/tableausuivicolumns', {}, {
          tableausuivi_id: tableausuiviId,
          position: count,
          action_id: actionId,
          workflow_id: workflow.id,
          type: workflow.norme_mix_id ? 'norme_mix' : 'other',
          user_id: userId
        }, function(newColumn) {
          columns.push(newColumn);
          deferred.resolve(newColumn);
        }, function(error) {
          deferred.reject(error);
        });

        return deferred.promise;
      }

      $q.all(promises).then(function(columnsResponse) {

        promises = [];
        angular.forEach(columns, function(column) {
          if(column.hide) {
            column.position = count;
          }
          let promise = reorder(column);
          promises.push(promise);
        });

        function reorder(column) {
          let deferred = $q.defer();

          ApiRest.put('/tableausuivicolumnsdisplay', {}, {
            column_id: column.id,
            position: column.position,
            hide: column.hide,
            user_id: Session.userId(),
          }, function(success) {
            deferred.resolve(success);
          }, function(error) {
            deferred.reject(error);
          });

          return deferred.promise;
        }

        $q.all(promises).then(function(response) {
          $scope.done = false;
          $scope.delete = false;
          $scope.doneDelete = false;
          $scope.modify = false;
          $scope.doneModify = false;
          $scope.apply = false;
          $scope.doneApply = true;
          $scope.isLoading = false;
          $scope.nbCol = count;
        });

      });

    };

  }
]);
