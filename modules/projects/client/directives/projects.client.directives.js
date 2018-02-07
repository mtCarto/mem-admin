'use strict';

angular.module('projects')
  .directive('tmplProjectsList', directiveProjectsList)
  .directive('tmplProjectsList2', directiveProjectsList2)
  .directive('tmplProjectsSearch', directiveProjectsSearch)
  .directive('tmplProjectsMap', directiveProjectsMap)

  .directive('projectSearchChooser', function ($rootScope, $filter, $uibModal, NgTableParams, REGIONS, ProjectModel, _) {
    return {
      restrict: 'A',
      scope: {
        destination: '=',
        title: '=',
        singleselectmode: '=',
        searchmode: '='
      },
      link: function (scope, element) {
        element.on('click', function () {
          $uibModal.open({
            animation: true,
            templateUrl: 'modules/projects/client/views/project-search-chooser.html',
            size: 'lg',
            resolve: {
            },
            controllerAs: 's',
            controller: function ($filter,$scope, $uibModalInstance) {
              var s = this;
              s.title = scope.title;
              $scope.singleselectmode = scope.singleselectmode;

              s.searching = false;

              // search params...
              s.name = undefined;
              s.type = undefined;
              s.region = undefined;
              s.memPermitID = undefined;

              s.regions = REGIONS;


              $scope.projectList = [];
              $scope.tableParams = new NgTableParams ({count:10}, {dataset: $scope.projectList});

              $scope.checkboxes = { 'checked': false, items: {} };

              // watch for check all checkbox
              $scope.$watch('checkboxes.checked', function(value) {
                angular.forEach($scope.projectList, function(item) {
                  if (angular.isDefined(item._id)) {
                    $scope.checkboxes.items[item._id] = value;
                  }
                });
              });

              // watch for data checkboxes
              $scope.$watch('checkboxes.items', function(/* values */) {
                if (!$scope.projectList) {
                  return;
                }
                var checked = 0, unchecked = 0, total = $scope.projectList.length;
                angular.forEach($scope.projectList, function(item) {
                  checked += ($scope.checkboxes.items[item._id]) || 0;
                  unchecked += (!$scope.checkboxes.items[item._id]) || 0;
                });
                if ((unchecked === 0) || (checked === 0)) {
                  $scope.checkboxes.checked = (checked === total);
                  if (total === 0) {
                    $scope.checkboxes.checked = false;
                  }
                }
                // grayed checkbox
                angular.element(document.getElementById("select_all")).prop("indeterminate", (checked !== 0 && unchecked !== 0));
              }, true);

              $scope.toggleItem = function (item) {
                if ($scope.singleselectmode) {
                  // Deselect the other checkboxes.
                  if ($scope.checkboxes.items[item._id]) {
                    // Pop the others off it and set it only to 1.
                    $scope.checkboxes.items = [];
                    $scope.checkboxes.items[item._id] = true;
                  }
                }
              };

              s.cancel = function () {
                $uibModalInstance.dismiss('cancel');
              };

              s.ok = function () {
                // gather up the selected ones...
                var selected = [];
                angular.forEach($scope.projectList, function(item) {
                  if ($scope.checkboxes.items[item._id])
                  {selected.push(item);}
                });

                $uibModalInstance.close(selected);
              };

              s.search = function () {
                s.searching = true;
                $scope.projectList = [];
                ProjectModel.search(s.name, s.region, s.type, s.memPermitID)
                  .then(function (res) {
                    $scope.projectList = res;
                    $scope.tableParams = new NgTableParams ({count:10}, {dataset: $scope.projectList});
                    s.searching = false;
                    $scope.$apply();
                  }).catch(function (/* err */) {
                    s.searching = false;
                  });
              };

            }
          }).result.then(function (data) {
            if (_.isArray(scope.destination)) {
              scope.destination = data;
            } else {
              scope.destination = data[0];
            }
            $rootScope.$broadcast('PROJECT_SEARCH_CHOOSER_SELECTED', {projects: data});
          })
            .catch(function (/* err */) {
              // swallow rejected promise error
            });
        });
      }
    };
  });
// -----------------------------------------------------------------------------------
//
// DIRECTIVE: Projects List
//
// -----------------------------------------------------------------------------------
function directiveProjectsList() {
  var directive = {
    restrict: 'E',
    replace: true,
    templateUrl: 'modules/projects/client/views/projects-partials/projects-list.html',
    controller: 'controllerProjectsList',
    controllerAs: 'projectList',
    scope: {
      projects: '='
    }
  };
  return directive;
}
// -----------------------------------------------------------------------------------
//
// DIRECTIVE: Projects List
//
// -----------------------------------------------------------------------------------
function directiveProjectsList2 () {
  var directive = {
    restrict: 'E',
    templateUrl: 'modules/projects/client/views/projects-partials/projects-list.html',
    controller: 'controllerProjectsList2',
    controllerAs: 'projectList',
    scope: {
      projects: '=',
      title: '='
    }
  };
  return directive;
}
// -----------------------------------------------------------------------------------
//
// DIRECTIVE: Projects Search
//
// -----------------------------------------------------------------------------------
function directiveProjectsSearch() {
  var directive = {
    restrict: 'E',
    templateUrl: 'modules/projects/client/views/projects-partials/projects-search.html',
    controller: 'controllerProjectsSearch',
    controllerAs: 'projectsSearch'
  };
  return directive;
}
// -----------------------------------------------------------------------------------
//
// DIRECTIVE: Projects Map
//
// -----------------------------------------------------------------------------------
function directiveProjectsMap() {
  var directive = {
    restrict: 'E',
    replace: true,
    templateUrl: 'modules/projects/client/views/projects-partials/projects-map.html',
    controller: 'controllerProjectsList',
    controllerAs: 'projectList',
    scope: {
      projects: '='
    }
  };
  return directive;
}
