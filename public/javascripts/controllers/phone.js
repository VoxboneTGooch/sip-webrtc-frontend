define(['jquery', 'bootstrap'], function(jQuery) {

  var PhoneController = function($scope, $http, $window, $timeout) {
    $scope.callMsg = "Waiting for registration...";
    $scope.callState = 'initial';
    $scope.phoneImg = '/images/vox-static-phone.png';
    var audio;

    var reqHeaders = {
      'Content-Type': 'application/json; charset=utf-8'
    };

    var get_req = {
      method: 'GET',
      url: '/api/userInfo',
      headers: reqHeaders
    };

    function setState(state, callee) {

      switch (state) {
        case 'waiting':
          $scope.callMsg = "Waiting for incoming call...";
          $scope.callState = 'waiting';
          $scope.phoneImg = '/images/vox-static-phone.png';
          break;
        case 'receiving':
          $scope.callState = 'receiving';
          $scope.phoneImg = '/images/vox-ringing-phone.gif';
          $scope.callMsg = "Incoming call from " + callee;
          break;
        case 'ongoing':
          $scope.callMsg = "In call with " + callee;
          $scope.callState = 'ongoing';
          $scope.phoneImg = '/images/vox-hand-phone.png';
          break;
        default:
          alert("default");
      }

      if(!$scope.$$phase)
        $scope.$apply();

    }

    function clearDevice(device){
      jQuery('.img-container #' + device +' div').each(function(){
        jQuery(this).removeClass('active').removeClass('peak');
      });
    }

    function setMicDot(dot) {

      if (dot === '5')
        jQuery('#microphone #mic' + dot).addClass('peak');
      else
        jQuery('#microphone #mic' + dot).addClass('active');

    }

    function setEapDot(dot) {

      if (dot === '5')
        jQuery('#earphone #eap' + dot).addClass('peak');
      else
        jQuery('#earphone #eap' + dot).addClass('active');

    }

    $scope.init = function (vox_username, vox_password, ringtone) {

      $http(get_req)
      .then(function successCallback (response) {
        $scope.user = JSON.parse(response.data);
        audio = new Audio('/audio/' + ringtone + '.ogg');
        voxbone.WebRTC.configuration.log_level = voxbone.Logger.log_level.INFO;
        voxbone.WebRTC.username = $scope.user.sipUsername;
        voxbone.WebRTC.password = $scope.user.sipPassword;
        voxbone.WebRTC.configuration.uri = 'sip:' + $scope.user.browserUsername + '@workshop-gateway.voxbone.com';
        voxbone.WebRTC.basicAuthInit(vox_username, vox_password);

        voxbone.WebRTC.onCall = function (data, cb) {

          var callee = data.request.from.display_name;
          setState('receiving', callee);
          audio.play();

          $scope.answerCall = function () {
            cb(true);
            setState('ongoing', callee);
            audio.pause();
            audio.currentTime = 0;
          };

          $scope.declineCall = function () {
            cb(false);
          };

          voxbone.WebRTC.customEventHandler.failed = function(e) {
            setState('waiting');
            audio.pause();
            audio.currentTime = 0;
          };

        };

        }, function errorCallback (response) {

        });

      voxbone.WebRTC.customEventHandler.ended = function(e) {
        setState('waiting');
      };

      voxbone.WebRTC.customEventHandler.registered = function(e) {
        setState('waiting');
      };

      voxbone.WebRTC.customEventHandler.remoteMediaVolume = function(e) {
        clearDevice('earphone');
        if (e.remoteVolume > 0.01) setEapDot('1');
        if (e.remoteVolume > 0.05) setEapDot('2');
        if (e.remoteVolume > 0.10) setEapDot('3');
        if (e.remoteVolume > 0.20) setEapDot('4');
        if (e.remoteVolume > 0.30) setEapDot('5');
      };

      voxbone.WebRTC.customEventHandler.localMediaVolume = function(e) {
        clearDevice('microphone');
        if (e.localVolume > 0.01) setMicDot('1');
        if (e.localVolume > 0.05) setMicDot('2');
        if (e.localVolume > 0.10) setMicDot('3');
        if (e.localVolume > 0.20) setMicDot('4');
        if (e.localVolume > 0.30) setMicDot('5');
      };

      $scope.hangCall = function () {
        voxbone.WebRTC.hangup();
        setState('waiting');
      };
    };
  };
  PhoneController.$inject = ['$scope', '$http', '$window', '$timeout'];

  return PhoneController;
});
