define([
  'controllers/browserNotifications',
  'bootstrap',
	'require'
  ], function(BrowserNotificationsController) {

  var PhoneController = function($scope, $http, $window, $timeout, $controller) {
    angular.extend(this, $controller(BrowserNotificationsController, {$scope: $scope}));
    $scope.callState = 'initial';
    $scope.phoneImg = '/images/vox-static-phone.png';
    var audio;
	  // voxbone = $window.voxboneObject || {};
	  // voxbone_2 = {};
	  var vox1 = {};

    function appendMessage(icon, message) {
      var elem = document.getElementById("status-message-list");

      if (!elem) return;

      elem
      .innerHTML += '<div class="call-info">\
                <span class="glyphicon glyphicon-' + icon + '"></span>\
                 ' + message + '\
              </div>';

      elem.scrollTop = elem.scrollHeight;
    }

    function setState(state, callee) {

      switch (state) {
        case 'waiting':
          $scope.callState = 'waiting';
          $scope.phoneImg = '/images/vox-static-phone.png';
          break;
        case 'receiving':

          if ($scope.browserNotifications)
            $scope.showNotification("Incoming Call. Click to see the phone");

          appendMessage('bell', 'Receiving call');
          $scope.callState = 'receiving';
          $scope.phoneImg = '/images/vox-ringing-phone.gif';
          //$scope.callMsg = "Incoming call from " + callee;
          break;
        case 'ongoing':
          //$scope.callMsg = "In call with " + callee;
          appendMessage('earphone', 'In Call');
          $scope.callState = 'ongoing';
          $scope.phoneImg = '/images/vox-hand-phone.png';
          break;
      }

      if(!$scope.$$phase)
        $scope.$apply();

    }

    function clearDevice(device){
      var micDots = document.querySelectorAll('.img-container #' + device +' div');
      Array.prototype.forEach.call(micDots, function(el, i) {
        el.classList.remove('active');
      });
    }

    function setMicDot(dot) {
      document.querySelector('#phone-microphone #mic' + dot).classList.add('active');
    }

    function setEapDot(dot) {
      document.querySelector('#phone-earphone #eap' + dot).classList.add('active');
    }

    function filterRegistrarURI (registrarURI) {

      if (!registrarURI)
        return null;

      var sipIndex = registrarURI.indexOf('sip:') + 4;
      var portIndex = registrarURI.search(/(?:[^sip]):\d+/) - 3;
      return registrarURI.substring(sipIndex).substring(0, portIndex).trim();
    }

    $scope.isCallOngoing = function() {
      return angular.equals($scope.callState, 'ongoing');
    };

    $scope.isCallReceiving = function() {
      return angular.equals($scope.callState, 'receiving');
    };

    $scope.getPhoneImage = function() {
      return $scope.phoneImg;
    };

    $scope.init = function (config, ringtone, email, browserNotifications) {
      var req_url;
      var now;
      var constraints = {
        video: false,
        audio: true
      };

      $scope.gumPermission = false;
      navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

      if (navigator.getUserMedia) {
        navigator.getUserMedia(constraints, function() {
          $scope.gumPermission = true;
          appendMessage('ok', 'Microphone access granted');
        }, function(){
          appendMessage('remove', 'Could not access microphone');
        });
      } else {
        appendMessage('remove', 'Your browser does not support accessing your microphone, please try again in either Chrome, Firefox or Opera');
      }

      appendMessage('time', 'Waiting for Registration');

      if (browserNotifications)
        $scope.browserNotifications = JSON.parse(browserNotifications);

      if (config.apiBrowserName)
        req_url = '/api/userInfo?apiBrowserName=' + encodeURIComponent(config.apiBrowserName);
      else
        req_url = '/api/userInfo';

      var reqHeaders = {
        'Content-Type': 'application/json; charset=utf-8'
      };
      var get_req = {
        method: 'GET',
        url: req_url,
        headers: reqHeaders
      };

      $http(get_req)
      .then(function successCallback (response) {
        $scope.user = JSON.parse(response.data);
        $scope.registrar = filterRegistrarURI($scope.user.registrarURI);
        audio = new Audio('/audio/' + ringtone + '.ogg');

	      requirejs.config({
		      paths: {
			      voxbone: "http://localhost:3000/javascripts/demo/voxbone"
		      }
	      });

	      requirejs(['voxbone'],
		      function() {
			      var voxbones = new Voxbone([{
				      sipUsername: $scope.user.sipUsername,
				      sipPassword: $scope.user.sipPassword,
				      sipAuthUser: $scope.user.sipUsername,
				      sipRegistrar: $scope.registrar,
				      sipURI: 'sip:' + $scope.user.browserUsername + '@' + config.sip_gateway_domain
			      },
			      {
				      sipUsername: $scope.user.sipUsername,
				      sipPassword: $scope.user.sipPassword,
				      sipAuthUser: $scope.user.sipUsername,
				      sipRegistrar: $scope.registrar,
				      sipURI: 'sip:7500@' + config.sip_gateway_domain
			      }]);

			      console.log('after constructor');
			      console.log(voxbones);
			      vox1 = voxbones[0];
			      console.log(vox1);

			      // voxbone.WebRTC.configure({
			      //  sipUsername: $scope.user.sipUsername,
			      //  sipPassword: $scope.user.sipPassword,
			      //  sipAuthUser: $scope.user.sipUsername,
			      //  sipRegistrar: $scope.registrar,
			      //  sipURI: 'sip:' + $scope.user.browserUsername + '@' + config.sip_gateway_domain
			      // });

			      vox1.WebRTC.configuration.log_level = vox1.Logger.log_level.INFO;
			      //voxbone.WebRTC.configuration.ws_servers = [config.ws_server];

			      //exporting call logs
			      vox1.WebRTC.configuration.post_logs = true;
			      now = new Date($.now());
			      var call = {
				      call: {
					      'sip2webr.tc_email': email,
					      'sip2webr.tc_apiBrowsername': $scope.user.browserUsername,
					      'sip2webr.tc_callTime': now
				      }
			      };

			      vox1.WebRTC.webrtcLogs += JSON.stringify(call);
			      vox1.WebRTC.basicAuthInit(config.vox_username, config.vox_password);

			      //voxbone_2.WebRTC.basicAuthInit(config.vox_username, config.vox_password);

			      vox1.WebRTC.onCall = function (callee, cb) {
				      console.log('ON CALL!');
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

			      };
			      eventHandlersActions(vox1);
		      }
	      );


        }, function errorCallback (response) {

        });

	    function eventHandlersActions(voxbone) {
		    voxbone.WebRTC.customEventHandler.ended = function (e) {
			    appendMessage('phone-alt', 'Ended call');
			    appendMessage('time', 'Waiting for incoming call');
			    setState('waiting');
		    };

		    voxbone.WebRTC.customEventHandler.registered = function (e) {
			    appendMessage('ok', 'Registered');
			    appendMessage('time', 'Waiting for incoming call');
			    setState('waiting');
		    };

		    voxbone.WebRTC.customEventHandler.remoteMediaVolume = function (e) {
			    clearDevice('phone-earphone');
			    if (e.remoteVolume > 0.01) setEapDot('1');
			    if (e.remoteVolume > 0.10) setEapDot('2');
			    if (e.remoteVolume > 0.20) setEapDot('3');
		    };

		    voxbone.WebRTC.customEventHandler.localMediaVolume = function (e) {
			    clearDevice('phone-microphone');
			    if (e.localVolume > 0.01) setMicDot('1');
			    if (e.localVolume > 0.10) setMicDot('2');

			    $scope.hangCall = function () {
				    voxbone.WebRTC.hangup();
				    setState('waiting');
				    if (e.localVolume > 0.20) setMicDot('3');
			    };
		    };
	    }
    };

  };
  PhoneController.$inject = ['$scope', '$http', '$window', '$timeout', '$controller'];

  return PhoneController;
});
