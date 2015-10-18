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

var eventsListWrapper = document.getElementById('events-list');
var itemSelectCallback = function(el, context) {
  context.selectEvent(el);
  loadDetails(el.dataset, eventDetailsWrapper);
  eventDetailsWrapper.style.display = 'block';
};

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
      var events = timeline.getEvents();
      if(eventsListWrapper) {
        var list = document.createElement('ol');
      }
      for (var i = 0; i < events.length; i++) {
        // Create events list
        if(eventsListWrapper) {
          var item = document.createElement('li');
          var title = document.createElement('a');
          title.innerHTML = events[i].title;
          title.setAttribute('href', '#');
          title.setAttribute('data-id', events[i].id);
          title.addEventListener('click', function (e) {
            var el = document.getElementById(e.target.dataset.id);
            itemSelectCallback(el, timeline);
            timeline.scrollToEvent(el);
          }, false);
          item.appendChild(title);
          list.appendChild(item);
        }

        // Attach "open details" to each event
        document.getElementById(events[i].id).addEventListener('click', function (e) {
          itemSelectCallback(e.target, timeline);
        }, false);
      }
      if(eventsListWrapper) {
        eventsListWrapper.appendChild(list);
      }
    }
  });
});
