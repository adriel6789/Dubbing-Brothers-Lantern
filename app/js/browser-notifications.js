function browserNotif(message) {
    var icon = "img/logo-230.png";
    var title = "Lantern - Nouvelle notification";

    //Conversion deu message et des options
    var message = message.replace(/<br ?\/?>/g, "\n");
    message = decode_utf8(message);
    message = stripHTML(message);
    var options = {
        body: message,
        icon: icon,
        dir : "auto"
    };

    if (!("Notification" in window)) {
        //alert("This browser does not support desktop notification");
    }
    else if (NotificationService.permission === "granted") {
        var notification = new NotificationService(title,options);
    }
    else if (NotificationService.permission !== 'denied') {
        NotificationService.requestPermission(function (permission) {
            if (!('permission' in Notification)) {
                NotificationService.permission = permission;
            }
            if (permission === "granted") {
                var notification = new NotificationService(title,options);
            }
        });
    }
}

function decode_utf8(s) {
  return decodeURIComponent(escape(s));
}

function stripHTML(html)
{
   var tmp = document.implementation.createHTMLDocument("New").body;
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}
