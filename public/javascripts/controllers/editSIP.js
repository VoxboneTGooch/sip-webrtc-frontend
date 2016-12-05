define(['jquery', 'bootstrap'], function(jQuery) {

  var EditSIPController = function($scope, $http, $window, $timeout) {

    $scope.savedSuccessfully = false;
    $scope.savingError = false;
    $scope.saveButtonText = 'Save Changes';

    $scope.user = {};
    $scope.wirePlugins = function() {
      jQuery('[data-toggle="tooltip"]').tooltip();
    };

    var reqHeaders = {
      'Content-Type': 'application/json; charset=utf-8'
    };

    var get_req = {
      method: 'GET',
      url: '/api/userInfo',
      headers: reqHeaders
    };

    var reqUser = function (user) {
      return {
        method: 'PUT',
        url: '/api/editUser',
        headers: reqHeaders,
        data: user
      };
    };

    $http(get_req)
      .then(function successCallback (response) {
        $scope.user = JSON.parse(response.data);
      }, function errorCallback (response) {

      });

    $scope.addAllowedIp = function() {

      if (jQuery("#allowed-ips").children().last().find("input").val() &&
          jQuery("#allowed-ips").children().length < 5) {
        jQuery.get("/html/allowed-ip.html", function (data) {
          jQuery("#allowed-ips").append(data);
        });
      }

    };

    $scope.removeAllowedIp = function() {

      if (jQuery("#allowed-ips").children().length > 1)
        jQuery("#allowed-ips").children().last().remove();

    };

    $scope.saveConfig = function() {
      $http(reqUser($scope.user))
        .then(function successCallback (response) {
          $scope.savedSuccessfully = true;
        }, function errorCallback (response) {

        });
    };

  };
  EditSIPController.$inject = ['$scope', '$http', '$window', '$timeout'];

  return EditSIPController;
});
