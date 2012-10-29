/// <reference path="..\ja_core.js" />
/// <reference path="..\ja_events.js" />
/// <reference path="..\ja_datetime.js" />

$.Cal =
{
    Theme: 'fc',
    Defaults:
    {
        eventMinutes: 60
    },
    _evguid: 1,
    _guid: function() { return 'jacalevt' + ($.Cal._evguid++) },
    _evcache: []
}