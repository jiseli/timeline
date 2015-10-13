var xhr = new XMLHttpRequest();
xhr.open('GET', 'events.json', true);
xhr.onreadystatechange = function () {
  if (xhr.readyState == 4) {
    if (xhr.status == 200) {
      var events = JSON.parse(xhr.responseText);
    }else{
      var events = [];
    }

    var chronology = new Chronology({
      wrapper: 'timeline-wrapper',
      start: 1900,
      position: 1900,
      zoomInSelector: 'zoom-in-btn',
      zoomOutSelector: 'zoom-out-btn',
      resetSelector: 'reset-btn',
      events: events
    });
  }
};
xhr.send(null);
