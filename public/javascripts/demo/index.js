var demo = null;

var username = null;

var selectedApproach = null;
var registered = false;
var video = false;

window.onload = function() {
	demo = new voxbone();
	// voxbone.WebRTC.authenticate($('#displayname').val(),$('#password').val());
	demo.on("consent", function(on) {
		// The WebRTC consent dialog is either on or off
		console.log("Consent dialog should be " + (on ? "on" : "off") + " now");
		if(on) {
			// Darken screen and show hint
			$.blockUI({ 
				message: '<div><img src="up_arrow.png"/></div>',
				css: {
					border: 'none',
					padding: '15px',
					backgroundColor: 'transparent',
					color: '#aaa',
					top: '10px',
					left: (navigator.mozGetUserMedia ? '-100px' : '300px')
				} });
		} else {
			// Restore screen
			$.unblockUI();
		}
	});
	demo.on("preview", function(stream) {
		// Local stream available/unavailable
		if(!stream) {
			// Stream not available anymore
			$('#videoleft').empty();
			return;
		}
		console.log("Local preview available:", stream);
		$('#videos').removeClass('hide').show();
		if($('#myvideo').length === 0)
			$('#videoleft').append('<video class="rounded centered" id="myvideo" width=320 height=240 autoplay muted="muted"/>');
		voxbone.attachMediaStream($('#myvideo').get(0), stream);
		$("#myvideo").get(0).muted = "muted";
		var videoTracks = stream.getVideoTracks();
		if(videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
			// No webcam
			$('#myvideo').hide();
			$('#videoleft').append(
				'<div class="no-video-container">' +
					'<i class="fa fa-video-camera fa-5 no-video-icon"></i>' +
					'<span class="no-video-text">No webcam available</span>' +
				'</div>');
		}
	});
	demo.on("incomingcall", function(caller, hasVideo) {
		// Notify user
		bootbox.hideAll();
		incoming = bootbox.dialog({
			message: "Incoming " + (hasVideo ? "video" : "audio") + " call from " + caller + "!",
			title: "Incoming call",
			closeButton: false,
			buttons: {
				success: {
					label: "Answer",
					className: "btn-success",
					callback: function() {
						incoming = null;
						$('#peer').val(caller).attr('disabled', true);
						$('#call').attr('disabled', true).unbind('click');
						$('#dovideo').attr('disabled', true);
						demo.acceptCall(hasVideo, function(err) {
							if(err) {
								bootbox.alert(err);
								cleanup();
								return;
							}
							$('#call').removeAttr('disabled').html('Hangup')
								  .removeClass("btn-success").addClass("btn-danger")
								  .unbind('click').click(doHangup);
						});
					}
				},
				danger: {
					label: "Decline",
					className: "btn-danger",
					callback: function() {
						incoming = null;
						demo.hangup();
					}
				}
			}
		});
	});
	demo.on("stream", function(stream) {
		// Remote stream available, update the UI
		if($('#remotevideo').length === 0) {
			// Prepare an ugly looking DTMF pad too
			$('#videoright').parent().find('h3').html(
				'Send DTMF: <span id="dtmf" class="btn-group btn-group-xs"></span>');
			$('#videoright').append(
				'<video class="rounded centered hide" id="remotevideo" width=320 height=240 autoplay/>');
			for(var i=0; i<12; i++) {
				if(i<10)
					$('#dtmf').append('<button class="btn btn-info dtmf">' + i + '</button>');
				else if(i == 10)
					$('#dtmf').append('<button class="btn btn-info dtmf">#</button>');
				else if(i == 11)
					$('#dtmf').append('<button class="btn btn-info dtmf">*</button>');
			}
			$('.dtmf').click(function() {
				demo.dtmf($(this).text());
			});
		}
		// Show the peer and hide the spinner when we get a playing event
		$("#remotevideo").bind("playing", function () {
			$('#remotevideo').removeClass('hide');
		});
		voxbone.attachMediaStream($('#remotevideo').get(0), stream);
		var videoTracks = stream.getVideoTracks();
		if(videoTracks === null || videoTracks === undefined || videoTracks.length === 0 || videoTracks[0].muted) {
			// No remote video
			$('#remotevideo').hide();
			$('#videoright').append(
				'<div class="no-video-container">' +
					'<i class="fa fa-video-camera fa-5 no-video-icon"></i>' +
					'<span class="no-video-text">No remote video available</span>' +
				'</div>');
		}
	});
	demo.on("losses", function(info) {
		if(info["direction"] === "outgoing") {
			toastr["warning"]("We lost many packets, maybe disable video?", "Losses!");
		} else {
			toastr["warning"]("The server lost many packets from us, maybe disable video?", "Losses!");
		}
	});
	demo.on("missedcalls", function(calls) {
		// Prepare table with the list of missed calls
		var table = '<table class="table table-striped">'+
			'<tbody><tr><th>Caller</th><th>When</th></tr>';
		for(var index in calls) {
			var call = calls[index];
			table += '<tr><td>' + call["missed"] + '</td><td>' + new Date(call["timestamp"]) + '</td></tr>';
		}
		table += '</tbody></table>';
		// Display it
		bootbox.dialog({
			title: "Missed calls",
			message: table
		});
	});
	demo.on("hangup", function() {
		// Call hangup or declined, alert the user and update the UI
		bootbox.alert("The call is over");
		cleanup();
	});
	demo.on("disconnectedWrapper", function() {
		// Lost connection to Wrapper
		//bootbox.alert("Disconnected from the wrapper");
		// TODO Anything we should do about that?
	});
	demo.on("connected", function() {
		// Connected to Frontend, reset/show controls
		toastr["info"]("Register to make or receive calls");
		$('#login').removeClass('hide').show();
		$('#username').removeAttr('disabled').text('').focus();
		$('#displayname').removeAttr('disabled').text('');
		$('#password').removeAttr('disabled').text('');
		$('#register').removeAttr('disabled').click(registerUsername);
		$('#registerset').removeAttr('disabled');
		$('#registerlist a').unbind('click').click(function() {
			selectedApproach = $(this).attr("id");
			$('#registerset').html($(this).html()).parent().removeClass('open');
			if(selectedApproach === "guest") {
				$('#password').empty().attr('disabled', true);
			} else {
				$('#password').removeAttr('disabled');
			}
			return false;
		});
		$('#phone').hide();
		$('#dovideo').removeAttr('disabled').val('');
		$('#peer').removeAttr('disabled').val('');
		$('#call').removeAttr('disabled').html('Call')
			.removeClass("btn-danger").addClass("btn-success")
			.unbind('click').click(doCall);
		$('#videos').hide();
	});
	demo.on("disconnected", function() {
		// Lost connection to Frontend
		bootbox.alert("Lost connection to Frontend Server", function() {
			window.location.reload();
		});
	});
};

// Helper to intercept enter on field
function checkEnter(field, event) {
	var theCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
	if(theCode == 13) {
		if(field.id == 'username' || field.id == 'password' || field.id == 'displayname')
			registerUsername();
		else if(field.id == 'peer')
			doCall();
		return false;
	} else {
		return true;
	}
}

function registerUsername() {
	if(selectedApproach === null || selectedApproach === undefined) {
		bootbox.alert("Please select a registration approach from the dropdown menu");
		return;
	}
	// Try a registration
	$('#username').attr('disabled', true);
	$('#displayname').attr('disabled', true);
	$('#password').attr('disabled', true);
	$('#register').attr('disabled', true).unbind('click');
	$('#registerset').attr('disabled', true);
	// Let's fill in the details
	var details = {};
	if(selectedApproach === "guest") {
		// We're registering as guests, no username/secret provided (but no incoming calls either)
		details["auth"] = "guest";
		var username = $('#username').val();
		if(username !== undefined && username !== null) {
			if(username === "" || username.indexOf("sip:") != 0 || username.indexOf("@") < 0) {
				bootbox.alert('Usernames are optional for guests: if you want to specify one anyway, though, please insert a valid SIP address (e.g., sip:goofy@example.com)');
				$('#username').removeAttr('disabled');
				$('#displayname').removeAttr('disabled');
				$('#register').removeAttr('disabled').click(registerUsername);
				$('#registerset').removeAttr('disabled');
				return;
			}
			details["uri"] = username;
		}
	} else {
		// var username = voxbone.WebRTC.configuration.authorization_user;
		// setTimeout(function () {
		// 	username = voxbone.WebRTC.configuration.authorization_user;
		// 	console.log(username);
		// }, 2000);
		var username = $('#username').val();
		console.log(username);
		if(username === "" || username.indexOf("sip:") != 0 || username.indexOf("@") < 0) {
			bootbox.alert('Please insert a valid SIP identity address (e.g., sip:goofy@example.com)');
			$('#username').removeAttr('disabled');
			$('#displayname').removeAttr('disabled');
			$('#password').removeAttr('disabled');
			$('#register').removeAttr('disabled').click(registerUsername);
			$('#registerset').removeAttr('disabled');
			return;
		}
		// var password = '';
		// setTimeout(function () {
		// 	password = voxbone.WebRTC.configuration.password;
		// 	console.log();
		// }, 2000);
		var password = $('#password').val();
		console.log(password);
		if(password === "") {
			bootbox.alert("Insert the username secret (e.g., mypassword)");
			$('#username').removeAttr('disabled');
			$('#displayname').removeAttr('disabled');
			$('#password').removeAttr('disabled');
			$('#register').removeAttr('disabled').click(registerUsername);
			$('#registerset').removeAttr('disabled');
			return;
		}
		details["uri"] = username;
		if(selectedApproach === "secret") {
			// Use the plain secret
			details["auth"] = "plain";
			details["secret"] = password;
		} else if(selectedApproach === "ha1secret") {
			var sip_user = username.substring(4, username.indexOf('@'));    /* skip sip: */
			var sip_domain = username.substring(username.indexOf('@')+1);
			details["auth"] = "ha1";
			details["secret"] = md5(sip_user+':'+sip_domain+':'+password);
		}
	}
	var displayname = $('#displayname').val();
	if (displayname) {
		details["display"] = displayname;
	}
	// Let's register!
	voxbone.WebRTC.setupInboundCalling(details, function(err) {
		if(err) {
			bootbox.alert('Registration failed: ' + err);
			$('#username').removeAttr('disabled');
			$('#displayname').removeAttr('disabled');
			if(selectedApproach !== "guest")
				$('#password').removeAttr('disabled');
			$('#register').removeAttr('disabled').click(registerUsername);
			$('#registerset').removeAttr('disabled');
			return;
		}
		// Registered!
		if(!registered) {
			registered = true;
			$('#phone').removeClass('hide').show();
			$('#call').removeAttr('disabled').html('Call')
				.removeClass("btn-danger").addClass("btn-success")
				.unbind('click').click(doCall);
			$('#peer').focus();
		}
	});
	return;
}

function doCall() {
	// Call someone
	$('#peer').attr('disabled', true);
	$('#call').attr('disabled', true).unbind('click');
	$('#dovideo').attr('disabled', true);
	var username = $('#peer').val();
	if(username === "") {
		bootbox.alert('Please insert a valid SIP address (e.g., sip:pluto@example.com)');
		$('#peer').removeAttr('disabled');
		$('#dovideo').removeAttr('disabled');
		$('#call').removeAttr('disabled').html('Call')
			.removeClass("btn-danger").addClass("btn-success")
			.unbind('click').click(doCall);
		return;
	}
	if(username.indexOf("sip:") != 0 || username.indexOf("@") < 0) {
		bootbox.alert('Please insert a valid SIP address (e.g., sip:pluto@example.com)');
		$('#peer').removeAttr('disabled').val("");
		$('#dovideo').removeAttr('disabled').val("");
		$('#call').removeAttr('disabled').html('Call')
			.removeClass("btn-danger").addClass("btn-success")
			.unbind('click').click(doCall);
		return;
	}
	// Call this URI
	doVideo = $('#dovideo').is(':checked');
	console.log("This is a SIP " + (doVideo ? "video" : "audio") + " call (dovideo=" + doVideo + ")"); 
	voxbone.WebRTC.call($('#peer').val(), doVideo, function(err) {
		if(err) {
			bootbox.alert(err);
			cleanup();
			return;
		}
	});
	$('#call').removeAttr('disabled').html('Hangup')
		  .removeClass("btn-success").addClass("btn-danger")
		  .unbind('click').click(doHangup);
}

function doHangup() {
	// Hangup a call
	$('#call').attr('disabled', true).unbind('click');
	demo.hangup();
	cleanup();
}

function cleanup() {
	$('#peer').removeAttr('disabled').val('');
	$('#dovideo').removeAttr('disabled').val('');
	$('#call').removeAttr('disabled').html('Call')
		.removeClass("btn-danger").addClass("btn-success")
		.unbind('click').click(doCall);
	$('#myvideo').remove();
	$('#remotevideo').remove();
	$('.no-video-container').remove();
	$('#videos').hide();
	$('#dtmf').parent().html("Remote UA");
}
