/// <reference path="..\ja_core.js" />
/// <reference path="..\ja_events.js" />

(function($)
{
    $.jaLayerMenu = function(arrData, arrPaneIds, oQueueIds, iHoverChooseDelay, iHoverCloseDelay, arrPreLoaded)
    {
        this.panes = [];
        this.data = [];
        $(this.queue = new $.LayerMenu.Queue(oQueueIds))
        .$bind($.On.Submit, this.evt_queue_onsubmit, this);

        // Build + connect pane objects
        for (var i = 0; i < arrPaneIds.length; i++)
        {
            var fRoot = (i == 0);
            var oPane = new $.LayerMenu.Pane(arrPaneIds[i], iHoverCloseDelay, fRoot);
            if (!fRoot)
                this.panes[i - 1].attachChild(oPane);
            this.panes.push(oPane);
        }

        var toQueue = [];
        // Add categories
        for (var i = 0; i < arrData.length; i++)
        {
            var oOption = $(new $.LayerMenu.Option(arrData[i], iHoverCloseDelay))
            .$bind($.LayerMenu.Option.On.Choose, this.evt_option_onchoose, this)
            .$bind($.LayerMenu.Option.On.Remove, this.evt_option_onremove, this)
            .un$();
            this.panes[0].addOption(oOption);
            if ($.isArray(arrPreLoaded) && arrPreLoaded.length > 0)
            {
                $.each(arrPreLoaded,
                function(idx, str)
                {
                    if ($.isStrVal(str) && str.equals(oOption.id, true))
                    {
                        toQueue.push(oOption);
                        return false;
                    }
                }
            );
            }
        }
        this.panes[0].populate().open();

        setTimeout(
        function()
        {
            // Choose Pre-Queued options
            $.each(toQueue,
                function(idx, option) { $(option).$trigger($.LayerMenu.Option.On.Choose) }
            );

        }, 500);
    }
    $.jaLayerMenu.prototype =
    {
        transferToQueue: function(oOption)
        {
            this.queue.addToQueue(oOption);
            this.panes[0].refreshPane(oOption.id);
        },
        evt_option_onremove: function(oEvt)
        {
            // Handle removing from queue
            this.queue.removeFromQueue(oEvt.target.id);
        },
        evt_option_onchoose: function(oEvt)
        {
            var $el = oEvt.target.getElement();
            if (!$exists($el))
                $el = this.panes[0].getElement();
            oEvt.target.doTransfer(this.queue.getTransferToId(), $el, $.proxy(this.transferToQueue, this));
        },
        evt_queue_onsubmit: function(oEvt)
        {
            $(this).customEvent($.On.Submit, oEvt, { selection: oEvt.target.getSelection() }).trigger();
        }
    }

    $.LayerMenu = {}
    $.LayerMenu.Queue = function(oElementIds)
    {
        this.ids = oElementIds;
        this.options = [];

        this.getElement('closedTab').$bind($.On.Click, this.evt_closedTab_onclick, this);
        this.getElement('openedTab').$bind($.On.Click, this.evt_openedTab_onclick, this);
        this.getElement('saveButton').$bind($.On.Click, this.evt_save_onclick, this);
    }
    $.LayerMenu.Queue.prototype =
    {
        getElement: function(sId) { return $(this.ids[sId]) },
        addToQueue: function(oOption)
        {
            oOption.isQueued = true;
            this.options.push(oOption);
            return this.updateDisplay();
        },
        removeFromQueue: function(sId)
        {
            var arrList = [];
            var oTarget = null;
            $.each(this.options,
                function(idx, opt)
                {
                    if (!opt.id.equals(sId, true))
                        arrList.push(opt);
                    else
                        oTarget = opt;
                }
            );
            this.options = arrList;
            this.updateDisplay();
            if (exists(oTarget))
                oTarget.isQueued = false;
            return this;
        },
        populate: function()
        {
            var $el = this.getElement('list').empty();
            $.each(this.options,
                function(idx, opt) { opt.drawQueueRow($el) }
            );
            return this;
        },
        updateDisplay: function()
        {
            if (this.options.length == 0)
            {
                this.getElement('emptyList').show();
                this.getElement('listHolder').hide();
            }
            else
            {
                this.populate()
                    .getElement('emptyList').hide();
                this.getElement('listHolder').show();
            }
            return this;
        },
        getTransferToId: function()
        {
            if (this.isOpen)
            {
                if (this.options.length > 0)
                    return this.ids.list;
                else
                    return this.ids.openedTab;
            }
            else
                return this.ids.closedTab;
        },
        getSelection: function()
        {
            var toRet = [];
            $.each(this.options,
                function(idx, option) { toRet.push(option.id) }
            );
            return toRet;
        },
        toString: function() { return this.getSelection().join() },
        evt_closedTab_onclick: function(oEvt)
        {
            var self = this;
            this.getElement('closedHolder')
                .hide('slide', { direction: 'right' }, 100,
                    function() { self.getElement('openedHolder').show('slide', { direction: 'right' }, 300) }
                );
            this.isOpen = true;
        },
        evt_openedTab_onclick: function(oEvt)
        {
            var self = this;
            this.getElement('openedHolder')
                .hide('slide', { direction: 'right' }, 500,
                    function() { self.getElement('closedHolder').show('slide', { direction: 'right' }, 100) }
                );
            this.isOpen = false;
        },
        evt_save_onclick: function(oEvt)
        {
            $(this).customEvent($.On.Submit, oEvt, { selection: this.getSelection() }).trigger();
        }
    }

    $.LayerMenu.Pane = function(sElementId, iHoverCloseDelay, isRoot)
    {
        this.elementId = sElementId;
        this.hoverDelay = $.valOrDef(iHoverCloseDelay, 0);
        this.isRoot = (isRoot == true);
        this.isOpen = false;
        this.isLocked = false;
        this.isFocused = false;
        this.child = null;
        this.options = [];
        this.closeTimeout = null;

        $(this.elementId).$bind($.On.MouseEnter, this.evt_element_onmouseover, this)
        .$bind($.On.MouseLeave, this.evt_element_onmouseout, this);
    }
    $.LayerMenu.Pane.prototype =
    {
        // abstract methods for custom drawing
        ui_showElement: function($el) { $el.show('slide', {}, 500); return this },
        ui_hideElement: function($el) { $el.hide(); return this },
        ui_lockElement: function($el) { $el.addClass('locked'); return this },
        ui_unlockElement: function($el) { $el.removeClass('locked'); return this },

        // built-in functionality
        getElement: function() { return $(this.elementId) },
        addOption: function(oOption, oPrevParent)
        {
            for (var i = 0; i < this.options.length; i++)
            {
                var oNext = this.options[i];
                if (oOption.id.startsWith(oNext.id, true))
                {
                    this.child.addOption(oOption, oNext);
                    return;
                }
            }
            if (exists(oPrevParent))
                oPrevParent.addChild(oOption);
            this.options.push($(oOption)
                .$bind($.LayerMenu.Option.On.Activated, this.evt_option_onactivated, this)
                .un$()
            );
            return this;
        },
        refreshPane: function(sId)
        {
            for (var i = 0; i < this.options.length; i++)
            {
                var oOption = this.options[i];
                if (sId.startsWith(oOption.id, true))
                {
                    if (oOption.id.equals(sId, true))
                        this.close();
                    else
                        this.child.refreshPane(sId);
                    break;
                }
            }
            return this;
        },
        populate: function(oParentOption)
        {
            var $el = this.getElement().empty();
            var pane = this;
            this.closeChild();
            $.each(this.closeChild().options,
                function(idx, option)
                {
                    if (!option.isQueued &&
                        (pane.isRoot ||
                         (exists(oParentOption) && option.id.startsWith(oParentOption.id, true))))
                        option.drawPanelRow($el);
                }
            );
            return this;
        },
        attachChild: function(oPane)
        {
            $(this.child = oPane).$bind($.LayerMenu.Pane.On.Show, this.evt_child_onshow, this)
                .$bind($.LayerMenu.Pane.On.Hide, this.evt_child_onhide, this);
        },
        show: function(oEvt)
        {
            this.ui_showElement(this.getElement()).isOpen = true;
        },
        open: function()
        {
            if (!this.isOpen && !this.isLocked)
                $(this).customEvent($.LayerMenu.Pane.On.Show).trigger();
        },
        openChild: function(oOption)
        {
            if (exists(this.child))
                this.child.populate(oOption)
                    .open();
            return this;
        },
        hide: function(oEvt)
        {
            this.ui_hideElement(this.getElement()).isOpen = false;
        },
        close: function()
        {
            if (this.isOpen)
            {
                if (!this.isLocked)
                {
                    if (exists(this.closeTimeout))
                        clearTimeout(this.closeTimeout);
                    if (!this.isRoot)
                        $(this).customEvent($.LayerMenu.Pane.On.Hide).trigger();
                }
                else
                {
                    if (exists(this.child) && !this.child.isFocused)
                        this.closeChild();
                }
            }
            return this;
        },
        closeChild: function(oEvt)
        {
            if (exists(this.child))
            {
                this.child.closeChild(oEvt)
                          .close(oEvt);
            }
            return this;
        },
        deactivateOptions: function(sException)
        {
            $.each(this.options,
                function(idx, option)
                {
                    if (!option.id.equals(sException))
                        option.deactivate();
                }
            );
            return this;
        },
        lock: function()
        {
            this.ui_lockElement(this.getElement())
                .isLocked = true;
        },
        unlock: function()
        {
            this.ui_unlockElement(this.getElement())
                .deactivateOptions()
                .isLocked = false;
            return this;
        },
        evt_element_onmouseout: function(oEvt)
        {
            this.isFocused = false;
            if (this.hoverDelay > 0)
            {
                var self = this;
                this.closeTimeout = setTimeout(function() { self.close() }, this.hoverDelay);
            }
        },
        evt_element_onmouseover: function(oEvt)
        {
            this.isFocused = true;
            if (exists(this.closeTimeout))
                clearTimeout(this.closeTimeout);
        },
        evt_option_onactivated: function(oEvt)
        {
            this.deactivateOptions(oEvt.target.id)
                .closeChild();
            if (oEvt.target.children.length > 0)
                this.openChild(oEvt.target);
        },
        evt_child_onshow: function(oEvt)
        {
            this.lock()
        },
        evt_child_onhide: function(oEvt)
        {
            this.unlock()
        }
    }
    $.LayerMenu.Pane.On = { Show: 'show', Hide: 'hide' }

    $.LayerMenu.Option = function(oRawData, iHoverChooseDelay)
    {
        this.id = oRawData.id;
        this.name = oRawData.name;
        this.elementId = oRawData.id + '_listItem';
        this.count = $.valOrDef(oRawData.count, 0);
        this.hoverDelay = $.valOrDef(iHoverChooseDelay, 0);

        this.activateTimeout = this.isActive = this.isQueued = null;
        this.children = [];
    }
    $.LayerMenu.Option.prototype =
    {
        // abstract methods for custom drawing
        ui_activateElement: function($el)
        {
            $el.addClass('activated');
            return this
        },
        ui_deactivateElement: function($el)
        {
            $el.removeClass('activated');
            return this
        },
        ui_appendToQueue: function($queue, sElementId)
        {
            return $('<li/>', { class: 'queueItem' })
                .append($('<a/>', { id: sElementId, href: '#', class: 'queueItem' })
                    .append($('<span/>', { class: 'ui-icon ui-icon-minus pull-left' }))
                    .append($('<span/>', { css: { display: 'block', float: 'left', marginLeft: '5px'} })
                        .html(this.name))
                    .append($('<span/>', { class: 'label label-warning queueCount' })
                        .html('(' + this.count + ')')))
                .appendTo($queue);
        },
        ui_appendToPane: function($pane, sElementId)
        {
            var $li = $('<li/>').appendTo($pane);
            var $link = $('<a/>', { id: sElementId, href: '#' })
                .appendTo($li)
                .append($('<span/>')
                    .html(this.name + ((this.count > 0) ? ('  (' + this.count + ')') : '')));

            if (this.children.length > 0)
                $link.append($('<span />', { class: 'ui-icon ui-icon-arrow-1-e pull-right' }));
            else if (this.count > 0)
                $link.append($('<span />', { class: 'ui-icon ui-icon-plus pull-right' }));

            return $li;
        },
        ui_transferElement: function($el, sTargetId, fnCallback)
        {
            $el.effect('transfer', { to: sTargetId, className: 'ui-effects-transfer' }, 800, fnCallback);
            return this;
        },

        // built-in functionality
        getElement: function() { return $('#' + this.elementId) },
        addChild: function(oOption)
        {
            this.children.push(oOption);
            return this;
        },
        deactivate: function()
        {
            if (this.isActive && this.children.length > 0)
                $(this).customEvent($.LayerMenu.Option.On.Deactivated).trigger();
        },
        deactivated: function(oEvt)
        {
            this.ui_deactivateElement(this.getElement()).isActive = false;
        },
        activate: function()
        {
            if (!this.isActive)
            {
                if (exists(this.activateTimeout))
                    clearTimeout(this.activateTimeout);
                $(this).customEvent($.LayerMenu.Option.On.Activated).trigger();
            }
        },
        activated: function(oEvt)
        {
            if (this.children.length > 0)
                this.ui_activateElement(this.getElement());
            this.isActive = true;
        },
        doTransfer: function(sTargetId, sFromEl, callback)
        {
            var self = this;
            this.ui_transferElement(sFromEl, sTargetId, function() { callback(self) });
        },
        drawQueueRow: function($list)
        {
            this.ui_appendToQueue($list, this.elementId)
                .$bind($.On.Click, this.evt_remove_onclick, this);
        },
        drawPanelRow: function($pane)
        {
            var $el = this.ui_appendToPane($pane, this.elementId)
                .$bind($.On.MouseEnter, this.evt_element_onmouseover)
                .$bind($.On.MouseLeave, this.evt_element_onmouseout)
                .$bind($.On.Click, this.evt_option_onclick, this);
            // If there's a mouseover delay, then allow mouseover to trigger activate
            if (this.hoverDelay > 0)
            {
                $el.$bind($.On.MouseEnter, this.evt_option_onmouseover, this)
                    .$bind($.On.MouseLeave, this.evt_option_onmouseout, this);
            }
        },
        evt_element_onmouseout: function(oEvt) { $(this).removeClass('active') },
        evt_element_onmouseover: function(oEvt) { $(this).addClass('active') },
        evt_remove_onclick: function(oEvt)
        {
            $(this).customEvent($.LayerMenu.Option.On.Remove, oEvt).trigger();
        },
        evt_option_onclick: function(oEvt)
        {
            if (this.count == 0 || this.children.count > 0)
                this.activate(oEvt);
            else if (this.count > 0)
                $(this).customEvent($.LayerMenu.Option.On.Choose, oEvt).trigger();
        },
        evt_option_onmouseover: function(oEvt)
        {
            this.activateTimeout = setTimeout($.proxy(this.activate, this), this.hoverDelay);
        },
        evt_option_onmouseout: function(oEvt)
        {
            if (exists(this.activateTimeout))
                clearTimeout(this.activateTimeout);
        }
    }

    $.LayerMenu.Option.On =
    {
        Activated: 'activated',
        Deactivated: 'deactivated',
        Choose: 'choose',
        Remove: 'remove'
    }
})(jQuery);