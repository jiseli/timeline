function getJSONEvents(url, callback) {
  var events = [];
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      events = JSON.parse(xhr.responseText);
      if ( typeof callback == 'function' ) {
        callback(events, xhr);
      }
    }
  };
  xhr.send(null);
}

getJSONEvents('events.json', function(events, res) {
  new Chronology({
    wrapper: 'timeline-wrapper',
    start: 1900,
    position: 1900,
    zoomInSelector: 'zoom-in-btn',
    zoomOutSelector: 'zoom-out-btn',
    resetSelector: 'reset-btn',
    events: events,
    excluded: ['uncategorized', 'discovery']
  });
});
