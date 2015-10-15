function Chronology(options) {
    this.config = {};

    var _self = this,
        _wrapper, _timeline, _events, _rows = [],
        _defaults = {
          scale:      50,                         // 1 year = 50 pixels
          increment:  10,                         // increase or decrease zoom of 10px
          position:   new Date().getFullYear(),   // place the user at current year
          start:      1,                          // start timeline at year 1
          end:        new Date().getFullYear(),   // end timeline at current year
          width:      200,                        // event item width
          height:     30,                         // event item height
          events:     []                          // events array (JSON)
                                                  // ie: [{
                                                  //  "start": 1969,
                                                  //  "end": null,
                                                  //  "title": "Apollo 11",
                                                  //  "description": "”One small step for [a] man, one giant leap for mankind.”"
                                                  // }]
        };

    ////////////////////
    // Public methods //
    ////////////////////

    this.zoomIn = function () {
      _self.config.scale += _self.config.increment;
      _updateView();
    };

    this.zoomOut = function () {
      _self.config.scale -= _self.config.increment;
      if (_self.config.scale <= _self.config.increment) {
        _self.config.scale = _self.config.increment;
      }
      _updateView();
    };

    this.reset = function () {
      _self.config.scale = _defaults.scale;
      _updateView();
    };

    /////////////////////
    // Private methods //
    /////////////////////

    var _init = function () {
      _self.config = _extend(_defaults, options);

      _wrapper = (_self.config.wrapper) ? document.getElementById(_self.config.wrapper) : document.body;

      _timeline = document.createElement('ol');
      _addClass(_timeline, 'timeline');

      _events = document.createElement('ol');
      _addClass(_events, 'events');

      var zoomInElement = document.getElementById(_self.config.zoomInSelector);
      if (zoomInElement) {
        zoomInElement.addEventListener('click', function () {
          _self.zoomIn();
        }, false);
      }

      var zoomOutElement = document.getElementById(_self.config.zoomOutSelector);
      if (zoomOutElement) {
        zoomOutElement.addEventListener('click', function () {
          _self.zoomOut();
        }, false);
      }

      var resetElement = document.getElementById(_self.config.resetSelector);
      if (resetElement) {
        resetElement.addEventListener('click', function () {
          _self.reset();
        }, false);
      }

      _drawTimeline(function () {
        _drawEvents(function () {
          _timeline.appendChild(_events);
          _wrapper.appendChild(_timeline);
          _updateView(true);
        });
      });
    };

    var _drawTimeline = function (callback) {
      for (var i = _self.config.start; i <= _self.config.end; i++) {
        if (i !== 0) {
          var item = document.createElement('li');
          var label = document.createElement('span');
          _addClass(label, 'label');
          label.innerHTML = i;
          item.appendChild(label);
          _setScale(item);
          _timeline.appendChild(item);
        }
      }
      if (typeof callback == 'function') {
        callback();
      }
    };

    var _drawEvents = function (callback) {
      if (_self.config.events.length) {
        var events = _self.config.events;

        // Sort chronologically
        events.sort(function (a, b) {
          if (a.start > b.start) {
            return 1;
          }
          if (a.start < b.start) {
            return -1;
          }
          // a must be equal to b
          return 0;
        });

        // Remove offscreen events
        events = events.filter(function (item) {
          return item.start >= _self.config.start && item.start <= _self.config.end;
        });

        for (var i = 0; i < events.length; i++) {
          var item = document.createElement('li');
          // Set item data
          for(attr in events[i]) {
            item.dataset[attr] = events[i][attr];
          }
          // Set item properties
          _setOffset(item);
          _setWidth(item);
          _setRow(item);
          _setContent(item);
          _setCategories(item);
          // Append ready item
          _events.appendChild(item);
        }
      }
      if (typeof callback == 'function') {
        callback();
      }
    };

    var _updateView = function (init) {
      // Prevent to loop entire timeline and events tree twice on initialization
      if (init !== true) {
        // Update timeline
        for (var i = 0; i < _timeline.children.length; i++) {
          _setScale(_timeline.children[i]);
        }

        // Update events
        _rows = [];
        for (var i = 0; i < _events.children.length; i++) {
          _setOffset(_events.children[i]);
          _setWidth(_events.children[i]);
          _setRow(_events.children[i]);
        }
      }

      // Set position after element is appended
      // ".clientWidth" need the element being appended to the DOM
      _setScroll(_self.config.position);

      // Set timeline height (to see events in the viewport)
      _timeline.style.height = _timeline.children[0].clientHeight + _rows.length * _self.config.height + 'px';
    };

    /////////////
    // Setters //
    /////////////

    var _setOffset = function (item) {
      item.style.left = (_self.config.start < 0 && item.dataset.start > 0 ? item.dataset.start - (_self.config.start + 1) : item.dataset.start - _self.config.start) * _self.config.scale + 'px';
    };

    var _setWidth = function (item) {
      var start = parseFloat(item.dataset.start);
      var end = parseFloat(item.dataset.end);

      // Convert pixels width in year (according to scale)
      var yearWidth = _self.config.width / _self.config.scale;

      // Skipping year 0
      if ( _self.config.start < 0 && start < 0 && (item.dataset.end > 0 || start + yearWidth + 1 > 0) ) {
        start = start + 1;
      }

      // Need to be stored to check availability
      item.dataset.width = start + yearWidth;

      if (isNaN(end)) {
        item.style.width = (parseFloat(item.dataset.width) - start) * _self.config.scale + 'px';
      } else {
        item.style.width = (end - start) * _self.config.scale + 'px';
      }
    };

    var _setRow = function (item) {
      _checkAvailability(item);
      item.style.height = _self.config.height + 'px';
      item.style.marginTop = item.dataset.row * _self.config.height + 'px';
    };

    var _setContent = function (item) {
      item.innerHTML = item.dataset.title;
    };

    var _setCategories = function (item) {
      var categories = item.dataset.categories.split(' ').filter(function(s){return s });
      for(var i = 0; i < categories.length; i++) {
        _addClass(item, categories[i]);
      }
    };

    var _setScale = function (item) {
      item.style.width = _self.config.scale + 'px';
    };

    var _setScroll = function (position) {
      var scrollLeft = (position > 0 ? _self.config.start - position + 1 : _self.config.start - position);
      // Subtract the half of the viewport width (to center the position)
      _timeline.scrollLeft = Math.abs(scrollLeft) * _self.config.scale - (_wrapper.clientWidth / 2);
    };

    /////////////
    // Helpers //
    /////////////

    var _checkAvailability = function (item) {
      var start = parseFloat(item.dataset.start);
      var end = parseFloat(item.dataset.end);
      if (!end) {
        end = parseFloat(item.dataset.width);
      }

      if (_rows.length) {
        for (var i = 0; i < _rows.length; i++) {
          for (var j = 0; j < _rows[i].length; j++) {
            if (!(end < _rows[i][j].start || start > _rows[i][j].end)) {
              // We reached the last row
              if (_rows[i + 1] == undefined) {
                item.dataset.row = i + 1;
                _rows.push([{
                  start: start,
                  end: end
                }]);
                return;
              } else {
                // Start checking on the next row
                break;
              }
            }

            // If no conflict were found
            if (j == _rows[i].length - 1) {
              item.dataset.row = i;
              _rows[i].push({
                start: start,
                end: end
              });
              return;
            }
          }
        }
      } else {
        // Nothing busy for first item
        item.dataset.row = 0;
        _rows[0] = [{
          start: start,
          end: end
        }]
      }
    };

    var _extend = function (obj1, obj2) {
      var obj3 = {};
      for (var attrname in obj1) {
        obj3[attrname] = obj1[attrname];
      }
      for (var attrname in obj2) {
        obj3[attrname] = obj2[attrname];
      }
      return obj3;
    }

    var _hasClass = function (el, cls) {
      return !!el.className.match(new RegExp(' (\\s | ^ )' + cls + ' (\\s | $)'));
    };

    var _addClass = function (el, cls) {
      if (!_hasClass(el, cls)) (el.className) ? el.className += ' ' + cls : el.className = cls;
    };

    var _removeClass = function (el, cls) {
      if (_hasClass(el, cls)) {
        var reg = new RegExp(' (\\s | ^ )' + cls + ' (\\s | $)');
        el.className = el.className.replace(reg, '');
      }
    };

    // When everything is done
    _init();
}
