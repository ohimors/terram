/// <reference path="ja_core.js" />

(function($)
{
    $.Day =
    {
        Names: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        ShortNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        toNumber: function(sName)
        {
            for (var i = 0; i < $.Day.Names.length; i++)
            {
                if ($.Day.Names[i].equals(sName, true) || $.Day.ShortNames[i].equals(sName, true))
                    return i;
            }
            return null;
        }
    }
    // Define $.Day.Sunday, Monday, ..., Saturday
    $.each($.Day.Names, function(idx, name) { $.Day[name] = idx });

    $.Month =
    {
        Names: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        ShortNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        toNumber: function(sName)
        {
            for (var i = 0; i < $.Month.Names.length; i++)
            {
                if ($.Month.Names[i].equals(sName, true) || $.Month.ShortNames[i].equals(sName, true))
                    return i;
            }
            return null;
        }
    }
    // Define $.Month.January, February, ..., December
    $.each($.Month.Names, function(idx, name) { $.Month[name] = idx });

    $.Time =
    {
        UTCTimezoneNames: ['UT', 'UTC', 'GMT', 'Z', '-0000', '+0000', '-00:00', '+00:00', '-00', '+00'],
        UTCName: 'GMT',
        UTCNameISO: 'Z',
        TimezoneOffsets: { 'EDT': 240, 'EST': 300, 'CDT': 300, 'CST': 360, 'MDT': 360, 'MST': 420, 'PDT': 420, 'PST': 480 },
        StandardTimezones: [],
        DaylightSavingsTimezones: [],
        IsUTCTimezone: function(name)
        {
            for (var i = 0; i < $.Time.UTCTimezoneNames.length; i++)
            {
                if ($.Time.UTCTimezoneNames[i].equals(name))
                    return true;
            }
            return false;
        },
        epoch: new Date(0)
    }
    // Define Standard + Daylight Savings Timezones by Offset
    $.each($.Time.TimezoneOffsets,
        function(name, val)
        {
            if (name.match(/DT$/))
                $.Time.DaylightSavingsTimezones[val] = name;
            else
                $.Time.StandardTimezones[val] = name;
        }
    );
    // Add UTC Timezones to TimezoneOffsets
    $.each($.Time.UTCTimezoneNames, function(idx, name) { $.Time.TimezoneOffsets[name] = 0 });
    // Define $.Time.TicksPerWeek, Day, Hour, Minute + Second
    $.Time.TicksPerWeek = (7 * ($.Time.TicksPerDay = (24 * ($.Time.TicksPerHour = (60 * ($.Time.TicksPerMinute = (60 * ($.Time.TicksPerSecond = 1000))))))));

    Date.prototype.clone = function() { return new Date(this.getTime()) }
    Date.prototype.equals = function(date) { return +this == +date }

    DateTime = function(year, month, date, hours, minutes, seconds, milliseconds)
    {
        if (!exists(year))
            this._date = new Date();
        else if (exists(year) && year instanceof Date)
            this._date = year.clone();
        else if (exists(year) && exists(year._date))
            this._date = new Date(+year);
        else if (!exists(month))
            this._date = new Date($.isString(year) && $.isNumeric(year) ? Number(year) : year);
        else if (!exists(hours))
            this._date = new Date(year, month, date);
        else if (!exists(minutes))
            this._date = new Date(year, month, date, hours);
        else if (!exists(seconds))
            this._date = new Date(year, month, date, hours, minutes);
        else if (!exists(milliseconds))
            this._date = new Date(year, month, date, hours, minutes, seconds);
        else
            this._date = new Date(year, month, date, hours, minutes, seconds, milliseconds);
    }
    DateTime.prototype =
    {
        clearTime: function() { return this.setHours(0, 0, 0, 0) },
        clone: function() { return new this.constructor(+this) },
        nativeDate: function() { return new Date(+this) },
        equals: function(date) { return +this == +date },
        add: function(timespan) { this._date.setTime(this + timespan); return this },
        subtract: function(timespan) { this._date.setTime(this - timespan); return this },
        plus: function(timespan) { return this.clone().add(timespan) },
        minus: function(timespan) { return this.clone().subtract(timespan) },
        diff: function(datetime) { return new TimeSpan(Math.abs(this - datetime)) },
        isDST: function()
        {
            var one = new DateTime(this.getFullYear(), 0, 1).getTimezoneOffsetHours();
            var two = new DateTime(this.getFullYear(), 6, 1).getTimezoneOffsetHours();
            var off = this.getTimezoneOffsetHours();
            return (off == one && one < two) || (off == two && two < one)
        },
        getTimezoneOffsetHours: function() { return Math.floor(this._date.getTimezoneOffset() / 60) },
        setTimezoneOffset: function(minutes)
        {
            var minDiff = this.getTimezoneOffset() - minutes;
            if (minDiff > 0)
                this.subtract(TimeSpan.fromMinutes(minDiff));
            else if (minDiff < 0)
                this.add(TimeSpan.fromMinutes(Math.abs(minDiff)));
            return this;
        },
        getMeridiem: function() { return this._date.getHours() < 12 ? 'AM' : 'PM' },
        setMeridiem: function(val)
        {
            if (!this.getMeridiem().equals(val, true))
                this._date.setHours(this._date.getHours() + ('PM'.equals(val, true) ? 12 : ('AM'.equals(val, true) ? -12 : 0)));
            return this;
        },
        getDayOfYear: function()
        {
            return this.clone()
                .clearTime()
                .diff(this.clone()
                    .clearTime()
                    .setFullYear(this.getFullYear(), 0, 1))
                .divideBy(TimeSpan.fromDays(1)) + 1
        },
        setDayOfYear: function(val)
        {
            var dayDiff = val - this.getDayOfYear();
            return (dayDiff > 0) ? this.add(TimeSpan.fromDays(dayDiff)) : (dayDiff < 0 ? this.subtract(TimeSpan.fromDays(Math.abs(dayDiff))) : this);
        },
        getWeekOfYear: function()
        {
            var firstDay = this.clone()
                .clearTime()
                .setFullYear(this.getFullYear(), 0, 1)
                .moveToDay($.Day.Thursday);
            firstDay.moveToDay($.Day.Monday, true, firstDay.getDate() >= 4);
            if (this.getDate() < firstDay.getDate())
                return 0;
            var currMon = this.clone()
                .clearTime()
                .moveToDay($.Day.Monday, false, true);
            return (firstDay.diff(currMon).divideBy(TimeSpan.fromWeeks(1))) + 1;
        },
        setWeekOfYear: function(val)
        {
            var weekDiff = val - this.getWeekOfYear();
            return (weekDiff > 0) ? this.add(TimeSpan.fromWeeks(weekDiff)) : (weekDiff < 0 ? this.subtract(TimeSpan.fromWeeks(Math.abs(weekDiff))) : this);
        },
        addMonths: function(months)
        {
            this._date.setFullYear(this._date.getFullYear(), this._date.getMonth() + $.numOrZero(months));
            return this;
        },
        addYears: function(years)
        {
            this._date.setFullYear(this._date.getFullYear() + $.numOrZero(years));
            return this;
        },
        moveToDay: function(day, force, backwards)
        {
            if ($.isNumeric(day))
            {
                day = Math.round(day % 6);
                var incr = TimeSpan.fromDays(backwards ? -1 : 1);
                if (force)
                    this.add(incr);
                while (this.getDay() != day)
                    this.add(incr);
            }
            return this;
        },
        toString: function(format)
        {
            if (!$.isStrVal(format))
                return this._date.toString();
            var str;
            switch (format)
            {
                // ISO 8601 Format                                                     
                case 'u': str = this.format("yyyy-MM-dd'T'HH:mm:ss(.f)'Z'"); // NOTE: May need to accept ',' instead of ','
                    break;
                // ISO 8601 Format w/o Timezone                                                     
                case 'U': str = this.format("yyyy-MM-dd'T'HH:mm:ss(.f)0");  // NOTE: May need to accept ',' instead of ','
                    break;
                // Standard Sortable Format                                                     
                case 's': str = this.format("yyyy-MM-dd'T'HH:mm:ss0");
                    break;
                // Universal Sortable Format                                                     
                case 'S': str = this.format("yyyy-MM-dd' 'HH:mm:ss'Z'");
                    break;
                // .NET Standard                                                     
                case 'o':
                case 'O': str = this.format("yyyy-MM-dd'T'HH:mm:ss.fffzz");
                    break;
                // Javascript 'JSON' Format                                                     
                case 'j':
                case 'J': str = this.toJSON();
                    break;
                // Javascript 'ISO' Format                                                     
                case 'i':
                case 'I': str = this.toISOString();
                    break;
                // RFC1123 Format                                                     
                case 'r':
                case 'R': str = this._date.toUTCString();
                    break;
                // Short Date String                                                     
                case 'd': str = this._date.toDateString();
                    break;
                // Culture-Based Long Date String                                                     
                case 'D': str = this._date.toLocaleDateString();
                    break;
                // Short Time String                                                     
                case 't': str = this._date.toTimeString();
                    break;
                // Culture-Based Long Time String                                                     
                case 'T': str = this._date.toLocaleTimeString();
                    break;
                // Culter-Based Full String                   
                case 'l':
                case 'L': str = this._date.toLocaleString();
                    break;
                default: str = this._date.toString();
                    break;
            }
            return str;
        },
        format: function(format)
        {
            var oFormat = new DateTimeFormatter(format);
            return oFormat.format(this);
        },

        // Low-Level Date Overrides
        valueOf: function() { return this._date.valueOf() },
        toJSON: function()
        {
            if (exists(this._date.toJSON))
                return this._date.toJSON();
            return this.toISOString();
        },
        toISOString: function()
        {
            if (exists(this._date.toISOString))
                return this._date.toISOString();
            return this.format("yyyy-MM-dd'T'HH:mm:ss.fff'Z'");
        }
    }
    DateTime.prototype.constructor = DateTime;
    DateTime.parse = function(toParse, format) { return (new DateTimeFormatter(format)).parse(toParse) }
    DateTime.format = function(date, format) { return (date instanceof DateTime) ? date.format(format) : (new DateTime(date)).format(format) }

    function _addDTSetters(arrNames)
    {
        $.each(arrNames,
            function(_, name)
            {
                if (exists(Date.prototype[name]))
                    DateTime.prototype[name] = function() { this._date[name].apply(this._date, arguments); return this }
            }
            );
    }
    function _addDTGetters(arrNames)
    {
        $.each(arrNames,
            function(_, name)
            {
                if (exists(Date.prototype[name]))
                    DateTime.prototype[name] = function() { return this._date[name]() }
            }
            );
    }
    _addDTSetters('setFullYear setMonth setDate setUTCFullYear setUTCMonth setUTCDate'.split(' '));
    _addDTGetters('getFullYear getMonth getDate getDay getUTCFullYear getUTCMonth getUTCDate getUTCDay toDateString toLocaleDateString toLocaleString toUTCString'.split(' '));

    DateObj = function(year, month, day)
    {
        if ($.isNumeric(day))
            DateTime.apply(this, [year, month, day]);
        else if (exists(year))
            DateTime.apply(this, [year]);
        else
            DateTime.apply(this, []);
        this.clearTime();
    }
    DateObj.derivesFrom(DateTime);

    _addDTSetters('setHours setMinutes setSeconds setMilliseconds setUTCHours setUTCMinutes setUTCSeconds setUTCMilliseconds setTime'.split(' '));
    _addDTGetters('getHours getMinutes getSeconds getMilliseconds getUTCHours getUTCMinutes getUTCSeconds getUTCMilliseconds getTime getTimezoneOffset toTimeString toLocaleTimeString'.split(' '));

    TimeSpan = function(milliseconds, seconds, minutes, hours, days, weeks)
    {
        if (!exists(milliseconds))
            this._date = $.Time.epoch.clone();
        else if (milliseconds instanceof Date)
            this._date = milliseconds.clone();
        else if (milliseconds._date instanceof Date)
            this._date = milliseconds._date.clone();
        else
        {
            this._date = $.Time.epoch.clone();
            if (exists(weeks) || exists(days))
                this._date.setUTCFullYear(this._date.getUTCFullYear(), this._date.getUTCMonth(), this._date.getUTCDate() + (7 * $.numOrZero(weeks)) + $.numOrZero(days));
            this._date.setUTCHours($.numOrZero(hours), $.numOrZero(minutes), $.numOrZero(seconds), $.numOrZero(milliseconds));
        }
    }
    TimeSpan.prototype =
    {
        divideBy: function(timespan) { return Math.floor(this / timespan) },
        valueOf: function() { return this._date.getTime() }
    }
    TimeSpan.fromSeconds = function(seconds) { return new TimeSpan($.Time.TicksPerSecond * $.numOrZero(seconds)) }
    TimeSpan.fromMinutes = function(minutes) { return new TimeSpan($.Time.TicksPerMinute * $.numOrZero(minutes)) }
    TimeSpan.fromHours = function(hours) { return new TimeSpan($.Time.TicksPerHour * $.numOrZero(hours)) }
    TimeSpan.fromDays = function(days) { return new TimeSpan($.Time.TicksPerDay * $.numOrZero(days)) }
    TimeSpan.fromWeeks = function(weeks) { return new TimeSpan($.Time.TicksPerWeek * $.numOrZero(weeks)) }

    var DateTimeFormatter = function(sFormat)
    {
        this.parts = [];
        this.isUTC = false;
        var plain = false,
            orChars = false,
            parenDepth = 0;
        for (var iChar = 0; iChar < sFormat.length; iChar++)
        {
            var next = sFormat.charAt(iChar);
            if (next == "'")
            {
                var literal = '';
                plain = (iChar < (sFormat.length - 1));
                while (plain && iChar < (sFormat.length - 1))
                {
                    next = sFormat.charAt(++iChar);
                    if (next == "'")
                    {
                        if (((iChar + 1) < sFormat.length) && sFormat.charAt(iChar + 1) == "'")
                            literal += sFormat.charAt(++iChar);
                        else
                            plain = false;
                    }
                    else
                        literal += next;
                }
                if ($.isStrVal(literal))
                    this.addPlain(literal);
            }
            else if (next == "(")
            {
                var group = '';
                parenDepth = 1;
                while (parenDepth > 0 && iChar < (sFormat.length - 1))
                {
                    next = sFormat.charAt(++iChar);
                    if (next == "(")
                        parenDepth++;
                    else if (next == ")")
                        parenDepth--;
                    if (parenDepth > 0)
                        group += next;
                }
                if ($.isStrVal(group))
                    this.parts.push(new DateTimeFormatter(group));
            }
            else if (next == "[")
            {
                var group = [];
                orChars = true;
                while (orChars && iChar < (sFormat.length - 1))
                {
                    next = sFormat.charAt(++iChar);
                    if (next == "]")
                        orChars = false;
                    else
                        group.push(next);
                }
                if (group.length > 0)
                    this.parts.push(group);
            }
            else if (exists(_formats[next]))
            {
                while (exists(_formats[next + sFormat.charAt(iChar + 1)]) && iChar < sFormat.length)
                    next += sFormat.charAt(++iChar);
                this.parts.push(_formats[next]);
            }
            else
                this.addPlain(next);
        }
        if (plain)
            throw "Invalid date format string: Unterminated quote ( ' ) char";
        if (orChars)
            throw "Invalid date format string: Unterminated bracket '[' char";
        if (parenDepth > 0)
            throw "Invalid date format string: Unterminated group indicator '('";
        // If this format ends w/ a literal representing UTC time
        // this will parse dates as UTC and move them to local time
        // and this will move local dates to UTC before generating a formatted string
        var end = this.parts[this.parts.length - 1];
        if ($.isStrVal(end))
        {
            for (var i = 0; i < $.Time.UTCTimezoneNames.length; i++)
            {
                var tz = $.Time.UTCTimezoneNames[i];
                if (tz.length <= end.length)
                {
                    var pos = end.find(tz, true);
                    if (pos == (end.length - tz.length))
                    {
                        this.isUTC = true;
                        break;
                    }
                }
            }
            if (!this.isUTC && end.find('0') == (end.length - 1))
            {
                this.isUTC = true;
                if (end.length == 1)
                    this.parts.pop();
                else
                    this.parts[this.parts.length - 1] = end.substr(0, end.length - 2);
            }
        }
    }
    DateTimeFormatter.prototype =
    {
        addPlain: function(str)
        {
            if (this.parts.length == 0 || !$.isString(this.parts[this.parts.length - 1]))
                this.parts.push(str);
            else
                this.parts[this.parts.length - 1] += str;
        },
        format: function(dateObj)
        {
            var copy = (dateObj instanceof Date) ? new DateTime(dateObj) : dateObj.clone();
            if (this.isUTC)
                copy = copy.add(TimeSpan.fromMinutes(copy.getTimezoneOffset()));
            return this._format(copy);
        },
        parse: function(toParse)
        {
            var reg = new RegExp('^' + this.genRegX() + '$');
            var match = toParse.match(reg);
            if (match)
            {
                var date = new DateTime($.Time.TicksPerMinute * $.Time.epoch.getTimezoneOffset());
                this._applyMatches(date, match, 1);
                return this.isUTC ? date.subtract(TimeSpan.fromMinutes(date.getTimezoneOffset())) : date;
            }
            return null;
        },
        genRegX: function()
        {
            var str = '';
            for (var i = 0; i < this.parts.length; i++)
            {
                var part = this.parts[i];
                if (exists(part))
                {
                    if (part instanceof DateTimeFormatter)
                        str += '(' + part.genRegX() + ')?';
                    else if ($.isString(part))
                        str += part.replace(/([\\\^\$*+[\]?{}.=!:(|)])/g, "\\$&");
                    else if ($.isArray(part))
                        str += '[' + part.join('').replace(/([\\\^\$*+[\]?{}.=!:(|)])/g, "\\$&") + ']';
                    else
                        str += '(' + part.regx + ')';
                }
            }
            return str;
        },
        _format: function(datetime)
        {
            var str = '';
            for (var i = 0; i < this.parts.length; i++)
            {
                var part = this.parts[i];
                if (exists(part))
                {
                    if (part instanceof DateTimeFormatter)
                        str += part._format(datetime);
                    else if ($.isString(part))
                        str += part;
                    else if ($.isArray(part))
                        str += part[0];
                    else
                        str += part.get(datetime);
                }
            }
            return str;
        },
        _applyMatches: function(date, matches, groupNum)
        {
            for (var i = 0; i < this.parts.length; i++)
            {
                var part = this.parts[i];
                if (exists(part))
                {
                    if (part instanceof DateTimeFormatter)
                    {
                        if (matches[groupNum])
                            groupNum = part._applyMatches(date, matches, ++groupNum);
                        else
                            groupNum += (part._getGroupCount() + 1);
                    }
                    else if (!$.isString(part) && !$.isArray(part))
                    {
                        if (matches[groupNum])
                            part.set(date, matches[groupNum]);
                        groupNum++;
                    }
                }
            }
            return groupNum;
        },
        _getGroupCount: function()
        {
            var count = 0;
            for (var i = 0; i < this.parts.length; i++)
            {
                var part = this.parts[i];
                if (exists(part))
                {
                    if (part instanceof DateTimeFormatter)
                        count += part._getGroupCount();
                    else if (!$.isString(part) && !$.isArray(part))
                        count++;
                }
            }
            return count;
        }
    }

    DateTime.Formats =
    {
        // ctime Format (HTTP)
        // ctime_old: "ddd MM  d HH:mm:ss yyyy",
        ctime: "ddd MMM dD HH:mm:ss yyyy",
        // USENET (RFC 850) - http://www.ietf.org/rfc/rfc0850.txt
        USENET_850: "dddd, d-MMM-yy HH:mm:ss Z", // NOTE: Should be name only, but simplifying
        // USENET (RFC 1036) - http://www.ietf.org/rfc/rfc1036.txt
        USENET_1036: "ddd, d MMM yy HH:mm:ss ZZZZ",
        // USENET/HTTP Format (RFC 850, obsoleted by RFC 1036) - http://www.ietf.org/rfc/rfc2616.txt
        USENET: "dddd dd-MMM-yy HH:mm:ss 'GMT'",
        // ARPA Internet Text Messages (RFC 822) - http://www.ietf.org/rfc/rfc0822.txt
        ARPA: "(ddd, )d MMM yy HH:mm(:ss) ZZZz",
        // RSS (Based on RFC 822) - http://cyber.law.harvard.edu/rss/rss.html
        // RSS_old: "(ddd, )d MMM yy HH:mm:ss 'GMT'",
        RSS: "(ddd, )d MMM yyy HH:mm:ss 'GMT'",
        // RFC 2822 (Internet Message Format) - http://www.ietf.org/rfc/rfc2822.txt
        // NOTE: Alpha Timezone's are technically valid, but should always be parsed as -0000
        // RFC_2822_old: "(ddd, )d MMM yy HH:mm(:ss) [Names|'UT'|'GMT'|zzzz|[A-Za-z]]",
        RFC_2822: "(ddd, )d MMM yyy HH:mm(:ss) ZZZz",
        // RFC 1123 (Internet Hosts - Applications and Support) - http://www.ietf.org/rfc/rfc1123.txt
        // NOTE: Alpha Timezone's are technically valid, but should always be parsed as -0000
        // RFC_1123_old: "(ddd, )d MMM yy HH:mm(:ss) [Names|'UT'|'GMT'|zzzz|[A-Z-a-z]]",
        RFC_1123: "(ddd, )d MMM yyy HH:mm(:ss) ZZZz",
        // HTTP Protocol (RFC 2616) http://www.ietf.org/rfc/rfc2616.txt
        HTTP: "ddd, dd MMM yyyy HH:mm:ss 'GMT'",
        // RFC 2109 (HTTP State Management) - http://www.ietf.org/rfc/rfc2109.txt
        RFC_2109: "ddd, dd-MMM-yy HH:mm:ss 'GMT'",
        // Cookies Formats (Based on RFC 2109) - http://www.ietf.org/rfc/rfc2109.txt
        Cookies: "ddd, dd[ -]MMM[ -]yyyy HH:mm:ss 'GMT'",
        // Cookies_alt: "ddd, dd MMM yyyy HH:mm:ss 'GMT'",
        // XML Format (Based on ISO 8601)
        XML: "yyyy-MM-dd'T'HH:mm:ss(.f)zzz",
        // W3C Format (ISO 8601) - http://www.w3.org/TR/NOTE-datetime
        W3C: "yyyy(-MM(-dd('T'HH:mm(:ss(.f))zzz)))",
        W3C_6: "yyyy-MM-dd'T'HH:mm:ss.fzzz",
        W3C_5: "yyyy-MM-dd'T'HH:mm:sszzz",
        W3C_4: "yyyy-MM-dd'T'HH:mmzzz",
        // HTML/XHTML (W3C #5)
        HTML: "yyyy-MM-dd'T'HH:mm:sszzz",
        // RFC 3339 (ISO 8601) - http://tools.ietf.org/html/rfc3339
        RFC_3339: "yyyy-MM-dd[ T]HH:mm:ss(.f)z",
        // The Atom Syndication Format (RFC 4287) - http://tools.ietf.org/html/rfc4287#section-3.3
        ATOM: "yyyy-MM-dd'T'HH:mm:ss(.f)z"
    }
    DateObj.Formats =
    {
        // USENET (RFC 850) - http://www.ietf.org/rfc/rfc0850.txt
        USENET_850: "dddd, d-MMM-yy",
        // USENET (RFC 1036) - http://www.ietf.org/rfc/rfc1036.txt
        USENET_1036: "ddd, d MMM yy",
        // USENET/HTTP Format (RFC 850, obsoleted by RFC 1036) - http://www.ietf.org/rfc/rfc2616.txt
        USENET: "dd-MMM-yy",
        // ARPA Internet Text Messages (RFC 822) - http://www.ietf.org/rfc/rfc0822.txt
        ARPA: "d MMM yy",
        // RSS (Based on RFC 822) - http://cyber.law.harvard.edu/rss/rss.html
        // RSS_old: "d MMM yy",
        RSS: "d MMM yyy",
        // RFC 2822 (Internet Message Format) - http://www.ietf.org/rfc/rfc2822.txt
        // RFC_2822_old: "d MMM yy",
        RFC_2822: "dd MMM yyy",
        // RFC 1123 (Internet Hosts - Applications and Support) - http://www.ietf.org/rfc/rfc1123.txt
        // RFC_1123_old: "d MMM yy",
        RFC_1123: "dd MMM yyy",
        // HTTP Protocol (RFC 2616) http://www.ietf.org/rfc/rfc2616.txt
        HTTP: "dd MMM yyyy",
        // RFC 2109 (HTTP State Management) - http://www.ietf.org/rfc/rfc2109.txt
        RFC_2109: "ddd, dd-MMM-yy",
        // Cookies Formats (Based on RFC 2109) - http://www.ietf.org/rfc/rfc2109.txt
        Cookies: "ddd, dd[ -]MMM[ -]yyyy",
        // Cookies_alt: "ddd, dd MMM yyyy",
        // XML Format (Based on ISO 8601)
        XML: "yyyy-MM-dd",
        // W3C Format (ISO 8601) - http://www.w3.org/TR/NOTE-datetime
        W3C_3: "yyyy-MM-dd",
        W3C_2: "yyyy-MM",
        W3C_1: "yyyy",
        // RFC 3339 (ISO 8601) - http://tools.ietf.org/html/rfc3339
        RFC_3339: "yyyy-MM-dd",
        // The Atom Syndication Format (RFC 4287) - http://tools.ietf.org/html/rfc4287#section-3.3
        ATOM: "yyyy-MM-dd"
    }

    var _reg1d = "\\d{1,2}",
        _reg2d = "\\d{2}",
        _regTZ = "UT|UTC|GMT|EST|EDT|CST|CDT|MST|MDT|PST|PDT",
        _regTZ2 = "[+-]\\d{2}",
        _regTZ4 = "[+-]\\d{4}",
        _regTZ5 = "[+-]\\d{2}:\\d{2}";

    var _formats =
    {
        '@': { regx: "\\d+", get: function(d) { return d.getTime() }, set: function(d, v) { return d.setTime(Number(v)) } },
        'd': { regx: _reg1d, get: function(d) { return d.getDate() }, set: function(d, v) { return d.setFullYear(d.getFullYear(), d.getMonth(), Number(v)) } },
        'dd': { regx: _reg2d, get: function(d) { return $.strPad(_formats['d'].get(d), 2, '0') }, set: function(d, v) { return _formats['d'].set(d, v) } },
        'ddd': { regx: $.Day.ShortNames.join('|'), get: function(d) { return $.Day.ShortNames[d.getDay()] }, set: function(d, v) { return d.moveToDay($.Day.toNumber(v)) } },
        'dddd': { regx: $.Day.Names.join('|'), get: function(d) { return $.Day.Names[d.getDay()] }, set: function(d, v) { return d.moveToDay($.Day.toNumber(v)) } },
        'D': { regx: "\\d{1,3}", get: function(d) { return d.getDayOfYear() }, set: function(d, v) { return d.setDayOfYear(Number(v)) } },
        'DD': { regx: "\\d{3}", get: function(d) { return $.strPad(_formats['D'].get(d), 3, '0') }, set: function(d, v) { return _formats['D'].set(d, v) } },
        'f': { regx: "\\d+", get: function(d) { return d.getMilliseconds() == 0 ? '0' : Number(d.getMilliseconds() / 1000).toString().substr(2) }, set: function(d, v) { return d.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), (Number('0.' + (v.length > 3 ? v.substr(0, 3) : v)) * 1000)) } },
        'ff': { regx: _reg2d, get: function(d) { return $.strPad(_formats['f'].get(d), 2, '0', true).substring(0, 2) }, set: function(d, v) { return _formats['f'].set(d, v) } },
        'fff': { regx: "\\d{3}", get: function(d) { return $.strPad(_formats['f'].get(d), 3, '0', true) }, set: function(d, v) { return _formats['f'].set(d, v) } },
        'h': { regx: _reg1d, get: function(d) { return d.getHours() % 12 || 12 }, set: function(d, v) { return d.setHours(Number(v)) } },
        'hh': { regx: _reg2d, get: function(d) { return $.strPad(_formats['h'].get(d), 2, '0') }, set: function(d, v) { return _formats['h'].set(d, v) } },
        'H': { regx: _reg1d, get: function(d) { return d.getHours() }, set: function(d, v) { return d.setHours(Number(v)) } },
        'HH': { regx: _reg2d, get: function(d) { return $.strPad(_formats['H'].get(d), 2, '0') }, set: function(d, v) { return _formats['H'].set(d, v) } },
        'm': { regx: _reg1d, get: function(d) { return d.getMinutes() }, set: function(d, v) { return d.setHours(d.getHours(), Number(v)) } },
        'mm': { regx: _reg2d, get: function(d) { return $.strPad(_formats['m'].get(d), 2, '0') }, set: function(d, v) { return _formats['m'].set(d, v) } },
        'M': { regx: _reg1d, get: function(d) { return d.getMonth() + 1 }, set: function(d, v) { return d.setFullYear(d.getFullYear(), Number(v) - 1) } },
        'MM': { regx: _reg2d, get: function(d) { return $.strPad(_formats['M'].get(d), 2, '0') }, set: function(d, v) { return _formats['M'].set(d, v) } },
        'MMM': { regx: $.Month.ShortNames.join('|'), get: function(d) { return $.Month.ShortNames[d.getMonth()] }, set: function(d, v) { return d.setFullYear(d.getFullYear(), $.Month.toNumber(v)) } },
        'MMMM': { regx: $.Month.Names.join('|'), get: function(d) { return $.Month.Names[d.getMonth()] }, set: function(d, v) { return d.setFullYear(d.getFullYear(), $.Month.toNumber(v)) } },
        's': { regx: _reg1d, get: function(d) { return d.getSeconds() }, set: function(d, v) { return d.setHours(d.getHours(), d.getMinutes(), Number(v)) } },
        'ss': { regx: _reg2d, get: function(d) { return $.strPad(_formats['s'].get(d), 2, '0') }, set: function(d, v) { return _formats['s'].set(d, v) } },
        't': { regx: "a|p", get: function(d) { return _formats['T'].get(d).toLowerCase() }, set: function(d, v) { return _formats['T'].set(d, v) } },
        'tt': { regx: "am|pm", get: function(d) { return _formats['TT'].get(d).toLowerCase() }, set: function(d, v) { return _formats['TT'].set(d, v) } },
        'T': { regx: "A|P", get: function(d) { return _formats['TT'].get(d).substr(0, 1) }, set: function(d, v) { return _formats['TT'].set(d, v + 'm') } },
        'TT': { regx: "AM|PM", get: function(d) { return d.getMeridiem() }, set: function(d, v) { return d.setMeridiem(v) } },
        'w': { regx: _reg1d, get: function(d) { return d.getWeekOfYear() }, set: function(d, v) { return d.setWeekOfYear(Number(v)) } },
        'ww': { regx: _reg2d, get: function(d) { return $.strPad(_formats['w'].get(d), 2, '0') }, set: function(d, v) { return _formats['w'].set(d, v) } },
        'y': { regx: "-?\\d{1,4}", get: function(d) { return d.getFullYear() }, set: function(d, v) { return d.setFullYear(Number(v)) } },
        'yy':
        {
            regx: "-?\\d{2}",
            get: function(d) { return d.getFullYear() % 100 },
            set: function(d, v)
            {
                var val = Number(v);
                var curr = d.getFullYear() % 100;
                var up = val > curr ? (val - curr) : (100 + val) - curr;
                return up <= 50 ? d.setFullYear(d.getFullYear() + up) : d.setFullYear(d.getFullYear() - (100 - up));
            }
        },
        'yyy': { regx: "-?\\d{2}|-?\\d{1,4}", get: function(d) { return _formats['yyyy'].get(d) }, set: function(d, v) { return ((v.length == 2 && !v.startsWith('-')) || (v.length == 3 && v.startsWith('-'))) ? _formats['yy'].set(d, v) : _formats['y'].set(d, v) } },
        'yyyy': { regx: "-?\\d{4}", get: function(d) { return $.strPad(d.getFullYear(), 4, '0') }, set: function(d, v) { return _formats['y'].set(d, v) } },
        'z':
        {
            regx: $.Time.UTCNameISO + "|" + _regTZ2 + "|" + _regTZ4 + "|" + _regTZ5,
            get: function(d) { return (d.getTimezoneOffset() == 0) ? "-0000" : _formats['zzzz'].get(d) },
            set: function(d, v)
            {
                if (v == $.Time.UTCNameISO)
                    d.setTimezoneOffset(0);
                else
                {
                    switch (v.length)
                    {
                        case 3: _formats['zz'].set(d, v);
                            break;
                        case 5: _formats['zzzz'].set(d, v);
                            break;
                        case 6: _formats['zzz'].set(d, v);
                            break;
                    }
                }
                return d;
            }
        },
        'zz': { regx: $.Time.UTCNameISO + "|" + _regTZ2, get: function(d) { var off = d.getTimezoneOffset(); return off == 0 ? $.Time.UTCNameISO : (off >= 0 ? '-' : '+') + $.strPad(Math.abs(Math.round(off / 60)), 2, '0') }, set: function(d, v) { return d.setTimezoneOffset((0 - Number($.Time.UTCNameISO.equals(v) ? "0" : v)) * 60) } },
        'zzz':
        {
            regx: $.Time.UTCNameISO + "|" + _regTZ5,
            get: function(d)
            {
                var offH = d.getTimezoneOffsetHours();
                var offM = d.getTimezoneOffset() - (offH * 60);
                return (offH == 0 && offM == 0) ? $.Time.UTCNameISO : (d.getTimezoneOffset() >= 0 ? '-' : '+') + $.strPad(Math.abs(offH), 2, '0') + ':' + $.strPad(Math.abs(offM), 2, '0');
            },
            set: function(d, v) { var tz = $.Time.UTCNameISO.equals(v) ? '-00:00' : v; return d.setTimezoneOffset((tz.startsWith('-') ? 1 : -1) * ((Number(tz.substr(1, 2)) * 60) + Number(tz.substr(4)))) }
        },
        'zzzz': { regx: $.Time.UTCNameISO + "|" + _regTZ4, get: function(d) { return _formats['zzz'].get(d).replace(':', '') }, set: function(d, v) { var val = $.Time.UTCNameISO.equals(v) ? 0 : Number(v); return d.setTimezoneOffset((val < 0 ? 1 : -1) * ((Math.abs(Math.floor(val / 100)) * 60) + (Math.abs(val) % 100))) } },
        'Z':
        {
            regx: _regTZ + "|" + _regTZ2 + "|" + _regTZ4 + "|" + _regTZ5,
            get: function(d) { return _formats['z'].get(d) },
            set: function(d, v)
            {
                if (v.match(new RegExp("^" + _regTZ + "$")))
                {
                    if (exists($.Time.TimezoneOffsets[v]))
                        d.setTimezoneOffset($.Time.TimezoneOffsets[v]);
                }
                else
                {
                    switch (v.length)
                    {
                        case 3: _formats['zz'].set(d, v);
                            break;
                        case 5: _formats['zzzz'].set(d, v);
                            break;
                        case 6: _formats['zzz'].set(d, v);
                            break;
                    }
                }
                return d;
            }
        },
        'ZZ':
        {
            regx: _regTZ + "|" + _regTZ2,
            get: function(d)
            {
                var off = d.getTimezoneOffset();
                if (off == 0)
                    return $.Time.UTCName;
                else if (exists($.Time.DaylightSavingsTimezones[off]) && d.isDST())
                    return $.Time.DaylightSavingsTimezones[off];
                else if (exists($.Time.StandardTimezones[off]) && !d.isDST())
                    return $.Time.StandardTimezones[off];
                else
                    return (off >= 0 ? '-' : '+') + $.strPad(Math.abs(Math.round(off / 60)), 2, '0');
            },
            set: function(d, v)
            {
                if (v.match(new RegExp("^" + _regTZ + "$")))
                {
                    if (exists($.Time.TimezoneOffsets[v]))
                        return d.setTimezoneOffset($.Time.TimezoneOffsets[v]);
                    else
                        return d;
                }
                else
                    return d.setTimezoneOffset((0 - Number(v)) * 60);
            }
        },
        'ZZZ':
        {
            regx: _regTZ + "|" + _regTZ5,
            get: function(d)
            {
                var off = d.getTimezoneOffset();
                if (off == 0)
                    return $.Time.UTCName;
                else if (exists($.Time.DaylightSavingsTimezones[off]) && d.isDST())
                    return $.Time.DaylightSavingsTimezones[off];
                else if (exists($.Time.StandardTimezones[off]) && !d.isDST())
                    return $.Time.StandardTimezones[off];
                else
                    return (off >= 0 ? '-' : '+') + $.strPad(Math.abs(Math.floor(off / 60)), 2, '0') + ':' + $.strPad(Math.abs(off % 60), 2, '0');
            },
            set: function(d, v)
            {
                if (v.match(new RegExp("^" + _regTZ + "$")))
                {
                    if (exists($.Time.TimezoneOffsets[v]))
                        return d.setTimezoneOffset($.Time.TimezoneOffsets[v]);
                    else
                        return d;
                }
                else
                    return d.setTimezoneOffset((v.startsWith('-') ? 1 : -1) * ((Number(v.substr(1, 2)) * 60) + Number(v.substr(4))));
            }
        },
        'ZZZZ':
        {
            regx: _regTZ + "|" + _regTZ4,
            get: function(d) { return _formats['ZZZ'].get(d).replace(":", "") },
            set: function(d, v)
            {
                if (v.match(new RegExp("^" + _regTZ + "$")))
                {
                    if (exists($.Time.TimezoneOffsets[v]))
                        return d.setTimezoneOffset($.Time.TimezoneOffsets[v]);
                    else
                        return d;
                }
                else
                {
                    var val = Number(v);
                    return d.setTimezoneOffset((val < 0 ? 1 : -1) * ((Math.abs(Math.floor(val / 100)) * 60) + (Math.abs(val) % 100)));
                }
            }
        },
        'o':
        {
            regx: "\\d{1,2}th|\\d{1,2}st|\\d{1,2}nd|\\d{1,2}rd",
            get: function(d)
            {
                var date = d.getDate();
                if (date > 10 && date < 20)
                    return date + 'th';
                return date + (['st', 'nd', 'rd'][date % 10 - 1] || 'th');
            },
            set: function(d, v) { return d.setDate(Number(v.substr(0, v.length - 2))) }
        },
        // For Internal Use Only
        'ZZZz': { regx: _regTZ + "|" + _regTZ4 + "|[A-Ia-iK-Zk-z]", get: function(d) { return _formats['ZZZZ'].get(d) }, set: function(d, v) { return v.length != 1 ? _formats['ZZZZ'].set(d, v) : d } },
        'dD': { regx: "[ 123]\\d", get: function(d) { return $.strPad(d.getDate(), 2, " ") }, set: function(d, v) { return _formats['d'].set(d, v.trim()) } }
    };

})(jQuery);