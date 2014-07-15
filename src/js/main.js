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


    // https://github.com/jashkenas/underscore/blob/master/underscore.js

    var _now = Date.now || function() { return new Date().getTime(); };

    var _throttle = function(func, wait, options)
    {
        var context, args, result;
        var timeout = null;
        var previous = 0;
        if (typeof options !== 'object') {
            options = { };
        }
        var later = function() {
          previous = options.leading === false ? 0 : _now();
          timeout = null;
          result = func.apply(context, args);
          context = args = null;
        };
        return function() {
          var now = _now();
          if (!previous && options.leading === false) previous = now;
          var remaining = wait - (now - previous);
          context = this;
          args = arguments;
          if (remaining <= 0 || remaining > wait) {
            clearTimeout(timeout);
            timeout = null;
            previous = now;
            result = func.apply(context, args);
            context = args = null;
          } else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
          }
          return result;
        };
    };


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

            app.initFullscreen();

        };

        if ($win.addEventListener) {
            $win.addEventListener('DOMContentLoaded', app.init, false);
        } else if ($win.attachEvent) {
            $win.attachEvent('onload', function(e) { app.init(); });
        }

        app.initNavigation = function()
        {

            app.isNavOpen = false;

            var $nav     = document.getElementById('nav'),
                $overlay = document.getElementById('overlay');

            app.openNav = function()
            {
                app.isNavOpen = true;
                addClass($nav, 'nav--active');
                addClass($overlay, 'overlay--active');
            };

            app.closeNav = function()
            {
                app.isNavOpen = false;
                removeClass($nav, 'nav--active');
                removeClass($overlay, 'overlay--active');
            };

            addEvent(document.getElementById('nav-open'), 'click', function(e)
            {
                killEvent(e);
                app.openNav();
            },
            false);

            addEvent(document.getElementById('nav-close'), 'click', function(e)
            {
                killEvent(e);
                app.closeNav();
            },
            false);

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


        app.initFullscreen = function()
        {

            var speed = 700,
                delay = 150,
                active = 0,
                moving = false,
                disabled = false;

            var wheel_delta     = 0,
                wheel_threshold = 2;

            var scroll_out,
                scroll_delta,
                scroll_dist = 0,
                scroll_down = false,
                scroll_top  = [0, 0];

            var drag_delta = 0,
                drag_start = null,
                drag_threshold = 50;

            var $fullscreen = document.querySelector('.fullscreen'),
                $nav        = $fullscreen.querySelector('.fullscreen__nav'),
                $links      = $fullscreen.querySelectorAll('.fullscreen__nav-link'),
                $sections   = $fullscreen.querySelectorAll('.fullscreen__section');

            var onTransitionEnd = function(e)
            {
                if (transitionEnd) {
                    removeEvent($fullscreen, transitionEnd, onTransitionEnd, false);
                }
                if (active === ($sections.length - 1)) {
                    if (!disabled) {
                        disabled = true;
                        addClass($fullscreen, 'fullscreen--disabled');
                    }
                } else if (disabled) {
                    disabled = false;
                    removeClass($fullscreen, 'fullscreen--disabled');
                }
                for (var i = 0; i < $links.length; i++) {
                    if (i === active) {
                        addClass($links[i], 'fullscreen__nav-link--active');
                    } else {
                        removeClass($links[i], 'fullscreen__nav-link--active');
                    }
                }
                setTimeout(function() {
                    moving = false;
                }, speed + delay);
            };

            app.gotoScreen = function(index)
            {
                wheel_delta = 0;
                if (moving) {
                    return;
                }
                active = index;
                moving = true;
                if (transitionEnd) {
                    addEvent($fullscreen, transitionEnd, onTransitionEnd, false);
                } else {
                    setTimeout(function()
                    {
                        onTransitionEnd();
                    }, speed);
                }
                for (var i = 0; i < $sections.length; i++) {
                    if (i < index) {
                        addClass($sections[i], 'fullscreen__section--inactive');
                    } else {
                        removeClass($sections[i], 'fullscreen__section--inactive');
                    }
                }
            };

            app.prevScreen = function()
            {
                if (active > 0) {
                    app.gotoScreen(active - 1);
                }
            };

            app.nextScreen = function()
            {
                if (active < $sections.length - 1) {
                    app.gotoScreen(active + 1);
                }
            };

            var onNavClick = function(e)
            {
                if (!hasClass(e.target, 'fullscreen__nav-link')) {
                    return;
                }
                killEvent(e);
                var index = parseInt(e.target.getAttribute('href').split('-')[1], 10);
                app.gotoScreen(index - 1);
            };

            var onScroll = function(e)
            {
                scroll_top[0] = scroll_top[1];
                scroll_top[1] = window.pageYOffset || document.documentElement.scrollTop;
                scroll_down  = scroll_top[1] > scroll_top[0];
                scroll_delta = scroll_top[1] - scroll_top[0];
            };

            var onWheel = function(e)
            {
                if (moving) {
                    killEvent(e);
                    return;
                }

                if (!disabled) {
                    killEvent(e);
                } else {
                    if (scroll_down || scroll_top[1] > 0) {
                        return;
                    }
                }

                if (e.detail < 0 || e.wheelDelta > 0) {
                    wheel_delta--;
                    if (Math.abs(wheel_delta) >= wheel_threshold) {
                        app.prevScreen();
                    }
                } else {
                    wheel_delta++;
                    if (wheel_delta >= wheel_threshold) {
                        app.nextScreen();
                    }
                }
            };

            var onTouchStart = function(e)
            {
                if (hasClass(e.target, 'fullscreen__nav-link')) {
                    onNavClick(e);
                    return;
                }
                if (drag_start !== null) {
                    return;
                }
                if (e.touches) {
                    if (e.touches.length > 1) {
                        return;
                    }
                    e = e.touches[0];
                }
                drag_start = e.clientY;
            };

            var onTouchMove = function(e)
            {
                if (drag_start === null) {
                    return;
                }
                if (!disabled) {
                    killEvent(e);
                } else {
                    if (scroll_down || scroll_top[1] > 0) {
                        return;
                    }
                }
                if (e.touches) {
                    e = e.touches[0];
                }
                drag_delta = drag_start - e.clientY;
            };

            var onTouchEnd = function(e)
            {
                if (drag_start === null) {
                    return;
                }
                if (drag_delta >= drag_threshold) {
                    app.nextScreen();
                } else if (Math.abs(drag_delta) >= drag_threshold) {
                    app.prevScreen();
                }
                drag_start = null;
                drag_delta = 0;
            };

            addEvent(window, 'scroll', _throttle(onScroll, 50), false);

            if ('onmousewheel' in window) {
                addEvent($fullscreen, 'mousewheel', _throttle(onWheel, 150), false);
            } else {
                addEvent($fullscreen, 'DOMMouseScroll', _throttle(onWheel, 150), false);
            }

            if ('ontouchstart' in window) {
                addEvent($fullscreen, 'touchstart', onTouchStart, false);
                addEvent($fullscreen, 'touchmove', onTouchMove, false);
                addEvent($fullscreen, 'touchend', onTouchEnd, false);
                addEvent($fullscreen, 'touchcancel', onTouchEnd, false);
            }

            addEvent($nav, 'click', onNavClick, false);

        };


        return app;

    })();

})(window, window.document);
