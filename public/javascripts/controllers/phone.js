define(['jquery', 'bootstrap'], function(jQuery) {

  var PhoneController = function($scope, $http, $window, $timeout) {
    $scope.callMsg = "Waiting for registration...";
    var audio = new Audio('/audio/telephone-ring.ogg');
    $scope.callState = 'initial';
    $scope.phoneImg = '/images/vox-static-phone.png';
    $scope.init = function (agent_username, agent_password, vox_username, vox_password) {

      voxbone.WebRTC.configuration.log_level = voxbone.Logger.log_level.INFO;

      voxbone.WebRTC.username = agent_username;
      voxbone.WebRTC.password = agent_password;
      voxbone.WebRTC.basicAuthInit(vox_username, vox_password);

      voxbone.WebRTC.onCall = function (data, cb) {
        $scope.callState = 'incoming';
        $scope.phoneImg = '/images/vox-ringing-phone.gif';
        var callee = data.request.from.display_name;
        $scope.callMsg = "Incoming call from " + callee;
        audio.play();
        $scope.$apply();

        $scope.answerCall = function () {
            $scope.callMsg = "In call with " + callee;
            $scope.callState = 'inCall';
            $scope.phoneImg = '/images/vox-hand-phone.png';
            cb(true);
            audio.pause();
            audio.currentTime = 0;
        };
        $scope.declineCall = function () {
            $scope.callState = 'initial';
            $scope.phoneImg = '/images/vox-static-phone.png';
            //cb(false);
            $scope.callMsg = "Waiting for incoming call...";
            audio.pause();
            audio.currentTime = 0;
        };

      };

      voxbone.WebRTC.customEventHandler.ended = function(e) {
        $scope.callState = 'initial';
        $scope.phoneImg = '/images/vox-static-phone.png';
        $scope.$apply();
      };

      voxbone.WebRTC.customEventHandler.registered = function(e) {
        $scope.callMsg = "Waiting for incoming call...";
        $scope.phoneImg = '/images/vox-static-phone.png';
        $scope.$apply();
      };

      $scope.hangCall = function () {
        $scope.callMsg = "Waiting for incoming call...";
        $scope.phoneImg = '/images/vox-static-phone.png';
        voxbone.WebRTC.hangup();
      };
    };
  };
  PhoneController.$inject = ['$scope', '$http', '$window', '$timeout'];

  return PhoneController;
});
