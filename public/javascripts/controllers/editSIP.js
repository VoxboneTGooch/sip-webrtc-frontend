define(['jquery', 'bootstrap'], function(jQuery) {

  var EditSIPController = function($scope, $http, $window, $timeout) {

    $scope.reset = function() {
      this.onSubmitting = false;
      this.errorMessage = '';
      this.successMessage = '';
      this.titleText = 'Add a new remote SIP address';
      this.submitText = 'Add a SIP URI';
      this.skipText = 'Skip for now';
    };

    $scope.init = function() {
      this.wirePlugins();
      this.reset();
    };

    $scope.wirePlugins = function() {
      jQuery('[data-toggle="tooltip"]').tooltip();
    };

    $scope.skipURI = function(redirect_to) {
      $window.location.href = redirect_to;
    };

    $scope.sanitizeSipURI = function sanitizeSipURI(sip_uri) {
      var result = '';

      if (sip_uri) {
        var i = sip_uri.indexOf(':');
        result = 'sip:' + sip_uri.substring(i + 1).trim();
      }

      return result;
    };

    var reqHeaders = {
      'Content-Type': 'application/json; charset=utf-8'
    };
  };
  EditSIPController.$inject = ['$scope', '$http', '$window', '$timeout'];

  return EditSIPController;
});
