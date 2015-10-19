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
  if (('' + wrapper.className).split(' ').indexOf('hasContent') < 0) {
    wrapper.className += ' hasContent';
  }
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) {
      var element = wrapper.querySelector('.' + attr);
      if (element) {
        if (obj[attr]) {
          var value = format(obj[attr], attr);
          if (value) {
            element.innerHTML = value;
            element.className = element.className.replace( new RegExp('(?:^|\\s)hidden(?!\\S)'), '');
          }else{
            element.innerHTML = '';
            if (('' + element.className).split(' ').indexOf('hidden') < 0) {
              element.className += ' hidden';
            }
          }
        }else {
          element.innerHTML = '';
          if (('' + element.className).split(' ').indexOf('hidden') < 0) {
            element.className += ' hidden';
          }
        }
      }
    }
  }
}

function format(value, type) {
  switch (type) {
    case 'start':
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
    case 'end':
      if (!isNaN(parseFloat(value))) {
        if (value < 0) {
          return ' à ' + Math.abs(value) + ' av. n. ère';
        }else{
          return ' à ' + value + ' de n. ère';
        }
      }else{
        return null;
      }
      break;
    case 'references':
      var references = value.split(',');
      var output = '';
      for (var i = 0; i < references.length; i++) {
        output += '<li><a href="' + references[i] + '">' + references[i] + '</a></li>';
      }
      return output;
    case 'categories':
      var categories = value.split(' ').filter(function(s){return s });
      var output = '';
      for(var i = 0; i < categories.length; i++) {
        var caption = categories[i];
        switch (categories[i]) {
          case 'technology':
            caption = 'Technologie';
            break;
          case 'discovery':
            caption = 'Découvertes';
            break;
          case 'science':
            caption = 'Science';
            break;
        }
        output += '<span class="label ' + categories[i] + '">' + caption + '</span>';
      }
      return output;
    default:
      return value;
  }
}

function truncate(string, limit, ellipsis) {
  var words = string.split(' ');
  var count = 0;
  var result = words.filter(function(word) {
    count += word.length;
    return count <= limit;
  });
  if ( result.length < words.length && ellipsis == true ) {
    return result.join(' ') + '...';
  }else{
    return result.join(' ');
  }
}

var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
var is_safari = navigator.userAgent.toLowerCase().indexOf('safari') > -1;
var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

function toggle(el, force) {
  if (('' + el.className).split(' ').indexOf('hidden') >= 0) {
    if (force) {
      el.className = el.className.replace( new RegExp('(?:^|\\s)hidden(?!\\S)'), force);
    }else{
      el.className = el.className.replace( new RegExp('(?:^|\\s)hidden(?!\\S)'), 'visible');
    }
  }else if (('' + el.className).split(' ').indexOf('visible') >= 0) {
    if (force) {
      el.className = el.className.replace( new RegExp('(?:^|\\s)visible(?!\\S)'), force);
    }else{
      el.className = el.className.replace( new RegExp('(?:^|\\s)visible(?!\\S)'), 'hidden');
    }
  }
}

function switchTab(target) {
  for (var i = 0; i < tabs.length; i++) {
    if ( tabs[i].hash.substring(1) != target.id ) {
      tabs[i].className = tabs[i].className.replace( new RegExp('(?:^|\\s)active(?!\\S)'), '');
    }else{
      if (('' + tabs[i].className).split(' ').indexOf('active') < 0) {
        tabs[i].className += ' active';
      }
    }
    var item = document.getElementById(tabs[i].hash.substring(1));
    toggle(item, 'hidden');
  }
  toggle(target);
}

var tabs = document.querySelectorAll('.tab');
for (var i = 0; i < tabs.length; i++) {
  var el = document.getElementById(tabs[i].hash.substring(1));
  if (tabs[i].dataset.active == 'true') {
    tabs[i].className += ' active';
    el.className += ' visible';
  }else{
    el.className += ' hidden';
  }
  tabs[i].addEventListener('click', function (e) {
    if (('' + e.target.parentNode.className).split(' ').indexOf('tab') >= 0) {
      var target = document.getElementById(e.target.parentNode.hash.substring(1));
    }else{
      var target = document.getElementById(e.target.hash.substring(1));
    }
    switchTab(target);
  }, false);
}

var eventDetailsWrapper = document.getElementById('event-details');
var eventsListWrapper = document.getElementById('events-list');
if(eventsListWrapper) {
  var list = document.createElement('ol');
}
var itemSelectCallback = function(el, context) {
  context.selectEvent(el);
  loadDetails(el.dataset, eventDetailsWrapper);
  switchTab(eventDetailsWrapper);
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
          item.className = 'visible';

          // Set item data
          for(attr in events[i]) {
            item.dataset[attr] = events[i][attr];
          }

          // Title
          var title = document.createElement('h3');
          title.innerHTML = events[i].title;
          title.className = 'title';
          title.dataset.id = events[i].id;
          title.addEventListener('click', function (e) {
            var el = document.getElementById(e.target.dataset.id);
            itemSelectCallback(el, timeline);
            timeline.scrollToEvent(el);
          }, false);
          item.appendChild(title);

          // Date
          var date = document.createElement('span');
          date.className = 'date';
          if ( events[i].end ) {
            date.innerHTML = events[i].start + ' - ' + events[i].end;
          }else{
            date.innerHTML = events[i].start;
          }
          item.appendChild(date);

          // Description
          var description = document.createElement('p');
          description.className = 'description';
          description.innerHTML = truncate(events[i].description, 100, true);
          item.appendChild(description);

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
                toggle(list.children[i], 'hidden');
              }else if (j + 1 == target.length && match == true ){
                toggle(list.children[i], 'visible');
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
