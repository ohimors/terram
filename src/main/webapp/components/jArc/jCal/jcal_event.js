/// <reference path="..\ja_core.js" />
/// <reference path="..\ja_events.js" />
/// <reference path="..\ja_ui.js" />
/// <reference path="..\ja_datetime.js" />
/// <reference path="jcal_core.js" />

$.jaCalEvent = function(props, data)
{
    data = $.valOrDef(data, {});

    this._guid = $.Cal._guid();
    $.Cal._evcache[this._guid] = this;
    this.title = $.valOrDef(data.title, props.title || this._guid) + '';
    this.startDT = new DateTime(data.start || props.start);
    var end = $.valOrDef(data.end || props.end);
    if (exists(end))
        this.endDT = new DateTime(end);
    else
        this.endDT = this.startDT.minus(TimeSpan.fromMinutes($.Cal.Defaults.eventMinutes));
    data.start = data.start || this.startDT.nativeDate();
    data.end = data.end || this.endDT.nativeDate();

    this.data = data;
}
$.jaCalEvent.prototype =
{
    // TODO: Need 1 TS for incrementing start/end, and 1 TS for visible area (ie No Weekends)
    createSegments: function(dtStart, dtEnd, tsGroup, tsSlot)
    {
        var start = dtStart.clone(),
            end = start.clone().add(tsGroup),
            group = 0,
            segs = [];
        while (start < dtEnd)
        {
            if (this.endDT > start &&
                this.startDT < end)
            {
                var segId = this._guid + '-' + segs.length,
                    slot = 0,
                    segProps = { start: start.clone(),
                        end: end.clone(),
                        isStart: false,
                        isEnd: false,
                        evguid: this._guid,
                        group: group
                    };
                if (this.startDT >= start)
                {
                    segProps.start = this.startDT.clone();
                    segProps.isStart = true;
                }
                if (this.endDT <= end)
                {
                    segProps.end = this.endDT.clone();
                    segProps.isEnd = true;
                }
                // Determine slot & span
                var groupEndSlot = end.diff(start).divideBy(tsSlot);
                if (groupEndSlot > 0)
                    groupEndSlot--;
                segProps.slot = segProps.start.diff(start).divideBy(tsSlot);
                // Determine how many slots this spans
                var endSlot = groupEndSlot - (end.diff(segProps.end).divideBy(tsSlot));
                segProps.span = (endSlot - segProps.slot) + 1;
                // Add segment to list of returned segments
                segs.push(new $.jaEventSegment(segProps, { id: segId }));
            }
            else
            {
                segs.push(null);
            }
            start = end.clone();
            end.add(tsGroup);
            group++;
        }
        return segs;
    }
}

$.jaEventSegment = function(props, uiProps)
{
    uiProps = uiProps || {};
    return $.UI.Hybrid.apply(this, [$.jaEventSegment, 'div', uiProps, arguments]);
}
$.jaEventSegment.prototype =
{
    objConstructor: function(props)
    {
        this.start = props.start;
        this.end = props.end;
        this.isStart = props.isStart === true;
        this.isEnd = props.isEnd === true;
        this.evguid = props.evguid;
        this.group = $.valOrDef(props.group, -1);
        this.slot = $.valOrDef(props.slot, -1);
        this.span = $.valOrDef(props.span, -1);
        this.level = -1;
    },
    getCalEvent: function() { return $.Cal._evcache[this.evguid] },
    getTimespan: function() { return new TimeSpan(this.end - this.start) }
}
$.jaEventSegment.derivesFrom($.UI.Hybrid);

$.jaEventSegment.dateOrderComparer = function(one, two)
{
    var res = one.start - two.start;
    if (res == 0)
        return two.end - one.end;
    return res;
}