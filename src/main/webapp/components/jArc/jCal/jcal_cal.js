/// <reference path="..\ja_core.js" />
/// <reference path="..\ja_events.js" />
/// <reference path="..\ja_ui.js" />
/// <reference path="..\ja_datetime.js" />
/// <reference path="jcal_core.js" />
/// <reference path="jcal_header.js" />
/// <reference path="jcal_month.js" />

$.jaCalendar = function(options, events)
{
    var props = { height: options.height + 'px', id: 'idDiv-calendar' };
    return $.UI.Hybrid.apply(this, [$.jaCalendar, 'div', props, arguments]);
}
$.jaCalendar.prototype =
{
    objConstructor: function(options, events)
    {
        this.options = options;

        this._startDate = new DateObj(this.options.date || new Date());
        this._viewId = 'idDiv-cal-month';
        this._headerId = 'idTbl-cal-header';

        // TODO: Convert raw events into $.jaCalEvents
        this.calEvents = [];
        var newEvents = $.arrOrEmpty(events);
        if (newEvents.length > 0)
        {
            this._calEvents = [];
            for (var i = 0; i < newEvents.length; i++)
                this.calEvents.push(newEvents[i]._guid);
        }
    },
    getView: function() { return $(this).find('#' + this._viewId) },
    getHeader: function() { return $(this).find('#' + this._headerId) },
    refresh: function()
    {
        var $header = this.getHeader();
        if (!$exists($header))
        {
            $header = $(new $.jaCalHeader(this.options, { id: this._headerId }))
                .$bind($.jaCalHeader.On.Next, this.evt_header_onnext, this)
                .$bind($.jaCalHeader.On.Prev, this.evt_header_onprev, this)
                .appendTo($(this));
        }
        // TODO: Accept title format as option -> opt('titleFormat')
        $header.un$().setTitle(this._startDate.format('MMMM yyyy'));

        // TODO: Try to be smart about refreshing
        var $view = this.getView();
        if (!$exists($view))
        {
            $(new $.jaMonthView(this.options, this._startDate, this.calEvents, { id: this._viewId }))
                .appendTo($(this));
        }
        else
        {
            $view.un$()
                .setCalEvents(this.calEvents)
                .setStartDate(this._startDate);
        }
        return this;
    },
    addCalEvents: function(rawEvents)
    {
        // TODO: Convert raw events into $.jaCalEvents
        rawEvents = $.arrOrEmpty(rawEvents);
        if (rawEvents.length > 0)
        {
            var newEvents = [];
            for (var i = 0; i < rawEvents.length; i++)
                newEvents.push(rawEvents[i]._guid);
            this.getView()
                .un$()
                .addCalEvents(newEvents)
                .refresh();
            this.calEvents = this.calEvents.concat(newEvents);
        }
        return this;
    },
    evt_header_onnext: function(oEvt)
    {
        this._startDate.addMonths(1);
        this.refresh();
    },
    evt_header_onprev: function(oEvt)
    {
        this._startDate.addMonths(-1);
        this.refresh();
    }
}
$.jaCalendar.derivesFrom($.UI.Hybrid);