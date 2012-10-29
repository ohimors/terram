/// <reference path="ja_core.js" />

(function($)
{
    $.CK =
    {
        Name: {},
        Delimeter: '; ',
        Separator: '=',
        MapDelimeter: '&',
        MapSeparator: '=',
        ExpireDateString: 'Thu, 2 Aug 2001 20:47:11 UTC',
        PersistDateString: 'Sun, 4 Nov 2037 10:31:15 UTC',
        isEnabled: function()
        {
            /// <summary>
            ///     Return whether cookies are current enabled for this user's browser
            /// </summary>
            /// <returns type="Boolean" />
            var sCookie = 'jaCKTst=ja' + new Date().getTime();

            document.cookie = sCookie;
            return (document.cookie.find(sCookie) != -1);
        },
        write: function(name, value, persist)
        {
            /// <summary>
            ///     Writes a cookie to the domain passed as a parameter. 
            ///     &#10; - Persistent cookies will have an expiration in 2037.  
            ///     &#10; - Blank cookies will be assumed to be cookie deletes, and will expire in the past.
            /// </summary>
            /// <param name="name" type="String">
            ///     The name of the cookie
            /// </param>
            /// <param name="value" type="String">
            ///     The value of the cookie
            /// </param>
            /// <param name="persist" type="Boolean" optional="true">
            ///     Make the cookie persistant beyond this sessions (default = false)
            /// </param>
            /// <returns>void</returns>
            if (!persist && $.isStrVal(value, true))
                $.CK.remove(name);
            else
            {
                var sExp = persist ? ('; expires=' + $.CK.PersistDateString) : '';
                document.cookie = ('{0}={1}'.format(name, value) + sExp + '; path=/');
            }
        },
        remove: function(name)
        {
            /// <summary>
            ///     Removes a cookie and its value
            /// </summary>
            /// <param name="name" type="String">
            ///     The name of the cookie
            /// </param>
            /// <returns>void</returns>
            document.cookie = '{0}= ;path=/; expires='.format(name) + $.CK.ExpireDateString;
        },
        "get": function(name)
        {
            /// <summary>
            ///     Get the value of a cookie
            /// </summary>
            /// <param name="name" type="String">
            ///     The name of the cookie to retriee a value for
            /// </param>
            /// <returns type="String">The value of the cookie, or null if it does not exists</returns>
            var oCookies = document.cookie.doubleSplit($.CK.Delimeter, $.CK.Separator);
            if (exists(oCookies[name]))
                return oCookies[name];
            return null;
        },
        getMap: function(name, first, second)
        {
            /// <summary>
            ///     Get the vaue of a cookie dictionary as a set of key-value pairs
            /// </summary>
            /// <param name="name" type="String">
            ///     The name of the cookie to retrieve a value for
            /// </param>
            /// <param name="first" type="String" optional="true">
            ///     The string which separates each node of the map (default = '&')
            /// </param>
            /// <param name="second" type="String" optional="true">
            ///     The string which separates each key-value pair in the map (default = '=')
            /// </param>
            /// <returns>A set of key-value pairs resulting from calling doubleSpit on the cookie value</param>
            return ($.CK.get(name) || '').doubleSplit($.valOrDef(first, $.CK.MapDelimeter), $.valOrDef(second, $.CK.MapSeparator));
        }
    }
})(jQuery);