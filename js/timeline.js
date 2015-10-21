function Chronology(options) {
    this.config = {};

    var _self = this,
        _wrapper, _timeline, _events, _previous, _rows = [],
        _defaults = {
          scale:      50,                         // 1 year = 50 pixels
          increment:  10,                         // increase or decrease zoom of 10px
          position:   new Date().getFullYear(),   // place the user at current year
          start:      1,                          // start timeline at year 1
          end:        new Date().getFullYear(),   // end timeline at current year
          width:      200,                        // event item width
          height:     30,                         // event item height
          margin:     0,                          // event item vertical margin (margin between events rows)
          sizes:      {                           // at which scale size class are applied
            xl: 150,
            lg: 100,
            md: 50,
            sm: 20,
            xs: 10
          },
          events:     [],                         // events array (JSON)
                                                  // ie: [{
                                                  //  "start": 1969,
                                                  //  "end": null,
                                                  //  "title": "Apollo 11",
                                                  //  "description": "”One small step for [a] man, one giant leap for mankind.”"
                                                  // }]
          ready:   null                           // define a function called when timeline is ready
        };

    ////////////////////
    // Public methods //
    ////////////////////

    this.zoomIn = function () {
      _previous = _self.config.scale;
      _self.config.scale += _self.config.increment;
      _updateView();
    };

    this.zoomOut = function () {
      _previous = _self.config.scale;
      _self.config.scale -= _self.config.increment;
      if (_self.config.scale <= _self.config.increment) {
        _self.config.scale = _self.config.increment;
      }
      _updateView();
    };

    this.reset = function () {
      _previous = _self.config.scale;
      _self.config.scale = _defaults.scale;
      _updateView();
    };

    this.getEvents = function() {
      return _self.config.events;
    };

    this.scrollToEvent = function (el) {
      // Subtract the half of the viewport width (to center the position)
      _timeline.scrollLeft = Math.abs(_setOffset(el, true)) - (_wrapper.clientWidth / 2);
    };

    this.selectEvent = function(el) {
      if(el) {
        var highlights = _events.querySelectorAll('.highlight');
        for (var i = 0; i < highlights.length; i++) {
          _removeClass(highlights[i], 'highlight');
        }
        _addClass(el, 'highlight');
      }
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

          // Call "ready" callback function if defined
          if ( typeof _self.config.ready == 'function' ) {
            _self.config.ready(_self);
          }
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
          _setNumeralClass(i, item);
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

          // Set item ID
          var uuid = _guid('event');
          events[i].id = uuid;
          item.setAttribute('id', uuid);

          // Set item data
          for(attr in events[i]) {
            item.dataset[attr] = events[i][attr];
            if(attr == 'title') {
              item.setAttribute('title', events[i][attr]);
            }
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
        // Keep user on the current viewing year when zooming
        var offset = (_timeline.scrollLeft + (_wrapper.clientWidth / 2)) / _previous;
        var current = _self.config.start + offset;
        _self.config.position = (current > 0 ? current + 1 : current);

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

      // Set CSS class (size-xs, size-md, etc.)
      _setSizeClass(_self.config.scale);

      // Set timeline height (to see events in the viewport)
      _timeline.style.height = _timeline.children[0].clientHeight + _rows.length * _self.config.height + 'px';
    };

    /////////////
    // Setters //
    /////////////

    var _setOffset = function (item, returnValue) {
      var offset = (_self.config.start < 0 && item.dataset.start > 0 ? item.dataset.start - (_self.config.start + 1) : item.dataset.start - _self.config.start) * _self.config.scale;
      if (returnValue) {
        return offset;
      }else{
        item.style.left = offset + 'px';
      }
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
      item.style.top = item.dataset.row * (_self.config.height + _self.config.margin) + 'px';
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

    var _setNumeralClass = function (index, item) {
      if (index % 1000 == 0) {
        _addClass(item, 'thousand');
      } else {
        if (index % 100 == 0) {
          _addClass(item, 'hundred');
        } else {
          if (index % 10 == 0) {
            _addClass(item, 'decade');
          } else {
            if (index % 5 == 0) {
              _addClass(item, 'fifth');
            } else {
              if (index & 1) {
                if (index == 1) {
                  _addClass(item, 'year-one');
                } else {
                  _addClass(item, 'odd');
                }
              } else {
                _addClass(item, 'even');
              }
            }
          }
        }
      }
    };

    var _setSizeClass = function (scale) {
      // Remove old size class
      var oldSizeClass = _timeline.className.match(new RegExp(/(^|\s)size-\S+/g));
      if(oldSizeClass) {
        _removeClass(_timeline, oldSizeClass[0].trim());
      }

      if (scale > _self.config.sizes.xl) {
        _addClass(_timeline, 'size-gi');
      }

      if (scale > _self.config.sizes.lg  && scale <= _self.config.sizes.xl) {
        _addClass(_timeline, 'size-xl');
      }

      if (scale > _self.config.sizes.md  && scale <= _self.config.sizes.lg) {
        _addClass(_timeline, 'size-lg');
      }

      if (scale > _self.config.sizes.sm  && scale <= _self.config.sizes.md) {
        _addClass(_timeline, 'size-md');
      }

      if (scale > _self.config.sizes.xs  && scale <= _self.config.sizes.sm) {
        _addClass(_timeline, 'size-sm');
      }

      if (scale <= _self.config.sizes.xs) {
        _addClass(_timeline, 'size-xs');
      }
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

    var _guid = function(prefix) {
      if (prefix) {
        prefix = prefix + '-';
      }
      return prefix + Math.random().toString(36).substr(2, 16);
    };

    var _hasClass = function(el, cls) {
      return ('' + el.className).split(' ').indexOf(cls) >= 0;
    };

    var _addClass = function (el, cls) {
      if (!_hasClass(el, cls)) (el.className) ? el.className += ' ' + cls : el.className = cls;
    };

    function _removeClass(el, cls) {
      el.className = el.className.replace( new RegExp('(?:^|\\s)' + cls + '(?!\\S)'), '');
    }

    // When everything is done
    _init();
}
