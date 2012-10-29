/// <reference path="..\jQuery\jquery-1.7.2.js" />
// <reference path="..\jQuery\jquery-1.7.1-vsdoc.js" />

// Intellisense/Comment Overview
// <var> <param> <field> <returns>
//      type="ValueType"                    // HTMLElement, Window, Document, or [Constructor]
//      elementType="ArrayElementType"      // If Array, type of array Elements
//      value="code"                        // (Not for <var>) Set an actual value for intellisense to use
//      domElement="true|false"             // [Overwritten by type] Whether this is a DOM element
//      elementDomElement="true|false"      // [Overwritten by elementType] If Array, whether the array Elements are DOM elements
//      >InnerText<                         // Description Text
// <param>
//      name="parameterName"                // [Required]
//      optional="true|false"               // Whether this is an optional parameter
// <field>
//      name="fieldName"                    // [Required]
//      static="true|false"                 // True if this is only a member of an instance of this object. False if global static member

// Global Functions
exists = function(val)
{
    /// <summary>
    ///     Returns whether the specified value has a value (not null or undefined)
    /// </summary>
    /// <param name="val">
    ///     Value to check
    /// </param>
    /// <returns type="Boolean" />
    return ((val) ? true : (val == 0 || val == false || val == "")) 
};
$exists = function(val)
{
    /// <summary>
    ///     Returns whether a val exists, or if a jQuery object, whether it contains anything
    /// </summary>
    /// <param name="val">
    ///     Value/jQuery object to check
    /// </param>
    /// <returns type="Boolean" />
    return exists(val) && (!$.is$(val) || val.length > 0)
};

(function($)
{
    // jQuery.Utilities
    $.extend($,
    {
        valOrDef: function(val, def)
        {
            /// <summary>
            ///     Returns the first param if it exists (not null or undefined), otherwise returns the second param
            /// </summary>
            /// <param name="val">
            ///     The value to return if it exists
            /// </param>
            /// <param name="def">
            ///     The value to return if val does not exists
            /// </param>
            /// <returns value="val || def">One of the parameters</returns>
            return (exists(val) ? val : def)
        },
        numOrZero: function(number, notNegative)
        {
            /// <summary>
            ///     Returns the first param if it is a number, otherwise returns zero
            /// </summary>
            /// <param name="number" type="Number">
            ///     The value to return if it's a number
            /// </param>
            /// <param name="notNegative" optional="true">
            ///     Only return the number if it is not negative (default = false)
            /// </param>
            /// <returns type="Number" />
            return (exists(number) && $.isNumeric(number) && (!notNegative || number > 0)) ? number : 0
        },
        arrOrEmpty: function(array)
        {
            /// <summary>
            ///     Returns the param if it is an array, otherwise returns either an empty array, or an array containing the param
            /// </summary>
            /// <param name="array" type="Array">
            ///     The value to either return as-is, or wrap in an array
            /// </param>
            /// <returns type="Array" />
            return (exists(array) ? ($.isArray(array) ? array : [array]) : []);
        },
        strPad: function(str, length, char, suffix)
        {
            /// <summary>
            ///     Returns the param as a string of a specific length. If the param is less than the specified number of characters
            ///     the provided char will be added to the front/end of the string until it meets the required length.
            /// </summary>
            /// <param name="str" type="String">
            ///     Value to ensure is a specified length
            /// </param>
            /// <param name="length" type="Number">
            ///     Minimum number of characters the returned string should be
            /// </param>
            /// <param name="char" type="String">
            ///     The character to use to fill in the string to make it the specified lenght
            /// </param>
            /// <param name="suffix" type="Boolean" optional="true">
            ///     Add characters as a suffix instead of a prefix (default = false)
            /// </param>
            /// <returns type="String" />
            str = (str || '').toString();
            var pre = ($.isNumeric(str) && str.startsWith('-')) ? '-' : '';
            str = str.substring(pre.length);
            while(str.length < length)
                str = (suffix ? '' : char) + str + (suffix ? char : '');
            return pre + str
        },
        isObject: function(obj)
        {
            /// <summary>
            ///     Returns whether the specified value is of type 'object'
            /// </summary>
            /// <param name="obj" type="Object">
            ///     Value to check
            /// </param>
            /// <returns type="Boolean" />
            return 'object'.equals(typeof (obj), true)
        },
        is$: function(obj)
        {
            /// <summary>
            ///     Returns whether the specified value is a jQuery object
            /// </summary>
            /// <param name="obj" type="jQuery">
            ///     Value to check
            /// </param>
            /// <returns type="Boolean" />
            return exists(obj) && obj.jquery
        },
        isElement: function(el, tag)
        {
            /// <summary>
            ///     Returns whether the specified value is a DOM element or if the first member of a jQuery object is a DOM element
            /// </summary>
            /// <param name="el" type="HTMLElement|jQuery">
            ///     Value to check
            /// </param>
            /// <param name="tag" type="String" optional="true">
            ///     A specific, case-insensitive, element type name (ie 'div') to require the element to be (def = any element)
            /// </param>
            /// <returns type="Boolean" />
            var el = $.is$(el) ? el.un$() : el;
            return (exists(el) &&
                   el.nodeType == 1 &&
                   $.isStrVal(el.tagName) &&
                   (!$.isString(tag) || tag.equals(el.tagName, true)))
        },
        isString: function(str)
        {
            /// <summary>
            ///     Returns whether the specified value is of type 'string'
            /// </summary>
            /// <param name="str" type="String">
            ///     Value to check
            /// </param>
            /// <returns type="Boolean" />
            return typeof (str) === 'string'
        },
        isStrVal: function(str, noWhitespace)
        {
            /// <summary>
            ///     Returns whether the specified value is a non-empty string
            /// </summary>
            /// <param name="str" type="String">
            ///     Value to check
            /// </param>
            /// <param name="noWhitespace" type="Boolean" optional="true">
            ///     If this string is only whitespace, count it is empty (default = false)
            /// </param>
            /// <returns type="Boolean" />
            return exists(str) && $.isString(str) && str != "" && (!noWhitespace || str.trim().length != 0)
        },
        log: function(val)
        {
            /// <summary>
            ///     Write the specified value to the browser's javascript console
            /// </summary>
            /// <param name="val">
            ///     Value to write to the console
            /// </param>
            /// <returns value="console.log()">The result</returns>
            return console.log(val)
        },
        url: function(url)
        {
            /// <summary>
            ///     Create a set of key-value pairs representing a specified url
            ///     &#10;Properties: { url (original url), absolute (full url), protocol ('http'), domain ('host'), port (80) }
            ///     &#10;NOTE: If the url is relative, the values for protocol, domain, and port will be from document.location
            /// </summary>
            /// <param name="url" type="String">
            ///     The url to parse
            /// </param>
            /// <returns>A set of key-value pairs (url, absolute, protocol, domain, port)</returns>
            var toRet = { url: (url + '') };
            var parts = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/.exec(toRet.url.toLowerCase());
            if (!parts)
            {
                parts = [document.location, document.location.protocol, document.location.hostname, document.location.port];
                toRet.absolute = parts[1] + '//' + parts[2] + (parts[3] == 80 || parts[3] == 443 ? '' : (':' + parts[3])) + '/' + toRet.url;
            }
            toRet.protocol = parts[1];
            toRet.domain = parts[2];
            // Add protocol if not provided (jQuery #5866: IE7 issue with protocol-less urls)
            toRet.port = parts[3] || (toRet.protocol == 'http:' ? 80 : 443);
            return toRet
        },
        arrExists: function(array, index)
        {
            /// <summary>
            ///     Return whether an array contains a specified index, and whether that index has a value.
            ///     &#10;For multi-dimensional arrays, the existence of an array/value at each level will also be checked
            ///     &#10;1 - arrExists(array, [index, index2, index3, ....]) Uses each argument as a separate index for each dimension of the array
            ///     &#10;2 - arrExists(array, args) Uses the 2nd argument as an array containing a separate index for each dimension of the array
            /// </summary>
            /// <param name="array" type="Array">
            ///     The Array to check for existence
            /// </param>
            /// <param name="index" type="Array|String|Number">
            ///     Either an Array of indecies to check, or the first of a series of argument representing each index
            /// </param>
            /// <returns type="Boolean" />
            if (!exists(array))
                return false;
            var arrIds = $.isArray(index) ? index : arguments;
            var first = $.isArray(index) ? 0 : 1;
            for (var i = first; i < arrIds.length; i++)
            {
                if (!exists(arrIds[i]) || !exists(array[arrIds[i]]))
                    return false;
                array = array[arrIds[i]];
            }
            return true;
        },
        mapToString: function(map, first, second)
        {
            /// <summary>
            ///     (Compliment to String.doubleSplit) Converts a set of key-value pairs into a string. Common usage includes cookies ('; ' + '='), query strings ('&', '='), and AJAX POST data ('&', '=')
            /// </summary>
            /// <param name="map" type="Object">
            ///     The object containing the key-value pairs to convert into a string
            /// </param>
            /// <param name="first" type="String" optional="true">
            ///     The delimeter to use to separate each node of the map. (default = '&')
            /// </param>
            /// <param name="second" type="String" optional="true">
            ///     The delimeter to use to separate each key-value pair. (default = '=')
            /// </param>
            /// <returns type="String">A string containing each key-value pair separated via two delimeters</returns>
            first = $.valOrDef(first, '&');
            second = $.valOrDef(second, '=');
            var sMap = '';
            var iter = $.Iterator(map, []);
            while (iter.hasNext())
            {
                var oPair = iter.next();
                if (sMap.length != 0)
                    sMap += first;
                sMap += $.valOrDef(oPair.key, '') + second + $.valOrDef(oPair.value, '');
            }
            return sMap
        },
        runAfter: function(fn, context, args) 
        { 
            /// <summary>
            ///     Run a function immediately after all the native browser events have completed firing
            /// </summary>
            /// <param name="fn" type="Function">
            ///     The function to run
            /// </param>
            /// <param name="context" type="Function|Object">
            ///     The context to run the function (value of 'this' pointer)
            /// </param>
            /// <param name="args" type="Array" optional="true">
            ///     The parameters to pass the function when it is called
            /// </param>
            /// <returns>A handle to this function (Calling clearTimeout using that handle will cancle its execution)</returns>
            return setTimeout(function() { fn.apply(context, $.valOrDef(args, [])) }, 0)
        },

        HR:
        {
            /// <summary>An expandable Enum for representing various error codes.</summary>

            FAILED: function(hr)
            {
                /// <summary>
                ///     Check the specified error code to verify it represents a error
                /// </summary>
                /// <param name="hr" type="Number|String">
                ///     The value to check
                /// </param>
                /// <returns type="Boolean" />
                if (exists(hr) && hr != $.HR.None && hr != $.HR.S_OK)
                    return true;
                return false;
            },

            /// <field type="String" static="true">No Error Set (uninitialized)</field>
            None: '',
            /// <field type="String">No Error</field>
            S_OK: '0'
        },

        Pair: function(key, value)
        {
            /// <summary>
            ///     Constructor for a Pair object, which represents a single key-value pair.
            /// </summary>
            /// <param name="key" type="String|Number">
            ///     The value of the key
            /// </param>
            /// <param name="value">
            ///     The value of the value
            /// </param>
            /// <field name="key" type="String|Number">
            ///     The key
            /// </field>
            /// <field name="value">
            ///     The value
            /// </field>

            this.key = key;
            this.value = value;
        },

        Iterator: function(target, empty)
        {
            /// <summary>
            ///     Creates a new Iterator object which will iterate over the actual added properties only, not any methods or built-in member
            ///     &#10;The Iterator is READ-ONLY so modifying its values will not update the values of the object being iterated over, and updates to the object will not change the values of the Iterator.
            ///     &#10;The Iterator will contain a valid 'length' property which will not change, even if properties are removed/added from the original object.
            ///     &#10;When the Iterator is indexed '[]' like a normal array, it will return the key/name of the property at that index
            ///     &#10;hasNext() and next() can also be used to iterate, where next() will return a $.Pair object and move to next key-value pair,
            ///     hasNext() can be called to verify the Iterator has another value to be returned via next()
            /// </summary>
            /// <param name="target" type="Object">
            ///     The target object to iterate over
            /// </param>
            /// <param name="empty" type="Object" optional="true">
            ///     An instance of a empty version of the target object. This should be specified if the target does not have a valid constructor method to use, in order to determine which properties should be iterated
            /// </param>
            /// <returns type="Array" elementType"String">An Array containing the keys of the object, as well as iterator methods next() and hasNext()</returns>
            var base = new Array();
            if (exists(target) && (exists(empty) || exists(target.constructor)))
            {
                base._next = 0;
                base._target = target;
                var cpy = (exists(empty) ? empty : new target.constructor());
                for (var index in target)
                {
                    if (!exists(cpy[index]))
                        base.push(index);
                }
            }
            base.next = function()
            {
                /// <summary>
                ///     Return the next $.Pair object and move to the next key-value pair in the Iterator
                /// </summary>
                /// <returns type="$.Pair">A $.Pair object containing the next key-value pair</returns>
                var key = this[this._next];
                this._next++;
                return new $.Pair(key, this._target[key]);
            };
            base.hasNext = function()
            {
                /// <summary>
                ///     Return whether the next() method can be called again, or if the Iterator has reached the end of the object it's iterating
                /// </summary>
                /// <returns type="Boolean" />
                return (exists(this._next) && (this._next < this.length))
            };
            return base;
        },

        /// <summary>Enum for all valid types for input elements</summary>
        InputType:
        {
            Button: 'button',
            Checkbox: 'checkbox',
            File: 'file',
            Hidden: 'hidden',
            Image: 'image',
            Password: 'password',
            RadioButton: 'radio',
            Reset: 'reset',
            Submit: 'submit',
            Textbox: 'text',
            /* HTML5 */
            Phone: 'tel',
            EmailAddress: 'email',
            ColorPicker: 'color',
            DatePicker: 'date',
            DateTime: 'datetime',
            DateTimeLocal: 'datetime-local',
            MonthPicker: 'month',
            Number: 'number',
            RangePicker: 'range',
            SearchBox: 'search',
            TimePicker: 'time',
            URL: 'url',
            WeekPicker: 'week'
        },

        isTextboxType: function(type)
        {
            /// <summary>
            ///     Returns whether the specified value is considered a type of textbox input.
            /// </summary>
            /// <param name="type" type="String">
            ///     The value to check
            /// </param>
            /// <returns type="Boolean" />
            return $.isStrVal(type) &&
                    (type.equals($.InputType.Textbox) ||
                     type.equals($.InputType.Password) ||
                     type.equals($.InputType.Phone) ||
                     type.equals($.InputType.EmailAddress) ||
                     type.equals($.InputType.Number) ||
                     type.equals($.InputType.SearchBox) ||
                     type.equals($.InputType.URL))
        }
    });

    // jQuery(<selector>).objects()
    $.fn.objects = function()
    {
        /// <summary>
        ///     Return an array containing all of the actual JS objects contained in this jQuery object.
        ///     &#10;DOM Elements, jQuery, and other non-Objects will execluded.
        ///     &#10;This is a deep copy, so individual Arrays and/or jQuery objects will be searched as well.
        /// </summary>
        /// <returns type="Array" elementType="Object">An array containing non-jQuery and non-DOM-Element objects</returns>
        var toRet = [];
        $.each(this,
            function(idx, obj)
            {
                if ($.is$(obj))
                    toRet = toRet.concat(obj.objects());
                else if (jQuery.isArray(obj))
                    toRet = toRet.concat($(obj).objects());
                else if ($.isObject(obj))
                    toRet.push(obj);
            }
        );
        return toRet;
    }

    // jQuery(<selector>).un$()
    $.fn.un$ = function()
    {
        /// <summary>
        ///     Returns the first object/element of this jQuery object (Not jQuery wrapped)
        /// </summary>
        /// <returns type="Object|HTMLElement" />
        return this[0]
    }

    // Function prototype definitions
    Function.prototype.derivesFrom = function(base)
    {
        /// <summary>
        ///     Define an object this object derives from. In the event of a method conflict, this methods of [this] object will replace the methods of [base] object.
        ///     &#10;NOTE: In order to inherit the functionality in the [base] object constructor a corresponding call into the [base] function will need to be called during this object's constructor.
        ///     &#10;ie: [base].apply(this, [arguments]);
        /// </summary>
        /// <param name="base" type="Function">
        ///     The base class to inherit prototype defined methods from
        /// </param>
        /// <returns value="this" />
        var origMembers = this.prototype;
        function proto() { }
        proto.prototype = base.prototype;
        this.prototype = new proto();
        this.prototype.constructor = this;
        this.prototype._super = base.prototype;
        var self = this;
        $.each(origMembers,
            function(sName, fnMethod) { self.prototype[sName] = origMembers[sName] }
        );
        return this
    }

    Function.prototype.implements = function(interface)
    {
        /// <summary>
        ///     (see .derivesFrom) This has identical behavior to derivesFrom, but should be used to symbolize that the object is implementing an interface, rather than deriving from a base class
        /// </summary>
        /// <param name="interface" type="Function">
        ///     The base class to inherit prototype defined methods from
        /// </param>
        /// <returns type="this" />
        return this.derivesFrom(interface)
    }

    // String prototype definitions
    String.prototype.equals = function(string, ignoreCase)
    {
        /// <summary>
        ///     Compares this String to another string for equality
        /// </summary>
        /// <param name="string" type="String">
        ///     String to compare this String to
        /// </param>
        /// <param name="ignoreCase" optional="true">
        ///     Do a case-insensitive comparison (default = false)
        /// </param>
        /// <returns type="Boolean" />
        if (!$.isString(string))
            return false
        if (ignoreCase)
            return this.toLowerCase() == string.toLowerCase()
        else
            return this == string
    }

    String.prototype.trim = function()
    {
        /// <summary>
        ///     Returns a copy of this string with all prefixed and suffixed whitespace removed
        /// </summary>
        /// <returns type="String" />
        return $.trim(this)
    }

    String.prototype.find = function(searchValue, ignoreCase, start)
    {
        /// <summary>
        ///     Returns the position of the first occurrence of a specified value in a string.
        ///     &#10;-1 is returned if the value never occurs
        ///  </summary>
        /// <param name="searchValue" type="String">
        ///     The string to search for
        /// </param>
        /// <param name="ignoreCase" type="Boolean" optional="true">
        ///     Do a case in-sensitive search (default = false)
        /// </param>
        /// <param name="start" type="Number" optional="true">
        ///     The index to start the search from (default = 0)
        /// </param>
        /// <returns type="Number">The position where the specified searchValue occurs for the first time, or -1 if it never occurs</returns>
        if (!$.isString(searchValue))
            return -1
        if (ignoreCase)
            return this.toLowerCase().indexOf(searchValue.toLowerCase(), start)
        else
            return this.indexOf(searchValue, start)
    }

    String.prototype.contains = function(searchValue, ignoreCase)
    {
        /// <summary>
        ///     Returns whether a specified string occurs within another string.
        /// </summary>
        /// <param name="searchValue" type="String">
        ///     The string to search for
        /// </param>
        /// <param name="ignoreCase" type="Boolean" optional="true">
        ///     Do a case in-sensitive search (default = false)
        /// </param>
        /// <returns type="Boolean" />
        if (this.length === 0 || searchValue.length === 0)
            return false;
        return this.find(searchValue, ignoreCase) != -1
    }

    String.prototype.startsWith = function(prefix, ignoreCase)
    {
        /// <summary>
        ///     Returns whether a strings is prefixed by a specified string.
        /// </summary>
        /// <param name="prefix" type="String">
        ///     The string to search for
        /// </param>
        /// <param name="ignoreCase" type="Boolean">
        ///     Do a case-insensitive search (default = false)
        /// </param>
        /// <returns type="Boolean" />
        return this.find(prefix, ignoreCase) === 0
    }

    String.prototype.format = function(arg1, arg2)
    {
        /// <summary>
        ///     Replaces indexed portions of a string with the corresponding value passed in the arguments list.
        ///     &#10;ie: If this string was 'Text {0} text {1} text {0}', each {0} would be replaced with the first argument passed in, and each {1} would be replaced with the second argument passed in, etc.
        /// </summary>
        /// <param name="arg1" type="String" optional="true">
        ///     String to use as the replacement to {0} in this string
        /// </param>
        /// <param name="arg2" type="String" optional="true">
        ///     String to use as the replacement to {1} in this string
        /// </param>
        /// <returns type="String">A new copy of this string with the replaced values</returns>
        var str = this;
        for (var i = 0; exists(arguments[i]); i++)
            str = str.replace(new RegExp('\\{' + i + '\\}', 'g'), arguments[i]);
        return str;
    }

    String.prototype.doubleSplit = function(first, second, valuesAsArrays)
    {
        /// <summary>
        ///     (Compliment to $.mapToString) Creates a dictionary by splitting a string, and splitting each of those parts into key-value pairs.
        ///     &#10;First, splits this string using delimeter one. 
        ///     After the split, each section will be split into two parts on the first occurence of second, resulting in a KEY string and a VALUE string.
        ///     If the VALUE string is empty (the section doesn't contain second, or the only occurence is at the end of the section),
        ///     the value in the dictionary for that KEY will be null. Empty Keys are stored as Empty Strings, but empty values are stored as null.
        ///     By default, if the VALUE string is at least 1 character long, the entire VALUE string will be stored as the value for that Key. 
        ///     However, if multi-valued keys are enabled (true passed as param), the VALUE string will be split using second, and the resulting array
        ///     will be stored as the value for that KEY.</summary>
        /// <param name="first" type="String">
        ///     The first string to split on (ie: The delimeter sepearting each node of the dictionary)
        /// </param>
        /// <param name="second" type="String" optional="true">
        ///     The second string to split on (ie: The delimeter sepearting the key-value pairs of the dictionary). If not passed, the value for each key will be null.
        /// </param>
        /// <param name="valuesAsArrays" type="Boolean" optional="true">
        ///     Create the dictionary such that the value corresponding to each key is either null or an array of 1 or more strings. (default = false)
        /// </param>
        /// <returns type="Array" elementType="Array">A set of key-value pairs</returns>
        var toRet = [];
        if ($.isString(first))
        {
            var arr = this.split(first);
            second = second || '';
            for (var i = 0; i < arr.length; i++)
            {
                if (arr[i].length > 0)
                {
                    var iIndex = arr[i].find(second);
                    if (iIndex == -1)
                        toRet[arr[i]] = null;
                    else
                    {
                        var key = (iIndex == 0) ? '' : arr[i].substring(0, iIndex);
                        var sValue = (iIndex < (arr[i].length - 1)) ? arr[i].substring(iIndex + 1) : null;
                        if (!exists(sValue) || !valuesAsArrays)
                            toRet[key] = sValue;
                        else
                            toRet[key] = sValue.split(second);
                    }
                }
            }
        }
        return toRet
    }

    // Internal usage only
    $._jarc = '1.0.0';
    $._jaexpando = 'jArc' + ($._jarc + Math.random()).replace(/\D/g, '');
    $.retFalse = function() { return false };
})(jQuery);