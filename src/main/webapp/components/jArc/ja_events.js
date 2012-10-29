/// <reference path="ja_core.js" />

(function($)
{
    $.fn.$bind = function(eventType, handler, context)
    {
        /// <summary>
        ///     Attach an event handler to an event for the elements. This will inspect each element, using jQuery.bind() to bind to native events or jQuery UI events
        ///     and using jArc to bind to custom events
        ///     &#10; 1.0 - $bind(eventType, handler, context)
        ///     &#10; 1.1 - $bind(events) events = A map of one or more DOM event types and functions to execute for them (jQuery Only)
        /// </summary>
        /// <param name="eventType" type="String">
        ///     The name of the event (use the $.On enum)
        /// </param>
        /// <param name="handler" type="Function">
        ///     The event handle to attach
        /// </param>
        /// <param name="context" type="Function" optional="true">
        ///     The context to run the event in (value of 'this' pointer at execution time). If ommitted, the this pointer will be the Object/Element that fired the event (default jQuery behavior)
        /// </param>
        /// <returns type="jQuery">jQuery</returns>
        $.EV.add(this, eventType, handler, context);
        return this
    }

    $.fn.$unbind = function(eventType, handler)
    {
        /// <summary>
        ///     Remove a previously-attached event handler from the elements/objects. This will inspect each element, using jQuery.unbind() to remove native event + jQuery UI event handlers
        ///     and using jArc to remove to custom event handlers
        ///     &#10; 1.0 - $unbind(eventType, handler)
        ///     &#10; 1.1 - $unbind(event) event = An event object as passed to an event handler
        /// </summary>
        /// <param name="eventType" type="String">
        ///     The name of the event (use the $.On enum)
        /// </param>
        /// <param name="handler" type="Function" optional="true">
        ///     A reference to the actual function that was attached. A copy of the function will not work.
        /// </param>
        /// <returns type="jQuery">jQuery</returns>
        $.EV.remove(this, eventType, handler);
        return this;
    }

    $.fn.$trigger = function(eventType, event)
    {
        /// <summary>
        ///     Execute all handlers and behaviors attached to the matched elements for the given event type. (Also, see jQuery.customEvent as an alternative to jQuery.$trigger)
        ///     &#10; 1.0 - $trigger(eventType, event)
        ///     &#10; 1.1 - $trigger(eventType, props) props = A set of key-value pairs to include as members of the event object
        ///     &#10; 2.0 - $trigger(event) event = An already existing event object to use to fire as-is
        /// </summary>
        /// <param name="eventType" type="String">
        ///     The name of the event (use the $.On enum)
        /// </param>
        /// <param name="event" type="jQuery.Event|Event|Object" optional="true">
        ///     Either a javascript event / jQuery.Event to use merge into a new event and pass along, or a set of key-value pairs to store as members of the event object
        /// </param>
        /// <returns>The result (if any) returned by the chain of event handlers</returns>
        var arr = [this];
        return $.EV.fire.apply($.EV, Array.prototype.concat.apply(arr, arguments));
    }

    $.fn.customEvent = function(eventType, event, props)
    {
        /// <summary>
        ///     Create the jQuery Event object to be passed along to the events handlers for a custom event. trigger() must be called to initiate the event execution.
        /// </summary>
        /// <param name="eventType" type="String">
        ///     The name of the event (use the $.On enum)
        /// </param>
        /// <param name="event" type="jQuery.Event|Event" optional="true">
        ///     A jQuery or javascript event to merge into this event
        /// </param>
        /// <param name="props" type="Object" optional="true">
        ///     A set of key-value pairs to add to the new event object
        /// </param>
        /// <returns>A new jQuery.Event object, with a custom trigger() method to be called to initiate the event execution</returns>
        return $.EV._buildEvent(this.un$(), eventType, props, event);
    }

    $.fn.$appendTo = function(target)
    {
        /// <summary>
        ///     Insert every element in the set of matched elements to the end of the target. 
        ///     &#10; For DOM elements, this will use jQuery.appendTo()
        ///     &#10; For objects, this will attach this object as a child of the matched object(s) to enable event bubbling.
        /// </summary>
        /// <param name="target" type="jQuery|Object">
        ///     A selector, element, HTML string, or jQuery object; the matched set of elements will be inserted at the end of the element(s) specified by this parameter. For objects, the parent object to attach this object to.
        /// </param>
        /// <returns type="jQuery" />
        $.EV.append(target, this);
        return this;
    }

    $.fn.$append = function(content)
    {
        /// <summary>
        ///     Insert content, specified by the parameter, to the end of each element in the set of matched elements.
        ///     &#10; For DOM element(s), HTML string(s), or jQuery object(s), this will use jQuery.append()
        ///     &#10; For objects, this will attach the matched object(s) as children of this object to enable event bubbling.
        ///     &#10; 1.0 - $append(content)
        ///     &#10; 1.1 - $append(function(index, html)) function(index, html) = A function that returns an HTML string, DOM element(s), or jQuery object. index = index in set, html = old HTML value of the element. 'this' = current element in set.
        /// </summary>
        /// <param name="content" type="jQuery|Object">
        ///     DOM element, HTML string, or jQuery object to insert at the end of each element in the set of matched elements. For objects, the child object(s) to attach as children of this object.
        /// </param>
        /// <returns type="jQuery" />
        $.EV.append(this, content);
        return this;
    }

    $.On =
    {
        /* Native Mouse Events */
        Click: 'click', DblClick: 'dblclick', MouseDown: 'mousedown', MouseUp: 'mouseup',
        MouseEnter: 'mouseenter', MouseLeave: 'mouseleave',
        MouseOut: 'mouseout', MouseOver: 'mouseover',
        MouseMove: 'mousemove',

        /* Native Keyboard Events */
        KeyDown: 'keydown', KeyPress: 'keypress', KeyUp: 'keyup',

        /* Frame/Object Events */
        Abort: 'abort', ContextMenu: 'contextmenu', Error: 'error', Load: 'load',
        ReadyStateChange: 'readystatechange', Resize: 'resize', Scroll: 'scroll', Unload: 'unload',

        /* Native Form Events */
        Blur: 'blur', Change: 'change', Focus: 'focus', Input: 'input', Paste: 'paste',
        PropertyChange: 'propertychange', Select: 'select', Submit: 'submit',

        /* jQuery Events */
        FocusInJQ: 'focusin', FocusOutJQ: 'focusout',

        /* jQuery-UI Events */
        DragStartUI: 'dragstart', DragStopUI: 'dragstop', DropUI: 'drop', DragOverUI: 'dropover'
    }

    $.EV =
    {
        add: function(target, eventType, handler, context)
        {
            if (exists(target))
            {
                if ($.isFunction(handler) && exists(context))
                {
                    handler = $.proxy(handler, context);
                    context = null;
                }
                $.EV._customOrJQ($.EV._add, $.fn.bind, target, [eventType, handler, context]);
            }
        },
        remove: function(target, eventType, handler)
        {
            if (exists(target))
            {
                if (target instanceof $.Event)
                {
                    eventType = target.type;
                    target = target.target;
                }
                $.EV._customOrJQ($.EV._remove, $.fn.unbind, target, [eventType, handler]);
            }
        },
        fire: function(target, eventType, event)
        {
            if (exists(target))
                return $.EV._customOrJQ.apply($.EV, [$.EV._fire, $.fn.trigger, target, Array.prototype.slice.call(arguments, 1)]);
            return null;
        },
        append: function(parent, args)
        {
            // jQuery or Array
            if ($.is$(parent) || $.isArray(parent))
            {
                $.each(parent,
                    function(idx, obj)
                    {
                        $.EV.append(obj, args);
                    }
                );
            }
            // String or Element
            else if ($.isElement(parent) || $.isString(parent))
                $(parent).append(args);
            // Object
            else
            {
                var child, children = [];
                for (var i = 0; exists(child = args[i]); i++)
                {
                    if ($.is$(child))
                        children = children.concat(child.objects());
                    else
                        children = children.concat($(child).objects());
                }
                if (children.length > 0)
                {
                    if (!exists(parent.childNodes))
                        parent.childNodes = [];
                    $.each(children,
                        function(idx, obj)
                        {
                            if (exists(obj.parentNode))
                            {
                                var arrNew = [];
                                $.each(obj.parentNode.childNodes,
                                    function(idx, next)
                                    {
                                        if (next !== obj)
                                            arrNew.push(next);
                                    }
                                );
                                obj.parentNode.childNodes = arrNew;
                            }
                            parent.childNodes.push(obj);
                            obj.parentNode = parent;
                        }
                    );
                }
            }
        },
        isNative: function(eventType)
        {
            var toRet = false;
            $.each($.On,
            function(idx, str)
            {
                if (str === eventType)
                {
                    toRet = true;
                    return false;
                }
            });
            return toRet;
        },

        // For internal use only
        _evguid: 1,
        _cache: [],
        _guid: function() { return '' + ($.EV._evguid++) },
        _mapId: function(name)
        {
            var toRet = { type: '', uid: null };
            if ($.isStrVal(name))
            {
                var parts = name.split('.');
                toRet.type = parts[0].toLowerCase();
                if (parts.length > 1)
                    toRet.uid = parts.slice(1).join('.');
            }
            return toRet;
        },
        _stack: function(guid, type)
        {
            if ($.isStrVal(guid) && $.isString(type))
            {
                if (exists($.EV._cache[guid]))
                    return $.EV._cache[guid][type];
            }
            return null;
        },
        _customOrJQ: function(fnCustom, fnJQuery, target, args)
        {
            var toRet = null;
            if (exists(target))
            {
                if (target.jquery)
                {
                    $.each(target, function(idx, obj)
                    {
                        toRet = $.EV._customOrJQ(fnCustom, fnJQuery, obj, args);
                    });
                }
                else
                {
                    // TODO: How to handle custom events on DOM Wrappers/Elements
                    if (!$.isStrVal(target._guid) && target.nodeType && target[$._jaexpando] !== 'hybrid')
                        toRet = fnJQuery.apply($(target), args);
                    else
                        toRet = fnCustom.apply($.EV, [target].concat(args));
                }
            }
            return toRet;
        },
        _add: function(target, name, fn)
        {
            if ($.isStrVal(name))
            {
                var oName = $.EV._mapId(name);
                // Let jQuery handle native events on hybrids
                if (target[$._jaexpando] === 'hybrid' && $.EV.isNative(oName.type))
                    $(target).bind(name, fn);
                else
                {
                    if (!$.isStrVal(target._guid))
                        $.EV._cache[target._guid = $.EV._guid()] = {};
                    var oEvts = $.EV._cache[target._guid];
                    if (!oEvts[oName.type])
                        oEvts[oName.type] = new $.EV.Stack();
                    oEvts[oName.type].add(oName.uid, fn);
                }
            }
        },
        _remove: function(target, name, fn)
        {
            if ($.isStrVal(target._guid))
            {
                var oName = $.EV._mapId(name);
                // Let jQuery handle native events on hybrids
                if (target[$._jaexpando] === 'hybrid' && $.EV.isNative(oName.type))
                    $(target).unbind(name, fn);
                else
                {
                    var oStack = $.EV._stack(target._guid, oName.type);
                    if (exists(oStack))
                        oStack.remove(oName.uid, fn);
                }
            }
        },
        _fire: function(target, toFire, evt)
        {
            if (exists(toFire))
            {
                var pName = toFire, pEvt = evt;
                if (!$.isString(toFire))
                {
                    pName = toFire.type;
                    pEvt = toFire;
                }

                // If we don't already have a custom jQuery Event, create one
                if (!exists(pEvt) || pEvt[$._jaexpando] !== 'event')
                {
                    // If it's a hybrid and native event name, let jQuery handle it
                    if (target[$._jaexpando] === 'hybrid' && $.EV.isNative(pName.split('.')[0]))
                        return $(target).trigger(toFire, evt);
                    // Otherwise, create a jQuery Event
                    var props, event;
                    if (exists(pEvt))
                    {
                        if ($.isPlainObject(pEvt))
                            props = pEvt;
                        else
                            event = pEvt;
                    }
                    pEvt = $.EV._buildEvent(target, pName, props, event);
                }

                var stacks = [], curr = target;
                while (exists(curr) && !pEvt.isPropagationStopped())
                {
                    // While traversing the event path, only check for objects which have custom events attached
                    if ($.isStrVal(curr._guid))
                    {
                        var oStack = $.EV._stack(curr._guid, pEvt.type);
                        if (exists(oStack))
                        {
                            var handlers = oStack.getHandlers(pEvt.namespace);
                            for (var k = 0; k < handlers.length && !pEvt.isImmediatePropagationStopped(); k++)
                            {
                                pEvt.currentTarget = curr;
                                var res = handlers[k].call(curr, pEvt);
                                if (res !== undefined)
                                {
                                    pEvt.result = res;
                                    if (res === false)
                                    {
                                        pEvt.preventDefault();
                                        pEvt.stopPropagation();
                                    }
                                }
                            }
                        }
                    }
                    curr = curr.parentNode;
                }
                if (!$.isStrVal(pEvt.namespace) && !pEvt.isDefaultPrevented() && $.isFunction(target[pEvt.type]))
                    target[pEvt.type]();
                return pEvt.result;
            }
            return null;
        },
        _buildEvent: function(target, type, props, evt)
        {
            var oName = $.EV._mapId(type);
            var $orig = null;
            if (exists(evt))
            {
                // If a custom event is passed, preserved $originalEvent
                if (evt[$._jaexpando] === 'event')
                    $orig = evt.$originalEvent;
                // If a jQuery event is passed, set as $originalEvent
                else if (evt[$.expando])
                    $orig = evt;
                // If a native event is passed, let jQuery normalizes it
                else
                    $orig = $.event.fix(evt);
            }
            props = $.extend($.valOrDef(props, {}),
            {
                namespace: oName.uid,
                target: target,
                currentTarget: target,
                relatedTarget: null,
                result: null,
                isDefaultPrevented: $.retFalse,
                $originalEvent: $orig,
                originalEvent: exists($orig) ? $orig.originalEvent : null,
                trigger: function() { return $.EV.fire(this.target, this) }
            }
        );
            props[$._jaexpando] = 'event';
            return $.Event(oName.type, props);
        }
    }

    $.EV.Stack = function()
    {
        this.init();
    }
    $.EV.Stack.prototype =
    {
        init: function()
        {
            this.order = [];
            this.evts = { '': [] };
        },
        add: function(uid, fn)
        {
            uid = $.isString(uid) ? uid : '';
            var stack = this.evts[uid];
            if (!exists(stack))
                this.evts[uid] = stack = [];
            this.order.push({ id: uid, idx: stack.length });
            stack.push(fn);
        },
        remove: function(uid, fn)
        {
            uid = $.isString(uid) ? uid : '';
            // Remove all handlers
            if (!$.isStrVal(uid))
            {
                this.init();
            }
            else
            {
                var arrOrder = [];
                // Find instances
                for (var i = 0; i < this.order.length; i++)
                {
                    var oInfo = this.order[i];
                    // Remove handlers
                    if (oInfo.id.equals(uid, true) && (!exists(fn) || this.evts[oInfo.id][oInfo.idx] === fn))
                        this.evts[oInfo.id][oInfo.idx] = null;
                    else
                        arrOrder.push(this.order[i]);
                }
                // Remove from order array
                this.order = arrOrder;
            }
        },
        getHandlers: function(uid)
        {
            var handlers = [];
            uid = $.isString(uid) ? uid : '';
            for (var i = 0; i < this.order.length; i++)
            {
                var oInfo = this.order[i];
                if (!$.isStrVal(uid) || oInfo.id.equals(uid, true))
                    handlers.push(this.evts[oInfo.id][oInfo.idx]);
            }
            return handlers;
        }
    }
})(jQuery);