/*!
 *
 *  Copyright (c) David Bushell | @dbushell | http://dbushell.com/
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

            var nav_open = false;

            var $nav     = document.getElementById('nav'),
                $overlay = document.getElementById('overlay');

            app.openNav = function()
            {
                nav_open = true;
                addClass($nav, 'nav--active');
                addClass($overlay, 'overlay--active');
            };

            app.closeNav = function()
            {
                nav_open = false;
                removeClass($nav, 'nav--active');
                removeClass($overlay, 'overlay--active');
            };

            addEvent(document.getElementById('nav-open'), 'click', function(e)
            {
                if (e.preventDefault) e.preventDefault(); else e.returnValue = false;
                app.openNav();
            },
            false);

            addEvent(document.getElementById('nav-close'), 'click', function(e)
            {
                if (e.preventDefault) e.preventDefault(); else e.returnValue = false;
                app.closeNav();
            },
            false);

            addEvent(document.getElementById('overlay'), 'click', app.closeNav, false);

            addEvent(window, 'keydown', function(e)
            {
                if (e.which === 27) {
                    setTimeout(function() {
                        if (nav_open) app.closeNav();
                    }, 50);
                }
            }, false);

        };

        if (window.addEventListener) {
            window.addEventListener('DOMContentLoaded', app.init, false);
        } else if (window.attachEvent) {
            window.attachEvent('onload', function(e) { app.init(); });
        }

        return app;

    })();

})(window, window.document);
