/*!
 *
 *  Copyright (c) David Bushell | http://dbushell.com/
 *
 */
(function(window, document, undefined)
{
    var hasEventListeners = !!window.addEventListener,

        addEvent = function(el, e, callback, capture)
        {
            if (hasEventListeners) {
                el.addEventListener(e, callback, !!capture);
            } else {
                el.attachEvent('on' + e, callback);
            }
        },

        removeEvent = function(el, e, callback, capture)
        {
            if (hasEventListeners) {
                el.removeEventListener(e, callback, !!capture);
            } else {
                el.detachEvent('on' + e, callback);
            }
        },

        fireEvent = function(el, eventName, data)
        {
            var ev;
            if (document.createEvent) {
                ev = document.createEvent('HTMLEvents');
                ev.initEvent(eventName, true, false);
                ev = extend(ev, data);
                el.dispatchEvent(ev);
            } else if (document.createEventObject) {
                ev = document.createEventObject();
                ev = extend(ev, data);
                el.fireEvent('on' + eventName, ev);
            }
        },

        killEvent = function(e)
        {
            if (e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
        },

        trim = function(str)
        {
            return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g,'');
        },

        hasClass = function(el, cn)
        {
            return (' ' + el.className + ' ').indexOf(' ' + cn + ' ') !== -1;
        },

        addClass = function(el, cn)
        {
            if (!hasClass(el, cn)) {
                el.className = (el.className === '') ? cn : el.className + ' ' + cn;
            }
        },

        removeClass = function(el, cn)
        {
            el.className = trim((' ' + el.className + ' ').replace(' ' + cn + ' ', ' '));
        };


    var transformProp  = window.Modernizr.prefixed('transform'),
        transitionProp = window.Modernizr.prefixed('transition'),
        transitionEnd  = (function() {
            var props = {
                'WebkitTransition' : 'webkitTransitionEnd',
                'MozTransition'    : 'transitionend',
                'OTransition'      : 'oTransitionEnd otransitionend',
                'msTransition'     : 'MSTransitionEnd',
                'transition'       : 'transitionend'
            };
            return props.hasOwnProperty(transitionProp) ? props[transitionProp] : false;
        })();


    var console = window.console;
    if (typeof console !== 'object' || !console.log)
    {
        (function() {
            var noop    = function() {},
                methods = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile', 'profileEnd', 'markTimeline', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'],
                length  = methods.length;
            console = {};
            while (length--) {
                console[methods[length]] = noop;
            }
        }());
    }


    window.App = (function()
    {

        var _init = 0, app = { };

        var $win   = window,
            $docEl = document.documentElement;

        app.init = function()
        {
            if (_init++) {
                return;
            }

            app.initNavigation();

            app.initHeader();

            app.initSlides();

        };

        if ($win.addEventListener) {
            $win.addEventListener('DOMContentLoaded', app.init, false);
        } else if ($win.attachEvent) {
            $win.attachEvent('onload', function(e) { app.init(); });
        }

        app.initNavigation = function()
        {

            app.isNavOpen = false;

            var $nav = document.getElementById('nav'),
                $overlay = document.getElementById('overlay');

            app.openNav = function(e)
            {
                if (e) killEvent(e);
                app.isNavOpen = true;
                addClass($nav, 'nav--active');
                addClass($overlay, 'overlay--active');
            };

            app.closeNav = function(e)
            {
                if (e) killEvent(e);
                app.isNavOpen = false;
                removeClass($nav, 'nav--active');
                removeClass($overlay, 'overlay--active');
            };

            addEvent(document.getElementById('nav-open'), 'click', app.openNav, false);
            addEvent(document.getElementById('nav-close'), 'click', app.closeNav, false);
            addEvent(document.getElementById('overlay'), 'click', app.closeNav, false);

            addEvent(window, 'keydown', function(e)
            {
                if (e.which === 27) {
                    setTimeout(function() {
                        if (app.isNavOpen) app.closeNav();
                    }, 50);
                }
            }, false);

        };


        app.initHeader = function()
        {
            var scroll = { delta: 0, dist: 0, down: false, top: [0, 0] },
                $header = document.querySelector('.header--fixed'),
                header_height = 0;

            if (!$header) {
                return;
            }

            app.$header = $header;

            var onScroll = function(e)
            {
                scroll.top[0] = scroll.top[1];
                scroll.top[1] = window.pageYOffset || document.documentElement.scrollTop;

                scroll.down  = scroll.top[1] > scroll.top[0];
                scroll.delta = scroll.top[1] - scroll.top[0];

                if (scroll.top[1] > header_height) {
                    if (scroll.down) {
                        scroll.dist = 0;
                        addClass($header, 'header--active');
                        addClass($header, 'header--inactive');
                    } else {
                        scroll.dist += scroll.delta;
                        if (scroll.dist < -10) {
                            removeClass($header, 'header--inactive');
                        }
                    }
                } else {
                    removeClass($header, 'header--active');
                    removeClass($header, 'header--inactive');
                }

                clearTimeout(scroll.out);
                if (e) {
                    scroll.out = setTimeout(function() {
                        if ((window.pageYOffset || document.documentElement.scrollTop) <= 0) {
                            removeClass($header, 'header--active');
                            removeClass($header, 'header--inactive');
                        }
                    }, 300);
                }
            };

            var _onScroll = _.throttle(onScroll, 50);

            addEvent(window, 'scroll', _onScroll, false);
            addEvent(window, 'resize', _onScroll, false);
            addEvent(window, 'orientationchange', _onScroll, false);
        };


        app.createSlides = function(el)
        {
            var self = {
                $el       : el,
                _speed    : 500,
                _limit    : 800,
                _last     : 0,
                _active   : 0,
                _moving   : false,
                _ended    : false,
                _wheel    : { delta: 0, threshold: 2 },
                _scroll   : { delta: 0, dist: 0, down: false, top: [0, 0] },
                _drag     : { delta: 0, start: null, threshold: 20 },
                $nav      : el.getElementsByClassName('slides__nav')[0],
                $navlinks : el.getElementsByClassName('slides__nav-link'),
                $sections : el.getElementsByClassName('slides__section')
            };
            self._count = self.$sections.length;
            self._fullscreen = hasClass(self.$el, 'slides--fullscreen');

            var onTransitionEnd = function(e)
            {
                if (transitionEnd) {
                    removeEvent(self.$el, transitionEnd, onTransitionEnd, false);
                }
                if (self._active === (self._count - 1)) {
                    if (!self._ended) {
                        self._ended = true;
                        addClass(self.$el, 'slides--end');
                    }
                } else if (self._ended) {
                    self._ended = false;
                    removeClass(self.$el, 'slides--end');
                }
                _.each(self.$navlinks, function(el, i)
                {
                    if (i === self._active) {
                        addClass(el, 'slides__nav-link--active');
                    } else {
                        removeClass(el, 'slides__nav-link--active');
                    }
                });
                setTimeout(function() {
                    self._moving = false;
                }, self._limit - self._speed);
            };

            self.gotoScreen = function(index)
            {
                if (self._moving) {
                    return;
                }
                if (self.$sections[index].hasAttribute('data-reversed')) {
                    addClass(self.$nav, 'slides__nav--reversed');
                    if (app.$header) {
                        addClass(app.$header, 'header--reversed');
                    }
                } else {
                    removeClass(self.$nav, 'slides__nav--reversed');
                    if (app.$header) {
                        removeClass(app.$header, 'header--reversed');
                    }
                }
                _.each(self.$sections, function(el, i)
                {
                    if (i < index) {
                        addClass(el, 'slides__section--inactive');
                    } else {
                        removeClass(el, 'slides__section--inactive');
                    }
                });
                if (self._active === index) {
                    setTimeout(onTransitionEnd, 1);
                } else {
                    if (transitionEnd) {
                        addEvent(self.$el, transitionEnd, onTransitionEnd, false);
                    } else {
                        setTimeout(function() {
                            onTransitionEnd();
                        }, self._speed);
                    }
                }
                self._active = index;
                self._moving = true;

            };

            var prevScreen = function()
            {
                if (self._active > 0) {
                    self.gotoScreen(self._active - 1);
                }
            };

            var nextScreen = function()
            {
                if (self._active < self._count - 1) {
                    self.gotoScreen(self._active + 1);
                }
            };

            self.prevScreen = _.throttle(prevScreen, self._limit, { trailing: false });
            self.nextScreen = _.throttle(nextScreen, self._limit, { trailing: false });

            var onNavClick = function(e)
            {
                if (!hasClass(e.target, 'slides__nav-link')) {
                    return;
                }
                killEvent(e);
                self.gotoScreen(parseInt(e.target.getAttribute('data-section'), 10) - 1);
            };

            var onScroll = function(e)
            {
                self._scroll.top[0] = self._scroll.top[1];
                self._scroll.top[1] = window.pageYOffset || document.documentElement.scrollTop;
                self._scroll.down  = self._scroll.top[1] > self._scroll.top[0];
                self._scroll.delta = self._scroll.top[1] - self._scroll.top[0];

                if (self._fullscreen) {
                    if (self._ended && self._scroll.top[1] > 0) {
                        addClass(self.$el, 'slides--hide-nav');
                    } else {
                        removeClass(self.$el, 'slides--hide-nav');
                    }
                }
            };

            var _onMouseWheel = function()
            {
                if (self._wheel.delta === 1) {
                    self.prevScreen();
                } else if (self._wheel.delta === -1) {
                    self.nextScreen();
                }
                self._last = self._wheel.delta;
                self._wheel.delta = 0;
            };

            var _onMouseWheelDelayed = _.debounce(function() {
                self._last = 0;
            }, 50);

            var onMouseWheel = function(e)
            {
                if (app.isNavOpen) return;

                var wheel_delta = (e.detail < 0 || e.wheelDelta > 0) ? 1 : -1;
                if (self._fullscreen && self._ended) {
                    if (wheel_delta < 0 || self._scroll.top[1] > 0) {
                        return;
                    }
                }
                if (self._moving) {
                    killEvent(e);
                    return;
                }
                self._wheel.delta = wheel_delta;
                if (self._wheel.delta === self._last) {
                    killEvent(e);
                    _onMouseWheelDelayed(e);
                } else {
                    _onMouseWheel(e);
                }
            };

            var onTouchStart = function(e)
            {
                if (app.isNavOpen) return;

                if (hasClass(e.target, 'slides__nav-link')) {
                    onNavClick(e);
                    return;
                }
                if (self._drag.start !== null) {
                    return;
                }
                if (e.touches) {
                    if (e.touches.length > 1) {
                        return;
                    }
                    e = e.touches[0];
                }
                self._drag.start = e.clientY;
            };

            var onTouchMove = function(e)
            {
                if (self._drag.start === null) {
                    return;
                }
                if (!self._ended) {
                    killEvent(e);
                } else {
                    if (self._fullscreen) {
                        if (self._scroll.down || self._scroll.top[1] > 0) {
                            return;
                        }
                    }
                }
                if (e.touches) {
                    e = e.touches[0];
                }
                self._drag.delta = self._drag.start - e.clientY;
            };

            var onTouchEnd = function(e)
            {
                if (self._drag.start === null) {
                    return;
                }
                if (self._drag.delta >= self._drag.threshold) {
                    self.nextScreen();
                } else if (Math.abs(self._drag.delta) >= self._drag.threshold) {
                    self.prevScreen();
                }
                self._drag.start = null;
                self._drag.delta = 0;
            };

            if (hasClass(self.$el, 'slides--scroll'))
            {
                if ('onmousewheel' in window) {
                    addEvent(self._fullscreen ? window : self.$el, 'mousewheel', onMouseWheel, false);
                } else {
                    addEvent(self._fullscreen ? window : self.$el, 'DOMMouseScroll', onMouseWheel, false);
                }
            }

            if (hasClass(self.$el, 'slides--touch'))
            {
                if ('ontouchstart' in window) {
                    addEvent(self.$el, 'touchstart', onTouchStart, false);
                    addEvent(self.$el, 'touchmove', onTouchMove, false);
                    addEvent(self.$el, 'touchend', onTouchEnd, false);
                    addEvent(self.$el, 'touchcancel', onTouchEnd, false);
                }
            }

            addEvent(window, 'resize', _.throttle(onScroll, 100, { leading: false, trailing: true }), false);
            addEvent(window, 'orientationchange', _.throttle(onScroll, 100, { leading: false, trailing: true }), false);
            addEvent(window, 'scroll', onScroll, false);

            addEvent(self.$nav, 'click', onNavClick, false);

            self.gotoScreen(0);

            return self;
        };

        app.initSlides = function()
        {
            app._slides = [];
            var els = $docEl.getElementsByClassName('slides');
            _.each(els, function(el, i) {
                app._slides.push(app.createSlides(el));
            });
        };

        return app;

    })();

})(window, window.document);
