/// <reference path="..\ja_core.js" />
/// <reference path="..\ja_events.js" />
/// <reference path="..\ja_ui.js" />
/// <reference path="..\ja_datetime.js" />
/// <reference path="jcal_core.js" />
/// <reference path="jcal_event.js" />
/// <reference path="..\..\jQuery\ui\jquery.ui.core.js" />
/// <reference path="..\..\jQuery\ui\jquery.ui.widget.js" />
/// <reference path="..\..\jQuery\ui\jquery.ui.mouse.js" />
/// <reference path="..\..\jQuery\ui\jquery.ui.draggable.js" />
/// <reference path="..\..\jQuery\ui\jquery.ui.droppable.js" />

$.jaMonthView = function(options, date, calEvents, props)
{
    props = $.extend(true, props || {}, { css: { height: '100%', position: 'relative'} });
    return $.UI.Hybrid.apply(this, [$.jaMonthView, 'div', props, arguments]);
}
$.jaMonthView.prototype =
{
    objConstructor: function(options, date, calEvents)
    {
        this.options = options;
        this._headerRowId = 'idTr-month-head';
        this._footerRowId = 'idTr-month-foot';
        this._bodyId = 'idDiv-month-body';
        this._cellIdPrefix = 'idTd-month-day-';

        this.setCalEvents(calEvents);
        this.setStartDate(date);
        return false;
    },
    getHeaderRow: function() { return $(this).find('#' + this._headerRowId) },
    getFooterRow: function() { return $(this).find('#' + this._footerRowId) },
    getBody: function() { return $(this).find('#' + this._bodyId) },
    setStartDate: function(date)
    {
        this.dateStart = new DateObj(date).setDate(1);
        this.dateEnd = this.dateStart.clone().addMonths(1);
        while (this.dateEnd.getMonth() != this.dateStart.getMonth())
            this.dateEnd.subtract(TimeSpan.fromDays(1));
        this.uiStart = this.dateStart.clone()
            .moveToDay($.Day.Sunday, false, true);  // TODO: Allow for weekdays-only + Different week starting day
        this.uiEnd = this.dateEnd.clone()
            .moveToDay($.Day.Saturday, true);    // TODO: Allow for weekdays-only + Different week starting day
        this._cols = 7;
        // TODO: Allow for different month views (Fixed vs. Auto vs. Smart)
        this._rows = 6;
        var iWeekDiff = this._rows - (this.uiEnd.diff(this.uiStart).divideBy(TimeSpan.fromWeeks(1)) + (this.uiStart.getDay() != this.uiEnd.getDay() ? 1 : 0));
        if (iWeekDiff > 0)
            this.uiEnd.add(TimeSpan.fromWeeks(iWeekDiff));

        return this.refresh();
    },
    setCalEvents: function(calEvents)
    {
        this.calEvents = $.arrOrEmpty(calEvents);
        return this;
    },
    addCalEvents: function(calEvents)
    {
        this.calEvents = $.arrOrEmpty(this.calEvents).concat(calEvents);
        return this;
    },
    refresh: function()
    {
        var $this = $(this);
        // Create Header if it doesn't exist
        var $headRow = this.getHeaderRow();
        if (!$exists($headRow))
        {
            $headRow = $('<tr>', { id: this._headerRowId })
                .appendTo($('<tbody>')
                    .appendTo($('<table>', { cellPadding: 0, cellSpacing: 0, class: 'cal-head', css: { 'table-layout': 'fixed', width: '100%'} })
                        .appendTo($this)));
            var oHeadDate = this.uiStart.clone();
            for (var iCol = 0; iCol < this._cols; iCol++)
            {
                $headRow.append($('<th>', { title: oHeadDate.format('dddd') }).html(oHeadDate.format('dddd')));
                oHeadDate.add(TimeSpan.fromDays(1));
            }
        }

        // Create Body if it doesn't exist
        var $body = this.getBody();
        if (!$exists($body))
        {
            $body = $('<div>', { id: this._bodyId, class: 'cal-body', css: { overflow: 'hidden', position: 'absolute', top: '20px', bottom: '20px', left: '0', width: '100%'} })
                .appendTo($this);
        }

        // Create Footer if it doesn't exist
        var $footRow = this.getFooterRow();
        if (!$exists($footRow))
        {
            $footRow = $('<tr>', { id: this._footerRowId })
                .appendTo($('<tbody>')
                    .appendTo($('<table>', { cellPadding: 0, cellSpacing: 0, class: 'cal-foot', css: { 'table-layout': 'fixed', width: '100%', position: 'absolute', bottom: '0px'} })
                        .appendTo($this)));
            var oFootDate = this.uiStart.clone();
            for (var iCol = 0; iCol < this._cols; iCol++)
            {
                $footRow.append($('<th>', { title: oFootDate.format('dddd') })
                    .html(oFootDate.format('dddd')));
                oFootDate.add(TimeSpan.fromDays(1));
            }
        }

        // Build event segments
        var segs = [];
        for (var i = 0; i < this._rows; i++)
            segs.push([]);
        for (var i = 0; i < this.calEvents.length; i++)
        {
            var calEvent = $.Cal._evcache[this.calEvents[i]];
            if (exists(calEvent))
            {
                var evtSegs = calEvent.createSegments(this.uiStart, this.uiEnd, TimeSpan.fromWeeks(1), TimeSpan.fromDays(1));
                for (var iRow = 0; iRow < evtSegs.length && iRow < this._rows; iRow++)
                {
                    if (exists(evtSegs[iRow]))
                        segs[iRow].push(evtSegs[iRow]);
                }
            }
        }

        // Update body rows
        $body.empty();
        var nextPos = 0,
            percent = (100 / this._rows),
            oDate = this.uiStart.clone(),
            oWeekEnd = oDate.plus(TimeSpan.fromDays(this._cols - 1)),
            oneWeek = TimeSpan.fromWeeks(1),
            monthView = this;
        for (var iRow = 0; iRow < this._rows; iRow++)
        {
            var rowProps = { css: { top: nextPos + '%', position: 'absolute', left: '0', width: '100%', overflow: 'hidden'} };
            if (iRow != (this._rows - 1))
                rowProps.css.height = (percent + 1) + '%';
            else
                rowProps.css.bottom = '0';
            var $row = $('<div>', rowProps)
                .appendTo($body)
            // Day Placeholders
            var $dayRow = $('<tr>')
                .appendTo($('<tbody>')
                    .appendTo($('<table>', { cellPadding: 0, cellSpacing: 0, class: 'days', css: { position: 'absolute', top: '0', left: '0', height: '100%', width: '100%', 'table-layout': 'fixed'} })
                        .appendTo($row)));
            for (var iCol = 0; iCol < monthView._cols; iCol++)
            {
                var cellId = (iRow * monthView._cols) + iCol;
                var cellDate = this.uiStart.plus(new TimeSpan(0, 0, 0, 0, iCol, iRow));
                var props = { id: monthView._cellIdPrefix + cellId, class: (cellDate.getMonth() === monthView.dateStart.getMonth() ? 'in-month' : 'out-month') };
                $(new $.jaMonthDay(monthView.options, cellDate, iCol, iRow, cellId, props))
                    .appendTo($dayRow)
                    .$bind($.jaMonthDay.On.Hover, monthView.evt_monthday_onhover, monthView)
                    .$bind($.jaMonthDay.On.Leave, monthView.evt_monthday_onleave, monthView)
                    .$bind($.jaMonthDay.On.Choose, monthView.evt_monthday_onchoose, monthView)
                    .$bind($.jaMonthDay.On.SelectStart, monthView.evt_monthday_onselectstart, monthView)
                    .$bind($.jaMonthDay.On.DragOver, monthView.evt_monthday_ondragover, monthView)
                    .$bind($.jaMonthDay.On.Drop, monthView.evt_monthday_ondrop, monthView);
            }
            // Event Placeholder
            $(new $.jaMonthWeek(this.options, oDate, oWeekEnd, segs[iRow], { class: 'month-appt' }))
                .appendTo($row);

            nextPos += percent;
            oDate.add(oneWeek);
            oWeekEnd.add(oneWeek);
        }

        return this;
    },
    evt_monthday_onhover: function(oEvt)
    {

    },
    evt_monthday_onleave: function(oEvt)
    {

    },
    evt_monthday_onchoose: function(oEvt)
    {

    },
    evt_monthday_onselectstart: function(oEvt)
    {

    },
    evt_monthday_ondragover: function(oEvt)
    {

    },
    evt_monthday_ondrop: function(oEvt)
    {

    }
}
$.jaMonthView.derivesFrom($.UI.Hybrid);

$.jaMonthWeek = function(options, start, end, segs, props)
{
    props = $.extend(true, props || {}, { cellPadding: 0, cellSpacing: 0, css: { position: 'relative', 'table-layout': 'fixed', width: '100%' } });
    return $.UI.Hybrid.apply(this, [$.jaMonthWeek, 'table', props, arguments]);
}
$.jaMonthWeek.prototype =
{
    objConstructor: function(options, start, end, segs)
    {
        this.options = options;
        this.dateStart = start.clone();
        this.dateEnd = end.clone();

        this.refresh(segs);
        return false;
    },
    refresh: function(segs)
    {
        var $tbody = $('<tbody>').appendTo($(this).empty());
        var $headRow = $('<tr>').appendTo($tbody);
        var oHeadDate = this.dateStart.clone();
        var iCols = 0;
        while (oHeadDate <= this.dateEnd)
        {
            $headRow.append($('<td>', { class: 'day-head' })
                .append($('<span>').html(oHeadDate.getDate() + '')));
            oHeadDate.add(TimeSpan.fromDays(1));
            iCols++;
        }
        segs = $.arrOrEmpty(segs);
        if (segs.length > 0)
        {
            var grid = [];
            segs.sort($.jaEventSegment.dateOrderComparer);
            for (var i = 0; i < segs.length; i++)
            {
                var seg = segs[i];
                for (var iLevel = 0; ; iLevel++)
                {
                    // Nothing at this level, create level, add segment, and break loop
                    if (grid.length <= iLevel)
                    {
                        var arrLevel = [];
                        seg.level = iLevel;
                        arrLevel[seg.slot] = seg;
                        for (var k = 1; k < seg.span; k++)
                            arrLevel[seg.slot + k] = seg.span - k;
                        grid.push(arrLevel);
                        break;
                    }
                    else
                    {
                        var overlaps = false,
                            arrLevel = grid[iLevel];
                        for (var k = 0, iSlot = seg.slot; k < seg.span; k++)
                        {
                            if (exists(arrLevel[seg.slot + k]))
                            {
                                overlaps = true;
                                break;
                            }
                        }
                        // No overlap, add segment into this level
                        if (!overlaps)
                        {
                            seg.level = iLevel;
                            arrLevel[seg.slot] = seg;
                            for (var k = 1; k < seg.span; k++)
                                arrLevel[seg.slot + k] = seg.span - k;
                            break;
                        }
                    }
                }
            }
            var iRows = grid.length;
            for (var iRow = 0; iRow < iRows; iRow++)
            {
                var arrSlots = grid[iRow];
                var $row = $('<tr>').appendTo($tbody);
                for (var iSlot = 0; iSlot < arrSlots.length; iSlot++)
                {
                    if (!exists(arrSlots[iSlot]))
                    {
                        var rowSpan = 1;
                        for (var i = iRow + 1; i < iRows; i++)
                        {
                            if (!exists(grid[i][iSlot]))
                            {
                                rowSpan++;
                                grid[i][iSlot] = 0;
                            }
                            else
                                break;
                        }
                        var tdProps = { css: { 'vertical-align': 'top', 'padding-bottom': '2px', cursor: 'default', 'line-height': '10px'} };
                        if (rowSpan > 1)
                            tdProps.rowSpan = rowSpan;
                        $row.append($('<td>', tdProps).html('&nbsp;'));
                    }
                    else if ($.isNumeric(arrSlots[iSlot]))
                    {
                        continue;
                    }
                    else
                    {
                        var seg = arrSlots[iSlot];
                        var evt = seg.getCalEvent();
                        var tdProps = { class: 'seg' };
                        if (seg.span > 1)
                            tdProps.colSpan = seg.span;
                        $('<td>', tdProps).appendTo($row)
                            .append($('<div>', { id: seg.id, class: 'seg' })
                                .data('seg', seg)
                                .append($('<div>', { class: 'segHolder' })
                                    .append($('<div>', { class: 'segText' })
                                        .html(evt.title))));
                    }
                }
            }
        }
    }
}
$.jaMonthWeek.derivesFrom($.UI.Hybrid);

$.jaMonthDay = function(options, date, col, row, cell, props)
{
    return $.UI.Hybrid.apply(this, [$.jaMonthDay, 'td', props || {}, arguments]);
}
$.jaMonthDay.prototype =
{
    objConstructor: function(options, date, col, row, cellId)
    {
        this.options = options;
        this.date = date;
        this.col = col;
        this.row = row;
        this.cell = cellId;

        var $this = $(this).html('&nbsp;')
            .droppable('option', { scope: 'appt', tolerance: 'pointer' })
            .$bind($.On.MouseEnter, this.evt_cell_onmouseenter, this)
            .$bind($.On.MouseLeave, this.evt_cell_onmouseleave, this)
            .$bind($.On.DragOverUI, this.evt_cell_ondragover, this)
            .$bind($.On.DropUI, this.evt_cell_ondrop, this);
        if (this.options.selectable === false)
            $this.$bind($.On.Click, this.evt_cell_onclick, this);
        else
            $this.$bind($.On.MouseDown, this.evt_cell_onmousedown, this);
    },
    evt_cell_onmouseenter: function(oEvt)
    {
        $(this).customEvent($.jaMonthDay.On.Hover, oEvt).trigger();
    },
    evt_cell_onmouseleave: function(oEvt)
    {
        $(this).customEvent($.jaMonthDay.On.Leave, oEvt).trigger();
    },
    evt_cell_onclick: function(oEvt)
    {
        $(this).customEvent($.jaMonthDay.On.Choose, oEvt).trigger();
    },
    evt_cell_onmousedown: function(oEvt)
    {
        if (oEvt.which == 1)
            $(this).customEvent($.jaMonthDay.On.SelectStart, oEvt).trigger();
    },
    evt_cell_ondragover: function(oEvt, oUI)
    {
        $(this).customEvent($.jaMonthDay.On.DragOver, oEvt, { ui: oUI }).trigger();
    },
    evt_cell_ondrop: function(oEvt, oUI)
    {
        $(this).customEvent($.jaMonthDay.On.Drop, oEvt, { ui: oUI }).trigger();
    }
}
$.jaMonthDay.derivesFrom($.UI.Hybrid);

$.jaMonthDay.On =
{
    Hover: 'jCal_hover',
    Leave: 'jCal_leave',
    Choose: 'jCal_choose',
    SelectStart: 'jCal_selectstart',
    DragOver: 'jCal_drag',
    Drop: 'jCal_drop'
}