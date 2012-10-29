/// <reference path="ja_events.js" />
/// <reference path="ja_core.js" />

(function($)
{
    $.AJAX =
    {
        EnableLogging: false,
        // See http://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html#sec5.1.1 for HTTP protocol specification
        Req:
        {
            // 'Safe' Methods - No side-effects
            OPTIONS: "OPTIONS", // Request URI Options
            GET: "GET", // Send data to server
            HEAD: "HEAD", // Request URI without body
            TRACE: "TRACE",

            // Methods w/ server/external side-effects
            POST: "POST",  // Request URI
            PUT: "PUT", // Store data for URI
            DELETE: "DELETE", // Delete data for URI
            CONNECT: "CONNECT"
        },
        Accepts:
        {
            xml: "application/xml, text/xml",
            json: "application/json, text/javascript",
            script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript",
            all: ["*/"] + ["*"]
        },
        State:
        {
            Uninitialized: 0, // The object has been created, but not initialized (the open method has not been called).
            Open: 1, // The object has been created, but the send method has not been called.
            Sent: 2, // The send method has been called. responseText is not available. responseBody is not available.
            Receiving: 3, // Some data has been received. responseText is not available. responseBody is not available.
            Loaded: 4, // All the data has been received. responseText is available. responseBody is available. 
            Timeout: 5 // [CUSTOM STATE] The AJAX Request has Timed Out
        },
        On:
        {
            Success: 'ajaxsuccess',
            Error: 'ajaxerror',
            Timeout: 'ajaxtimeout',
            Complete: 'ajaxcomplete'
        }
    }

    $.AJAX.Request = function(oProps)
    {
        oProps = oProps || {};

        this.set_url(oProps.url)
            .set_headers(oProps.header);

        this.m_fAsync = oProps.async !== false;
        this.m_iTO = $.valOrDef(oProps.maxtime, 0);

        this.m_fSent = false;
        this.m_iLatency = 0;

        // By Default, all 200's & 304 will count as success
        var arr = {};
        for (var i = $.HTTP.OK; i <= $.HTTP.PartialContent; i++)
            arr[i] = true;
        arr[$.HTTP.NotModified] = true;
        arr[$.HTTP.GatewayTimeout] = false;
        this.m_oCodeMap = arr;
    }
    $.AJAX.Request.prototype =
    {
        // common methods
        send: function(request, event)
        {
            /// <summary>
            ///     Start the asynchronous HTTP (Ajax or script) request.
            ///     &#10;1 - send(request) 
            ///     &#10;2 - send(request, event)
            /// </summary>
            /// <param name="request" type="string" optional="true">
            ///     The data to pass via the POST body for POST's, or via the QueryString for GETs. Also can be passed as a set of key/value pairs to be converted as (prop)=(val)&amp;(prop2)=(val2)&amp;...
            /// </param>
            /// <param name="event" type="jQuery.Event" optional="true">
            ///     jQuery.Event object to store and use as the root event which triggering custom events
            /// </param>
            /// <returns type="$.AJAX.Request">The Plain AJAX Handler object (not jQuery wrapped)</returns>
            this._event = event || null;
            this._init(request);

            if (this.m_iTO > 0)
                this.m_oTO = setTimeout($.proxy(this._onTimeout, this), this.m_iTO);

            this.m_dtTS = new Date();
            this.m_iLatency = 0;
            this.m_fSent = true;

            if (exists(this.m_oXHR))
            {
                if ($.AJAX.EnableLogging)
                    $.log('XHR.send(' + this.m_sReq + ')');
                this.m_oXHR.send(this.m_sReq);
            }
            else if (exists(this.m_elScript))
            {
                if ($.AJAX.EnableLogging)
                    $.log('<head>.insertBefore(<script>, <head>.firstChild)');
                // Use insertBefore instead of appendChild  to circumvent an IE6 bug.
                // This arises when a base node is used (#2709 and #4378).
                this.m_elHead = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
                this.m_elHead.insertBefore(this.m_elScript, this.m_elHead.firstChild);
            }
            else
                this._onCompletion();

            return this;
        },
        cancel: function()
        {
            /// <summary>
            ///     Stop the AJAX request immediately. If the AJAX call has not completed, this will force the requst to stop, causing the ajaxerror event and ajaxcomplete events to fire.
            /// </summary>
            /// <returns value="this" />
            if (!this.isComplete())
            {
                if (this.m_oXHR)
                {
                    if ($.AJAX.EnableLogging)
                        $.log('XHR.abort()');
                    this.m_oXHR.abort();
                }
                else if (this.m_elScript)
                {
                    if ($.AJAX.EnableLoggin)
                        $.log('<script> -> forcing onabort event');
                    this.evt_script_onabort();
                }
            }
            return this;
        },
        getText: function()
        {
            /// <summary>
            ///     Get the AJAX response data as raw text
            /// </summary>
            /// <returns type="String" />
            return this.m_sText + ''
        },
        getJSON: function()
        {
            /// <summary>
            ///     Attempt to convert the AJAX response data into a JSON object.
            /// </summary>
            /// <returns type="Object" />
            if (!exists(this.m_oJSON))
            {
                if ($.isStrVal(this.m_sText))
                    this.m_oJSON = $.parseJSON(this.m_sText);
                else
                    this.m_oJSON = {};
            }
            return this.m_oJSON;
        },
        getXML: function()
        {
            /// <summary>
            ///     Attempt to convert the AJAX response data into an XML Document.
            /// </summary>
            /// <returns type="XMLDocument" />
            if (!exists(this.m_oXML))
            {
                if ($.isStrVal(this.m_sText) && this.m_sText.documentElement)
                    this.m_oXML = $.parseXML(this.m_sText);
                else
                    this.m_oXML = $.parseXML('');
            }
            return this.m_oXML;
        },
        getRequestText: function()
        {
            /// <summary>
            ///     Get the data sent in this request as a string.
            /// </summary>
            /// <returns type="String" />
            return this.m_sReq
        },
        getRequestData: function()
        {
            /// <summary>
            ///     Get the data sent in this request as a set of key-value pairs.
            /// </summary>
            /// <returns type="Object" />
            return this.m_oReq
        },
        getLatency: function()
        {
            /// <summary>
            ///     Get the amount of time (in milliseconds) between when this request was initiated, and the response was received.
            /// </summary>
            /// <returns type="Number" />
            return this.m_iLatency
        },
        isComplete: function()
        {
            /// <summary>
            ///     Returns whether this AJAX request has not yet been sent, or is currently sending. A completed or timed-out request will return false.
            /// </summary>
            /// <returns type="Boolean" />
            return (this.m_fSent && this.getState() == $.AJAX.State.Loaded || this.getState() == $.AJAX.State.Timeout)
        },
        isSuccess: function()
        {
            /// <summary>
            ///     Returns whether this AJAX request completed successfully.
            ///     &#10; A request is considered successful when a response was received, and the HTTP Status code is in the 200's range, or 304.
            /// </summary>
            /// <returns type="Boolean" />
            return (this.isComplete() && (this.m_oCodeMap[this.getStatus()]))
        },
        getState: function()
        {
            /// <summary>
            ///     Returns the current state of the AJAX Request, including the custom 'timeout' state. (See values of $.AJAX.State enum or the W3C ajax specification)
            /// </summary>
            /// <returns type="Number" />
            if (this.m_fTO)
                return $.AJAX.State.Timeout;
            if (this.m_oXHR)
                return this.m_oXHR.readyState;
            if (this.m_oScriptInfo)
                return this.m_oScriptInfo.state;
            return $.AJAX.State.Uninitialized;
        },
        getStatus: function()
        {
            /// <summary>
            ///     Returns the current HTTP Status Code of the AJAX Request, including 502 for 'timeout' status. (See values of $.HTTP enu, or any HTTP Status Code specifications).
            ///     &#10; Status Codes 200 - 206, as well as 304 are considered successful.
            /// </summary>
            /// <returns type="Number" />
            if (this.m_fTO)
                return $.HTTP.GatewayTimeout;
            if (this.m_oXHR)
                return this.m_oXHR.status;
            if (this.m_oScriptInfo)
                return this.m_oScriptInfo.status;
            return 0;
        },
        getStatusText: function()
        {
            /// <summary>
            ///     Returns the status text of the AJAX Request, including 'NONE (Timeout)' for 'timeout' status.
            /// </summary>
            /// <returns type="String" />
            if (this.m_fTO)
                return 'NONE (Timeout)';
            if (this.m_oXHR)
                return this.m_oXHR.statusText;
            if (this.m_oScriptInfo)
                return this.m_oScriptInfo.statusText;
            return '';
        },
        set_url: function(url)
        {
            /// <summary>
            ///     Change the target Url of this AJAX request.
            /// </summary>
            /// <param name="url" type="String">
            ///     The target Url to use (can be both relative or absolute)
            /// </param>
            /// <returns value="this" />

            // Remove hash character (jQuery #7531: and string promotion)
            this.m_oUrl = $.url(($.valOrDef(url, '') + '').replace($.AJAX._regHash, '').replace($.AJAX._regProtoPre, $.AJAX.location.protocol + '//'));
            this.m_fCrossDomain = !!(!$.AJAX.location.protocol.equals(this.m_oUrl.protocol) ||
                                     !$.AJAX.location.domain.equals(this.m_oUrl.domain) ||
                                     $.AJAX.location.port != this.m_oUrl.port);
            return this;
        },
        set_headers: function(headers)
        {
            /// <summary>
            ///     Change the request headers to be sent during non-cross domain AJAX requets. (Cross-domain requests do not use an XmlHttpRequest object, so headers cannot be sent)
            ///     &#10; Defaults unless overwritten: ('Content-type', 'Accept', 'X-Requested-With')
            /// </summary>
            /// <param name="headers" type="Object">
            ///     A set of key-value pairs to use as the header field names and values.
            /// </param>
            /// <returns value="this" />
            this.m_oHeader = $.extend({ 'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': (this.m_fCrossDomain ? $.AJAX.Accepts.script : $.AJAX.Accepts.json + ', ' + $.AJAX.Accepts.xml),
                'X-Requested-With': 'XMLHttpRequest'
            }, $.valOrDef(headers, {}));
            return this;
        },

        // Internal methods
        _init: function(request)
        {
            this.m_fSent = false;
            this._clearResponse()
                ._clearRequest()
                ._clearTimeout()
                ._setRequest(request);

            if (!this.m_fCrossDomain)
            {
                var oXHR = this.m_oXHR = $.AJAX.xhr();
                if (exists($.AJAX._refs))
                    $.AJAX._refs[this.m_iRefId = $.AJAX._refId++] = oXHR;

                oXHR.onreadystatechange = $.proxy(this.evt_xhr_onreadystatechange, this);

                if ($.AJAX.EnableLogging)
                    $.log('XHR.open(' + this.m_eReq + ', ' + this.m_oUrl.url + ', ' + this.m_fAsync + ')');
                oXHR.open(this.m_eReq, this.m_oUrl.url, this.m_fAsync);

                // Need an extra try/catch for cross domain requests in Firefox 3
                try
                {
                    $.each(this.m_oHeader,
                        function(prop, val)
                        {
                            if ($.isStrVal(prop) && $.isString(val))
                            {
                                if ($.AJAX.EnableLogging)
                                    $.log('XHR.setRequestHeader(' + prop + ', ' + val + ')');
                                oXHR.setRequestHeader(prop, val);
                            }
                        }
                    );
                } catch (exc) { }
            }
            else
            {
                this.m_sHolder = '_' + (this.m_sCallback = $.AJAX._jspName());
                // Define callback
                window[this.m_sCallback] = $.proxy(function(response) { window[this.m_sHolder] = [response] }, this);

                var url = this.m_oUrl.url;
                if (this.m_eReq === $.AJAX.Req.POST)
                    url += (/\?/.test(url) ? '&' : '?') + this.m_sReq
                url += (/\?/.test(url) ? '&' : '?') + 'callback=' + this.m_sCallback;

                this.m_oScriptInfo = { state: $.AJAX.Uninitialized, status: $.HTTP.OK, statusText: "Unsent" };

                if ($.AJAX.EnableLogging)
                    $.log('<script async="async" src="' + url + '" />');

                var elScript = this.m_elScript = document.createElement('script');
                elScript.async = 'async';
                elScript.src = url;
                elScript.onload = $.proxy(this.evt_script_onload, this);
                elScript.onerror = elScript.onabort = $.proxy(this.evt_script_onabort, this);
                elScript.onreadystatechange = $.proxy(this.evt_script_onreadystatechange, this);
            }

            return this;
        },
        _setRequest: function(request)
        {
            if (exists(request))
            {
                this.m_eReq = $.AJAX.Req.POST;
                if ($.isString(request))
                    this.m_oReq = (this.m_sReq = request).doubleSplit('&', '=');
                else
                    this.m_sReq = $.mapToString(this.m_oReq = request);
            }
            else
                this.m_eReq = $.AJAX.Req.GET;
        },
        _clearRequest: function()
        {
            this._handleRef();
            this.m_sReq = this.m_oReq = this.m_eReq = this.m_oXHR = this.m_elScript = this.m_oScriptInfo = this.m_sCallback = null;
            return this;
        },
        _clearResponse: function()
        {
            this.m_sText = this.m_oJSON = this.m_oXML = this.m_oScriptInfo = null;
            return this;
        },
        _clearTimeout: function()
        {
            this.m_fTO = false;
            if (exists(this.m_oTO))
                clearTimeout(this.m_oTO);
            this.m_oTO = null;
            return this;
        },
        _checkComplete: function(oEvt)
        {
            if (this.isComplete())
            {
                if (!this.m_fTO)
                    this._clearTimeout();
                this._event = $.event.fix(oEvt);
                this._onCompletion();
            }
        },
        _onCompletion: function()
        {
            this.m_iLatency = new Date() - this.m_dtTS;
            var logStr = '(' + this.m_iLatency + 'ms) ';

            if (exists(this.m_oXHR))
            {
                try { this.m_sText = this.m_oXHR.responseText }
                catch (exc)
                {
                    try { this.m_sText = this.m_oXHR.responseXML }
                    catch (exc2) { this.m_sText = '' }
                }
                this._handleRef();

                if ($.AJAX.EnableLogging && $.isString(this.m_sText))
                {
                    if (this.m_sText.length < 100)
                        logStr += this.m_sText;
                    else
                        logStr += this.m_sText.substring(0, 100) + '...';
                }
            }
            else if (exists(this.m_elScript))
            {
                if ($.isElement(this.m_elHead) && $.isElement(this.m_elScript))
                {
                    this.m_elScript.onload = this.m_elScript.onabort = this.m_elScript.onerror = this.m_elScript.onreadystatechange = null;
                    this.m_elHead.removeChild(this.m_elScript);
                    this.m_elScript = undefined;
                    this.m_elHead = undefined;
                }
                this.m_oScriptInfo.state = $.AJAX.State.Loaded;

                if (exists(window[this.m_sHolder]))
                {
                    if ($.isString(window[this.m_sHolder][0]))
                        this.m_sText = window[this.m_sHolder][0];
                    else
                        this.m_oJSON = window[this.m_sHolder][0];
                    window[this.m_sHolder] = undefined;
                }
                if (exists(window[this.m_sCallback]))
                    window[this.m_sCallback] = null;

                if ($.AJAX.EnableLogging)
                {
                    if ($.isStrVal(this.m_sText))
                    {
                        if (this.m_sScript.length < 100)
                            logStr += this.m_sScript;
                        else
                            logStr += this.m_sScript.substring(0, 100) + '...';
                    }
                    else if (exists(this.m_oJSON))
                    {
                        logStr += 'JSON';
                    }
                }
            }

            if (this.isSuccess())
            {
                if ($.AJAX.EnableLogging)
                    $.log('AJAX RESPONSE: ' + logStr);
                $(this).customEvent($.AJAX.On.Success, this._event).trigger();
            }
            else if (this.m_fTO)
            {
                if ($.AJAX.EnableLogging)
                    $.log('AJAX TIMEOUT: ' + logStr);
                $(this).customEvent($.AJAX.On.Timeout, this._event).trigger();
            }
            else
            {
                if ($.AJAX.EnableLogging)
                    $.log('AJAX (Failure) RESPONSE: ' + logStr);
                $(this).customEvent($.AJAX.On.Error, this._event).trigger();
            }
            $(this).customEvent($.AJAX.On.Complete, this._event).trigger();

            return this;
        },
        _onTimeout: function()
        {
            this.m_oTO = null;
            this.m_fTO = true;
            this.cancel();
            return this;
        },
        _handleRef: function()
        {
            if (exists(this.m_iRefId))
            {
                $.AJAX._clearRef(this.m_iRefId);
                this.m_iRefId = undefined;
            }
        },

        // XHR + Script event handling
        evt_script_onload: function(oEvt)
        {
            if ($.AJAX.EnabledLogging)
                $.log('<script> onload');
            this.m_oScriptInfo = { state: $.AJAX.State.Loaded, status: $.HTTP.OK, statusText: "Loaded" };
            this._onCompletion();
        },
        evt_script_onabort: function(oEvt)
        {
            if ($.AJAX.EnabledLogging)
                $.log('<script> onabort');
            this.m_oScriptInfo = { state: $.AJAX.State.Loaded, status: $.HTTP.NotFound, statusText: "Abort" };
            this._onCompletion();
        },
        evt_script_onreadystatechange: function(oEvt)
        {
            if ($.AJAX.EnabledLogging)
                $.log('<script> readyState:' + this.m_elScript.readyState);

            if ($.isString(this.m_elScript.readyState) && /loaded|complete/.test(this.m_elScript.readyState))
                this.m_oScriptInfo = { state: $.AJAX.State.Loaded, status: $.HTTP.OK, statusText: "Ready" };
            else
                this.m_oScriptInfo = { state: $.AJAX.State.Receiving, status: $.HTTP.OK, statusText: "Waiting" };

            this._checkComplete(oEvt);
        },
        evt_xhr_onreadystatechange: function(oEvt)
        {
            if ($.AJAX.EnableLogging)
            {
                var logStr = 'XHR readyState:' + this.m_oXHR.readyState + ' | status:';
                try { logStr += this.m_oXHR.status; }
                catch (exc) { logStr += 'INVALID'; }
                logStr += ' | statusText:';
                try { logStr += this.m_oXHR.statusText; }
                catch (exc) { logStr += '(none)'; }
                $.log(logStr);
            }
            this._checkComplete(oEvt);
        }
    }

    $.jajax = function(url, props)
    {
        /// <summary>
        ///     Creates a jQuery wrapped $.AJAX.Request object, ready to be initiated by calling the send() method
        ///     &#10;1 - jQuery.jajax(url, props) 
        ///     &#10;2 - jQuery.jajax(props) (url must be present in props)
        /// </summary>
        /// <param name="url" type="String">
        ///     A string containing the URL to which the request is sent
        /// </param>
        /// <param name="props" type="Object">
        ///     A set of key/value pairs used for this request: url (string) | maxtime (number [ms]) | async (bool) | headers (key/value) | success (function) | error (function) | timeout (function) | complete (function)
        /// </param>
        /// <returns type="jQuery">The jQuery wrapped $.AJAX.Request</returns>
        if (!props)
            props = url;
        else if ($.isString(url))
            props.url = url;
        var oReq = $(new $.AJAX.Request(props));
        oReq.send = function(request, event)
        {
            /// <summary>
            ///     Start the asynchronous HTTP (Ajax or script) request.
            ///     &#10;1 - send(request, event)
            ///     &#10;2 - send(request) 
            /// </summary>
            /// <param name="request" type="string" optional="true">
            ///     The data to pass via the POST body for POST's, or via the QueryString for GETs. Also can be passed as a set of key/value pairs to be converted as (prop)=(val)&amp;(prop2)=(val2)&amp;...
            /// </param>
            /// <param name="event" type="jQuery.Event" optional="true">
            ///     jQuery.Event object to store and use as the root event which triggering custom events
            /// </param>
            /// <returns type="$.AJAX.Request">The Plain AJAX Handler object (not jQuery wrapped)</returns>
            return this.un$().send(request, event);
        };
        if ($.isFunction(props.success))
            oReq.$bind($.AJAX.On.Success, props.success);
        if ($.isFunction(props.error))
            oReq.$bind($.AJAX.On.Error, props.error);
        if ($.isFunction(props.timeout))
            oReq.$bind($.AJAX.On.Timeout, props.error);
        if ($.isFunction(props.complete))
            oReq.$bind($.AJAX.On.Complete, props.complete);
        return oReq;
    }
    
    $.AJAX.xhr = function()
    {
        /// <summary>
        ///     Creates a native XmlHttpRequest object, or IE equivalent ActiveXObject for older IE browsers
        /// </summary>
        /// <returns type="XMLHttpRequest" />
        if (exists($.AJAX.xhr.variantIndex))
            return $.AJAX.xhr.variants[$.AJAX.xhr.variantIndex]();
        if (!exists($.AJAX.xhr.variants))
        {
            $.AJAX.xhr.variants = [
                               function() { return new XMLHttpRequest() },
                               function() { return new ActiveXObject("Msxml2.XMLHTTP") },
                               function() { return new ActiveXObject("Msxml3.XMLHTTP") },
                               function() { return new ActiveXObject("Microsoft.XMLHTTP") }
                              ];
        }
        var oXHR = null;
        $.each($.AJAX.xhr.variants,
            function(idx, fn)
            {
                try { oXHR = fn() } catch (exc) { return true; }
                $.AJAX.xhr.variantIndex = idx;
                if (idx > 0)
                {
                    $.AJAX._refs = {};
                    jQuery(window).unload(
                        function(evt)
                        {
                            $.each($.AJAX._refs,
                                function(refId, ref) { $.AJAX._clearRef(refId) }
                            );
                        }
                    );
                }
                return false;
            }
        );
        return oXHR;
    }

    // #8138, IE may throw an exception when accessing
    // a field from window.location if document.domain has been set
    try
    {
        $.AJAX.location = $.url(window.location.href);
    } catch (e)
    {
        // Use the href attribute of an A element
        // since IE will modify it given document.location
        var ajaxLocation = document.createElement("a");
        ajaxLocation.href = "";
        $.AJAX.location = $.url(ajaxLocation.href);
    }

    // Internal Vars
    jQuery.extend($.AJAX,
    {
        _regProtoPre: new RegExp('^\/\/'),
        _regHash: new RegExp('#.*$'),
        _refs: null,
        _refId: 1,
        _clearRef: function(refId)
        {
            if (exists($.AJAX._refs) && exists($.AJAX._refs[refId]))
            {
                $.AJAX._refs[refId].onreadystatechange = function() { };
                delete $.AJAX._refs[refId];
            }
        },
        _jspSeed: $.now(),
        _jspName: function() { return $._jaexpando + "_" + ($.AJAX._jspSeed++) },
        _isLocal: new RegExp('^(?:about|app|app\-storage|.+\-extension|file|res|widget):$').test($.AJAX.location.protocol)
    });

    // See http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html for all values of the 'status' property
    $.HTTP =
    {
        // Experimental
        Continue: 100,    // Initial response received and not rejected, continue sending request or wait for response
        SwitchingProtocols: 101,    // Server accepts upgrade request, will switch to protocls defined in respone's Upgrade header field

        // Request Success
        OK: 200,    // Success. GET->Return entity, HEAD->Send entity-header w/o body, POST->Return entity describing action result, TRACE->Return entity contaiing request message
        Created: 201,    // Request fufilled, new resource created. URI(s) of resoure returned via Location header field, format specified by media type in Content-Type header field
        Accepted: 202,    // Request accepted, but not complete. Estimate completion or pointer to status monitor should be provided.
        NonAuthoritativeInfo: 203,    // Success. Metainformation in entity-header is not from original server, but from a local or 3rd-party copy.
        NoContent: 204,    // Request fufilled, but no Body to return. Metainformation may be updated, but client should not change displayed document.
        ResetContent: 205,    // Request fufilled and client should reset document displayed. Response will not include an entity.
        PartialContent: 206,    // Partial Range/If-Range GET request fufilled. Reponse will include Content-Range/Content-Type + Date + ETag and/or Content-Location + Expires, Cache-Control, and/or Vary.

        // Redirection
        MultipleChoices: 300,    // The requested resource corresponds to multiple representations. For non-HEAD requests, list of resources and locations returned via response, via Content-Type header field.
        MovedPermanently: 301,    // The requested resource has been assigned a new permanent URI, given via Location field and hyperlink in Response (for non-HEAD requests)
        Found: 302,    // The requested resource has been assigned a new temporary URI, given via Location field and hyperlink in Response (for non-HEAD requests)
        SeeOther: 303,    // The response can be found via GET to a different URI, given via Location field, as well as via hyperlink in Response (for non-HEAD requests).
        NotModified: 304,    // GET request allowed, but document has not been modified.
        UseProxy: 305,    // The requested resource must be accessed via repeating request to proxy given by Location field.
        TemporaryRedirect: 307,    // The requested resource has been assigned a new temporary URI, given via Location field and hyperlink in Response (for non-HEAD requests). If not a GET or HEAD request, confirm with user before redirecting.

        // Client-Error Responses
        BadRequest: 400,
        Unauthorized: 401,
        Forbidden: 403,
        NotFound: 404,
        MethodNotAllowed: 405,
        NotAcceptable: 406,
        ProxyAuthRequired: 407,
        RequestTimeout: 408,    // A request was not produced quickly enough to the Server.
        Conflict: 409,
        Gone: 410,
        LengthRequired: 411,
        PreConditionFailed: 412,
        RequestEntityTooLarge: 413,
        RequestUriTooLong: 414,
        UnsupportedMediaType: 415,
        RequestedRangeNotSuitable: 416,
        ExpectationFail: 417,

        // Server-Error Responses
        ServerError: 500,
        NotImplemented: 501,
        BadGateway: 502,
        ServiceUnavailable: 503,
        GatewayTimeout: 504,    // Timeout while server was acting as a gateway or proxy.
        HttpVersionNotSupported: 505,    // Server does not support HTTP protocol version requested. Description and alternatives should be provided.

        OK_IE: 1223
    }

    $.JSON = function(data)
    {
        try
        {
            if ($.isString(data))
                this._props = $.parseJSON(data);
            else if (exists(data))
                this._props = data
            else
                throw new Error();
            this._isJSON = true;
        }
        catch (exc)
        {
            this._props = {};
            this._isJSON = false;
        }
    }
    $.JSON.prototype =
    {
        fromJSON: function()
        {
            return this._isJSON
        },
        hasValue: function(eName)
        {
            return ($.arrExists(this._props, eName) && !(this._props[eName] === ""))
        },
        "get": function(eName)
        {
            if (!exists(this._props[eName]))
                return '';
            return this._props[eName];
        },
        "set": function(eName, oValue)
        {
            this._props[eName] = ((oValue === "") ? null : oValue);
            return this;
        },
        each: function()
        {
            var arr = [this._props];
            return $.each.apply($, Array.prototype.concat.apply(arr, arguments));
        }
    }

})(jQuery);