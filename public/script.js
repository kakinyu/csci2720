var url_external = "http://fundraising.one.gov.hk/fundraise_query/webservice/psi/json";
var url_local = "http://localhost:3000/";
String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
}
String.prototype.replaceAll = function(search, replacement) {
	var target = this;
	return target.replace(new RegExp(search, 'g'), replacement);
};
function setCookie(cname,cvalue,exdays) {
	var d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	var expires = "expires=" + d.toGMTString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
	var name = cname + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	for(var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') c = c.substring(1);
		if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
	}
	return "";
}
function checkCookie() {
	var user = getCookie("username");
	if (user != '') {
		$('.content').css('display', 'block');
		$('.notlogined').css('display','none');
		$('.logined').css('display','block');
		document.getElementById('status').innerText= user;
		setCookie("username", $('#status').html(), 1);
		if ($('#status').html() == 'Admin') $('.admin').css('display','block');
	} else {
		atStart();
	}
}
function reply(target) {
	var comment_form = '<div class="form-group"><label for="input-comment">Your comment</label><textarea class="form-control" name="input-comment" rows="5"></textarea></div>';
	if ($('#comment-form').length > 0) $('#comment-form').remove();
	var wrapper = document.createElement('form');
	wrapper.id = 'comment-form';
	wrapper.innerHTML = comment_form;
	target.parentNode.insertBefore(wrapper,target.nextSibling);
}
function load_wait() {
	$('.content').css('display','none');
	$('.load').css('top',($(window).height()/2-120).toString()+'px');
	$('.load').css('left',($(window).width()/2-120).toString()+'px');
	$('.load').css('display','block');
}
function load_finish() {
	$('.load').css('display','none');
	$('.content').css('display','block');
}
function history_event(eventid) {
	$('.modal-header').attr('data-row',eventid);
	$.get(url_local+"event/"+eventid, function(res) {
		var html = '';
		if ($('#status').text() == 'Admin') {
			var i = 0;
			for (key in res) {
				if (i > 1) {
					console.log(key+": "+res[key]);
					html += '<div class="item">';
					var val = res[key].replace(/<br>/g,'&#13;&#10;');
					var header = key.split(/(?=[A-Z])/).join(" ").capitalize();
					html += '<h5>' + header + '</h5>';
					if (key == 'dateTime') html += '<textarea rows="4" cols="50" data-col="'+key+'">'+val+'</textarea>';
					else html += '<input type="text" name="'+key+'" value="'+val+'">';
					html += '</div>';
				}
				i++;
			}
			$('.modal-body').html(html);
			$('#eventSubmit').off('click').on('click', function() {
				var data = {};
				data["eventId"] = $('.modal-header').attr('data-row');
				$('.modal-body').find('.item').each(function() {
					var dateTime = $(this).find('textarea');
					var input = $(this).find('input');
					if (dateTime.length == 0) data[input.attr('name')] = input.val();
					else data["dateTime"] = dateTime.val().replaceAll('\n','<br>');
				});
				$.ajax({
					url: url_local+'event/'+data["eventId"],
					method: 'PUT',
					data: data,
					success: function(res) {
						for (var k = 0; k < tds.length; k++) tds.eq(k).html(data[theads.eq(k).attr('data-col')]);
					}
				});
			});
			$('#eventDelete').css('display','block');
			$('#eventDelete').off('click').on('click', function() {
				var confirmed = confirm("Are you sure to delete this event?");
				if (confirmed) {
					var eventid = $('.modal-header').attr('data-row');
					$.ajax({
						url: url_local+'event/'+eventid,
						method: 'DELETE',
						data: {eventId: eventid},
						success: function(res) {
							if (res == "Event delete success") $('tr[data-row='+eventid+']').css('display','none');
							console.log(res);
						}
					});
				}
			});
		} else {
			$.get(url_local+"comment", {filename: eventid+'.txt'},function(result) {
				if (result == "File not found") {
					html += '<div>';
					var i = 0;
					for (key in res) {
						if (i > 1) {
							html += '<div class="item">';
							var val = res[key].replace(/<br>/g,'&#13;&#10;');
							var header = key.split(/(?=[A-Z])/).join(" ").capitalize();
							html += '<h5>' + header + '</h5>';
							html += '<p>'+val+'</p>';
							html += '</div>';
						}
						i++;
					}
					html += '<p class="reply" onclick="reply(this)">Reply</p></div>';
					$('.modal-body').html(html);
				} else {
					$('.modal-body').html(result);
				}
			});
			$('#eventSubmit').off('click').on('click', function() {
				if ($('#comment-form').length > 0) {
					var eventid = $(this).parent().parent().find('.modal-header').attr('data-row');
					var $new_comment = $("<li><ul><div class='comment'><h5></h5><p></p><p class='reply' onclick='reply(this)'>Reply</p></div></ul></li>");
					$new_comment.find('ul').css('list-style','none');
					$new_comment.find('h5').html($('#status').html());
					$new_comment.find('p:first').html($('#comment-form').find("textarea[name=input-comment]").val());
					$('#comment-form').parent().parent().append($new_comment);
					$('#comment-form').remove();
					$.post(url_local+"comment", {
						filename: eventid+'.txt',
						data: $('.modal-body').html()
					});
				} else {
					$('#eventClose').click();
				}
			});
			$('#eventDelete').css('display','none');
		}
		$('#eventModal').modal('show');
	});
}
function register_event() {
	$('#eventTable tbody tr td:first-child').off('click').on('click', function() {
		var theads = $('#eventTable thead td');
		var parent = $(this).parent();
		var eventid = parent.attr('data-row');
		$('.modal-header').attr('data-row',eventid);
		if (window.location.href.lastIndexOf('#') == -1) window.location.href = window.location.href+"#"+eventid;
		else window.location.href = window.location.href.substring(0,window.location.href.lastIndexOf("#")+1)+eventid;
		var tds = parent.find('td');
		var html = '';
		if ($('#status').text() == 'Admin') {
			for (var i = 0; i < tds.length-1; i++) {
				html += '<div class="item">';
				var key = theads.eq(i).attr('data-col');
				var val = tds.eq(i).html().replace(/<br>/g,'&#13;&#10;');
				var header = key.split(/(?=[A-Z])/).join(" ").capitalize();
				html += '<h5>' + header + '</h5>';
				if (key == 'dateTime') html += '<textarea rows="4" cols="50" data-col="'+key+'">'+val+'</textarea>';
				else html += '<input type="text" name="'+key+'" value="'+val+'">';
				html += '</div>';
				$('.modal-body').html(html);
				$('#eventSubmit').off('click').on('click', function() {
					var data = {};
					data["eventId"] = $('.modal-header').attr('data-row');
					$('.modal-body').find('.item').each(function() {
						var dateTime = $(this).find('textarea');
						var input = $(this).find('input');
						if (dateTime.length == 0) data[input.attr('name')] = input.val();
						else data["dateTime"] = dateTime.val().replaceAll('\n','<br>');
					});
					$.ajax({
						url: url_local+'event/'+data["eventId"],
						method: 'PUT',
						data: data,
						success: function(res) {
							for (var k = 0; k < tds.length; k++) tds.eq(k).html(data[theads.eq(k).attr('data-col')]);
						}
					});
				});
			}
			$('#eventDelete').css('display','block');
			$('#eventDelete').off('click').on('click', function() {
				var confirmed = confirm("Are you sure to delete this event?");
				if (confirmed) {
					var eventid = $('.modal-header').attr('data-row');
					$.ajax({
						url: url_local+'event/'+eventid,
						method: 'DELETE',
						data: {eventId: eventid},
						success: function(res) {
							console.log(res);
						}
					});
				}
			});
		} else {
			$.get(url_local+"comment", {filename: parent.attr('data-row')+'.txt'},function(result) {
				if (result == "File not found") {
					html += '<div>';
					for (var i = 0; i < tds.length-1; i++) {
						html += '<div class="item">';
						var key = theads.eq(i).attr('data-col');
						var val = tds.eq(i).html().replace(/<br>/g,'&#13;&#10;');
						var header = key.split(/(?=[A-Z])/).join(" ").capitalize();
						html += '<h5>' + header + '</h5>';
						html += '<p>' + tds.eq(i).html() + '</p>';
						html += '</div>';
					}
					html += '<p class="reply" onclick="reply(this)">Reply</p></div>';
					$('.modal-body').html(html);
				} else {
					$('.modal-body').html(result);
				}
			});
			$('#eventSubmit').off('click').on('click', function() {
				if ($('#comment-form').length > 0) {
					var eventid = $(this).parent().parent().find('.modal-header').attr('data-row');
					var $new_comment = $("<li><ul><div class='comment'><h5></h5><p></p><p class='reply' onclick='reply(this)'>Reply</p></div></ul></li>");
					$new_comment.find('ul').css('list-style','none');
					$new_comment.find('h5').html($('#status').html());
					$new_comment.find('p:first').html($('#comment-form').find("textarea[name=input-comment]").val());
					$('#comment-form').parent().parent().append($new_comment);
					$('#comment-form').remove();
					$.post(url_local+"comment", {
						filename: eventid+'.txt',
						data: $('.modal-body').html()
					});
				} else {
					$('#eventClose').click();
				}
			});
			$('#eventDelete').css('display','none');
		}
		$('#eventModal').modal('show');
	});
}
function register_favourite() {
	$('#eventTable tbody tr td:last-child').on('click', function(){
		if ($(this).html().includes('far fa-heart')) {
			$(this).html('<i class="fas fa-heart"></i>');
			var targetid = $(this).parent().attr('data-row');
			var favs;
			var user = $("#status").text();
			$.get(url_local+"user/fav", {username:$("#status").text()}, function(res){
				favs = res[0]["favourite"] + ',' + targetid;
				$.ajax({
					url: url_local + "user/fav",
					method: 'PUT',
					data: {username: user, 
								favourite: favs},
					success: function(res){
						console.log(res);
					}
				});
			});
		}
		else {
			$(this).html('<i class="far fa-heart"></i>');
			var targetid = $(this).parent().attr('data-row');
			var user = $("#status").text();
			var favs;
			$.get(url_local+"user/fav", {username:$("#status").text()}, function(res){
				favs = res[0]["favourite"];
				favslist = favs.split(',');
				var index = favslist.indexOf(targetid);
				if (index > -1) {
					favslist.splice(index, 1);
					favs = favslist.join(',');
				}
				$.ajax({
					url: url_local + "user/fav",
					method: 'PUT',
					data: {username: user, 
								favourite: favs},
					success: function(res){
						console.log(res);
					}
				});
			});
		}
	});
}
function modify_favList(){
	$.get(url_local+"user/fav", {username: $("#status").text()})
	.then(function(res){
		var favs = res[0]['favourite'].split(',').map(Number);
		return (Promise.all(favs.map(id => {
			return new Promise((resolve, reject) => {
				$.get(url_local+"event/"+id, {})
				.then(function(res){
					// var eventname = res['activityName'];
					// resolve(eventname);
					resolve(res);
				});
			})
		})))
		.then((favsDetail)=>{
			// console.log(favsName);
			// for (var i in favsName){
			// 	// console.log(i);
			// 	if (typeof(favsName[i]) !== "undefined"){
			// 		let $new = "<a>"+favsName[i]+"</a>";
			// 		$(".sidenav").append($new);
			// 	}
			// }
			$('#favlist').html('');
			for (var i in favsDetail){
				if (favsDetail[i]){
					var str = "<div class='card card-fav hoverable' row='"+favsDetail[i]['eventId']+"'>";
					str += "<div class='card-body'>"
					str += "<h5 class='card-title'><span>"+ favsDetail[i]["activityName"]+ "</span></h5>"
					str += "<p class='card-text' style='display:none'><span>"+ favsDetail[i]["dateTime"] + "</span></p>"
					str += "<p class='card-text'>Location: <span>"+ favsDetail[i]["locationName"] + "</span></p>"
					str += "<p class='card-text'>Organization: <span>"+ favsDetail[i]["organizationName"] + "</span></p>"
					str += "<p class='card-text'>Department: <span>"+ favsDetail[i]["departmentName"] + "</span></p>"
					str += "<p class='card-text'><small class='text-muted'>Contact: <span>"+ favsDetail[i]["enquiryContact"]+"</span></small></p>"
					str += "</div>"
					str += "</div>"
					let $new = $(str);
					$('#favlist').append($new);
				}
			}
			$('.card-fav').on({
				mouseenter: function () {
						//stuff to do on mouse enter
						// console.log("hi");
						$(this).addClass('shadow-lg').css('cursor', 'pointer'); 
				},
				mouseleave: function () {
						//stuff to do on mouse leave
						$(this).removeClass('shadow-lg');
				}
			}); 
			$('.card-fav').off('click').on('click', function(){
				var theads = $('#eventTable thead td');
				var eventid = $(this).attr('row');
				$('.modal-header').attr('data-row',eventid);
				if (window.location.href.lastIndexOf('#') == -1) window.location.href = window.location.href+"#"+eventid;
				else window.location.href = window.location.href.substring(0,window.location.href.lastIndexOf("#")+1)+eventid;
				var tds = $(this).find('.card-body').children();
				var html = '';
				$.get(url_local+"comment", {filename: eventid+'.txt'},function(result) {
				if (result == "File not found") {
					html += '<div>';
					for (var i = 0; i < tds.length; i++) {
						html += '<div class="item">';
						var key = theads.eq(i).attr('data-col');
						var val;
						if (i == tds.length-1) val = tds.eq(i).find('small').find('span').html();
						else val = tds.eq(i).find('span').html();
						var header = key.split(/(?=[A-Z])/).join(" ").capitalize();
						html += '<h5>' + header + '</h5>';
						html += '<p>' + val + '</p>';
						html += '</div>';
					}
					html += '<p class="reply" onclick="reply(this)">Reply</p></div>';
					$('.modal-body').html(html);
				} else {
					$('.modal-body').html(result);
				}
				});

				$('#eventSubmit').off('click').on('click', function() {
				if ($('#comment-form').length > 0) {
					var eventid = $(this).parent().parent().find('.modal-header').attr('data-row');
					var $new_comment = $("<li><ul><div class='comment'><h5></h5><p></p><p class='reply' onclick='reply(this)'>Reply</p></div></ul></li>");
					$new_comment.find('ul').css('list-style','none');
					$new_comment.find('h5').html($('#status').html());
					$new_comment.find('p:first').html($('#comment-form').find("textarea[name=input-comment]").val());
					$('#comment-form').parent().parent().append($new_comment);
					$('#comment-form').remove();
					$.post(url_local+"comment", {
						filename: eventid+'.txt',
						data: $('.modal-body').html()
					});
				} else {
					$('#eventClose').click();
				}
				});
				$('#eventDelete').css('display','none');

				$('#eventModal').modal('show');
			});
		});
	})
}
function modify_table(data) {
	$.get(url_local+'user/fav', {username:$('#status').text()}, function(res){
		// console.log(res);
		// var favs = res[0]['favourite'].split(',');
		if (res) var favs = res[0]['favourite'].split(',').map(Number);
		// console.log(favs);
		var html = '';
		var theads = $('#eventTable thead td');
		for (var i = 0; i < data.length; i++) {
			html += '<tr data-row="'+data[i]["eventId"]+'">';
			for (var j = 0; j < theads.length-1; j++) html += '<td class="align-middle">' + data[i][theads.eq(j).attr('data-col')] + '</td>';
			if (favs.includes(data[i]["eventId"])) html += '<td class="align-middle"><i class="fas fa-heart"></i></td>';
			else html += '<td class="align-middle"><i class="far fa-heart"></i></td>';
			html += '</tr>';
		}
		document.getElementById('eventTableBody').innerHTML = html;
		register_event();
		register_favourite();
	});
}
function atStart(){
	$('.content').css('display','none');
	$('.notlogined').css('display','block');
	$('.logined').css('display','none');
	$('.admin').css('display', 'none');
	$('.sidenav').css('display', 'none');
	$('#status')[0].innerText = 'Guest';
	$('#eventTableBody').html('');
	$('.collapse').collapse('hide');
	$('.load').css('display','none');
}
window.addEventListener('popstate', function(evt) {
	if (window.location.href.lastIndexOf("#") > -1) history_event(window.location.href.substring(window.location.href.lastIndexOf("#")+1,window.location.href.length));
	else {
		if (($('#eventModal').data('bs.modal')||{})._isShown) $('#eventModal').modal('toggle');
	}
}, false);
$(document).ready(function() {
	if (window.location.href.lastIndexOf("#") > -1) history_event(window.location.href.substring(window.location.href.lastIndexOf("#")+1,window.location.href.length));
	$('[data-toggle="tooltip"]').tooltip({
		placement : 'bottom'
	});
	atStart();
	checkCookie();
	$('#eventTable thead td').on('click', function() {
		var theads = $('#eventTable thead td');
		var increasing = $(this).hasClass("increasing");
		theads.removeClass();
		if (increasing == false) $(this).attr('class','increasing');
		else $(this).attr('class','decreasing');
		var key = $(this).attr('data-col');
		var data = [];
		$('#eventTable tbody tr').each(function() {
			tmpData = {};
			tmpData["eventId"] = $(this).attr('data-row');
			var tds = $(this).find('td');
			for (var i = 0; i < tds.length-1; i++) { tmpData[theads.eq(i).attr('data-col')] = tds.eq(i).html(); };
			if (tds.eq(i).html().includes('far fa-heart')) tmpData[theads.eq(i).attr('data-col')] = 'false';
			else tmpData[theads.eq(i).attr('data-col')] = 'true';
			data.push(tmpData);
		});
		if (increasing == false) data.sort(function(a,b) { return a[key] < b[key] ? -1 : a[key] == b[key] ? 0 : 1; });
		else data.sort(function(a,b) { return a[key] > b[key] ? -1 : a[key] == b[key] ? 0 : 1; });
		modify_table(data);
	});
	$('#flushData').on('click', function() {
        document.getElementById("flushSound").play();
        load_wait();
		document.getElementById('eventTableBody').innerHTML = '';
		$.ajax({
			url: url_local+'comment',
			method: 'DELETE'
		});
		$.get(url_local+'user', {}, function(res){
			// console.log(res);
			for (var i in res){
				// console.log(i);
				$.ajax({
					url: url_local + "user/fav",
					method: 'PUT',
					data: {username: res[i]['username'], 
								favourite: "-1"},
					success: function(res){
						// console.log(res);
					}
				});
			}
		});
		$.ajax({
			url: url_local+'event',
			method: 'DELETE',
			success: async function(res) {
				const a = await $.get(url_external,{
				}, async function(res) {
					for (var i = 1; i <= Math.ceil(res.totalRecordsSearched/100); i++) {
						const a = await (async function(index) {
							const a = await $.get(url_external,{
								itemperpage: 100,
								page: index
							}, async function(res) {
								for (var j = 0; j < res.totalRecordsInCurrentPage; j++) {
									var activity = res.activities[j];
									var dateTime = '';
									for (var k = activity.schedule.length-1; k >= 0; k--) {
										dateTime += 'Date: ' + activity.schedule[k].dateFrom + ' to ' + activity.schedule[k].dateTo + '<br>';
										dateTime += 'Time: ' + activity.schedule[k].timeFrom + ' to ' + activity.schedule[k].timeTo + '<br>';
									}
									const b = await $.post(url_local+"event", {
										activityName: activity.activityNameEnglish,
										dateTime: dateTime,
										organizationName: activity.organisationNameEnglish,
										locationName: activity.locationNameEnglish == '' ? 'N.A.' : activity.locationNameEnglish,
										departmentName: activity.departmentNameEnglish,
										enquiryContact: activity.enquiryContact
									});
								}
								const c = await $.get(url_local+'event', async function(res) {
									modify_table(res);
								});
								if (index == Math.ceil(res.totalRecordsSearched/100)) load_finish();
							});
						})(i);
					}
				});
			}
		});
	});
	$('#getData').on('click', function() {
		$.get(url_local+'event', async function(res) {
			modify_table(res);
		});
	});
	$('#searchTable').on('click', function() {
		$.get(url_local+"event/search?"+$('select').val()+"="+$('#searchBox').val(),
		function(res) {
			modify_table(res);
		});
	});
	$('#loginButton').on('click', function(){
		$.get(url_local+"user/login", {username:$('#username').val(),password:$('#password').val()},
		function(res) {
			// alert(res.username + " " + res.password);
			if (res.length == 0){
				alert("Account not found");
			} else {
				alert("Login Success");
				$('.content').css('display', 'block');
				$('.notlogined').css('display','none');
				$('.logined').css('display','block');
				// $('.sidenav').css('display', 'block');
				document.getElementById('status').innerText= $('#username').val();
				// console.log("hih");
				setCookie("username", $('#username').val(), 1);
				$('#loginform')[0].reset();
			}
		});
	});
	$('#createACButton').on('click', function(){
		var user = $('#username').val();
		var pass = $('#password').val();
		var fav = "-1";
		if (user.length >=4 && user.length <= 20 && pass.length >= 4 && pass.length <= 20){
			$.post(url_local+"user", {username: user,password: pass, favorite: fav}, function(res){
				alert(res);
			});
			$('#updateuser').click();
		} else {
			alert("Register Fail, Please input 4-20 characters");
		}
	});
    $('#newEventButton').on('click', function(){
        var activityName = $('#activityName').val();
        var dateTime = $('#dateTime').val();
        var organizationName = $('#organizationName').val();
        var locationName = $('#locationName').val();
        var departmentName = $('#departmentName').val();
        var enquiryContact = $('#enquiryContact').val();
		if (activityName == '' || dateTime == '' || organizationName == '' || locationName == '' || departmentName == '' || enquiryContact == '') alert("Please fill in all the fields");
		else {
			$.post(url_local+"event", {activityName: activityName, dateTime: dateTime, organizationName: organizationName, locationName: locationName, departmentName: departmentName, enquiryContact: enquiryContact}, function(res){
				alert(res);
			});
			$('#newEventForm').find('input').each(function() { $(this).val(''); });
		}
	});
    $('#uploadCSVForm').submit(function(){
		$.ajax({
			url: url_local+'uploadCSV',
			type: 'POST',
			data: new FormData(this),
			processData: false,
			contentType: false,
			success: function() {
				$('#uploadCSVForm')[0].reset();
				alert("Upload CSV Success!")
			}
		});
		return false;
	});
	$('#logoutButton').on('click', function(){
		setCookie("username",$('#status').html(),0);
		$('#searchBox').val('');
		$('.content').css('display','none');
		$('.notlogined').css('display','block');
		$('.logined').css('display','none');
		$('.admin').css('display', 'none');
		$('.sidenav').css('display', 'none');
		$('#status')[0].innerText = 'Guest';
		$('#eventTableBody').html('');
		$('.collapse').collapse('hide');
		$('.sidenav').html('');
	});
	$('#adminButton').on('click', function(){
		alert("Admin Login Success");
		$('.content').css('display', 'block');
		$('.notlogined').css('display','none');
		$('.logined').css('display','block');
		$('.admin').css('display', 'block');
		document.getElementById('status').innerText = 'Admin';
		setCookie("username", 'Admin', 1);
	});
	$('#userinfo').on('click', function(){
		alert("Admin Login Success");
		$('.content').css('display', 'block');
		$('.notlogined').css('display','block');
		document.getElementById('status').innerText = 'Admin';
		$('#userInfoForm')[0].reset();
	});

	$('#favlistButton').on('click', function(){
			modify_favList();
			// $('#collapseFav').collapse();
	})
	

	$('#updateuser').on('click', function(){
		$('#alluser').html('');
		$.get(url_local+"user", {}, function(res){
			// console.log(res);
			for (var i in res){
				var username = res[i]['username'];
				var userpassword = res[i]['password'];
				str = "<div class='input-group'>"
				str +=	"<div class='input-group-prepend'>"
				str +=		"<span class='input-group-text'>User Name</span>"
				str += "</div>"
				str +=	"<input type='text' class='form-control changename' value='"+username+"'>"
				str +=	"<div class='input-group-prepend'>"
				str +=			"<span class='input-group-text'>Password</span>"
				str +=		"</div>"
				str +=	"<input type='password' class='form-control changepassword' value='"+userpassword+"'>"
				str += "<div class='input-group-append'>"
				str += "<button class='btn btn-outline-primary changeuserinfo' type='button'>Change!</button>"
				str += "</div>"
				str += "<div class='input-group-append'>"
				str += "<button class='btn btn-outline-danger deluserinfo' type='button'>Delete!</button>"
				str += "</div>"
				str += "</div>"
				// console.log(str);
				$new = $(str);
				$('#alluser').append($new);
			}
		})
	});

	$(document).on("click",".changeuserinfo",function() {
		// alert('fsfs');
		console.log($(this).parent().siblings('.changename')[0]['value']);
		console.log($(this).parent().siblings('.changepassword')[0]['value']);
		var changename = $(this).parent().siblings('.changename')[0]['value'];
		var changepassword = $(this).parent().siblings('.changepassword')[0]['value'];
		$.ajax({
			url: url_local+'user/username',
			method: 'PUT',
			data: {username: changename,
						 password: changepassword}, 
			success: function(res){
				console.log(res);
			}
		});
	});
	$(document).on("click",".deluserinfo",function() {
		// alert('fsfs');
		console.log($(this).parent().siblings('.changename')[0]['value']);

		// console.log($(this).parent().siblings('.changepassword')[0]['value']);
		var changename = $(this).parent().siblings('.changename')[0]['value'];
		// var changepassword = $(this).parent().siblings('.changepassword')[0]['value'];
		var self = $(this);
		$.ajax({
			url: url_local+'user/' + changename,
			method: 'DELETE',
			data: {username: changename}, 
			success: function(res){
				console.log(res);
				self.parent().parent().remove();
			}
		});
	});
	$(document).on("click","#createuser",function() {
		var user = $('#createUsername').val();
		var pass = $('#createPassword').val();
		var fav = "-1";
		if (user.length >=4 && user.length <= 20 && pass.length >= 4 && pass.length <= 20){
			$.post(url_local+"user", {username: user,password: pass, favorite: fav}, function(res){
				var $new_user = '<div class="input-group"><div class="input-group-prepend"><span class="input-group-text">User Name</span></div><input type="text" class="form-control changename" value="'+user+'"><div class="input-group-prepend"><span class="input-group-text">Password</span></div><input type="password" class="form-control changepassword" value="' + '1234567890qwertyuiop'+'"><div class="input-group-append"><button class="btn btn-outline-primary changeuserinfo" type="button">Change!</button></div><div class="input-group-append"><button class="btn btn-outline-danger deluserinfo" type="button">Delete!</button></div></div>';
				$('#alluser').append($new_user);
				$('#createUsername').val('');
				$('#createPassword').val('');
				alert(res);
			});
		} else {
			alert("Register Fail, Please input 4-20 characters");
		}	
	});
	$('#eventModal').on('hidden.bs.modal', function() {
		window.history.pushState("","",window.location.href.substring(0,window.location.href.lastIndexOf("#")));
	});
});
