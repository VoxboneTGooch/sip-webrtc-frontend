define(['jquery', 'bootstrap'], function(jQuery) {

  var EditSIPController = function($scope, $http, $window, $timeout) {

    $scope.savedSuccessfully = false;
    $scope.savingError = false;
    $scope.saveButtonText = 'Save Changes';
    var storedBrowserUsername;

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

    var reqEditUser = function (user) {
      return {
        method: 'PUT',
        url: '/api/editUser',
        headers: reqHeaders,
        data: user
      };
    };

    var reqCreateUser = function (apiBrowserUsername) {
      return {
        method: 'POST',
        url: '/api/createUser',
        headers: reqHeaders,
        data: { 'apiBrowserUsername' : apiBrowserUsername }
      };
    };

    $http(get_req)
      .then(function successCallback (response) {
        $scope.user = JSON.parse(response.data);
        storedBrowserUsername = $scope.user.browserUsername;

        if ($scope.user.registrarURI)
          $scope.registrar_enabled = true;
        else
          $scope.registrar_enabled = false;

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

      if (!$scope.registrar_enabled) {
        $scope.user.registrarURI = null;
        $scope.user.sipUsername = null;
        $scope.user.sipPassword = null;
      }

      if (storedBrowserUsername != $scope.user.sipUsername) {
        /*if the user changed his sipusername, we must create a new
        user in the api, since its required that browserUsername and
        sipUsername must be the same*/

        $http(reqCreateUser($scope.user.sipUsername))
          .then(function successCallback (response) {
            $http(reqEditUser($scope.user))
              .then(function successCallback (response) {
                $scope.savedSuccessfully = true;
              }, function errorCallback (response) {

              });
          }, function errorCallback (response) {
            console.log("error");
          });
      } else {
        /*if the sipusername is the same, we only update it */
        $http(reqEditUser($scope.user))
          .then(function successCallback (response) {
            $scope.savedSuccessfully = true;
          }, function errorCallback (response) {

          });
      }

    };
  };
  EditSIPController.$inject = ['$scope', '$http', '$window', '$timeout'];

  return EditSIPController;
});
