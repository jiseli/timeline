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

var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
var is_safari = navigator.userAgent.toLowerCase().indexOf('safari') > -1;
var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

var eventDetailsWrapper = document.getElementById('event-details');
eventDetailsWrapper.querySelector('.close').addEventListener('click', function (e) {
  eventDetailsWrapper.style.display = 'none';
}, false);

var eventsListWrapper = document.getElementById('events-list');
if(eventsListWrapper) {
  var list = document.createElement('ol');
}
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
      for (var i = 0; i < events.length; i++) {
        // Create events list
        if(eventsListWrapper) {
          var item = document.createElement('li');

          // Set item data
          for(attr in events[i]) {
            item.dataset[attr] = events[i][attr];
          }

          // Title
          var title = document.createElement('a');
          title.innerHTML = events[i].title;
          title.setAttribute('href', '#');
          title.className = 'title';
          title.dataset.id = events[i].id;
          title.addEventListener('click', function (e) {
            var el = document.getElementById(e.target.dataset.id);
            itemSelectCallback(el, timeline);
            timeline.scrollToEvent(el);
          }, false);
          item.appendChild(title);

          // Description
          var description = document.createElement('p');
          description.className = 'description';
          description.innerHTML = events[i].description;
          item.appendChild(description);

          // Start
          var start = document.createElement('span');
          start.className = 'start';
          start.innerHTML = events[i].start;
          item.appendChild(start);

          list.appendChild(item);
        }

        // Attach "open details" to each event
        document.getElementById(events[i].id).addEventListener('click', function (e) {
          itemSelectCallback(e.target, timeline);
        }, false);
      }
      if(eventsListWrapper) {
        eventsListWrapper.appendChild(list);
        var search = document.getElementById('search');
        var handler = function (e) {
          var filter = search.value;
          var regexp = RegExp(filter, 'i');
          for (var i = 0; i < list.children.length; i++) {
            var target = [];
            for(attr in list.children[i].dataset) {
              target.push(events[i][attr]);
            }
            var match = false;
            for (var j = 0; j < target.length; j++) {
              if ( target[j] && target[j].toString().search(RegExp(filter, 'i')) >= 0 ) {
                match = true;
              }
              if (j + 1 == target.length && match == false) {
                list.children[i].style.display = 'none';
              }else if (j + 1 == target.length && match == true ){
                list.children[i].style.display = 'list-item';
              }
            }
          }
        };

        if ( is_chrome || is_safari ) {
          search.addEventListener('search', handler, false);
        }else{
          search.addEventListener('keyup', handler, false);
        }
      }
    }
  });
});
