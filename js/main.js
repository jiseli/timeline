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

function loadDetails(obj, wrapper) {
  if (!wrapper) {
    wrapper = document;
  }
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) {
      var element = wrapper.querySelector('.' + attr);
      if (element) {
        if (obj[attr]) {
          element.innerHTML = format(obj[attr], attr);
        }else {
          element.innerHTML = '';
        }
      }
    }
  }
}

function format(value, type) {
  switch (type) {
    case 'start':
    case 'end':
      if (!isNaN(parseFloat(value))) {
        if (value < 0) {
          return Math.abs(value) + ' av. n. ère';
        }else{
          return value + ' de n. ère';
        }
      }else{
        return null;
      }
      break;
    case 'references':
      return '<a href="' + value + '">' + value + '</a>';
    default:
      return value;
  }
}

var eventDetailsWrapper = document.getElementById('event-details');
eventDetailsWrapper.querySelector('.close').addEventListener('click', function (e) {
  eventDetailsWrapper.style.display = 'none';
}, false);

getJSONEvents('events.json', function(events, res) {
  new Chronology({
    wrapper: 'timeline-wrapper',
    start: 1900,
    position: 1900,
    zoomInSelector: 'zoom-in-btn',
    zoomOutSelector: 'zoom-out-btn',
    resetSelector: 'reset-btn',
    events: events,
    ready: function (timeline) {
      // Attach "open details" to each event
      var events = timeline.getEvents();
      for (var i = 0; i < events.length; i++) {
        document.getElementById(events[i].id).addEventListener('click', function (e) {
          loadDetails(e.target.dataset, eventDetailsWrapper);
          eventDetailsWrapper.style.display = 'block';
        }, false);
      }
    }
  });
});
