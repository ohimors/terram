/// <reference path="..\ja_core.js" />
/// <reference path="..\ja_events.js" />
/// <reference path="ja_input.js" />

(function($)
{
    $.FIELD =
    {
        On:
        {
            Focus: 'fieldfocus',
            Blur: 'fieldblur',
            Change: 'fieldchange',
            ValueChange: 'fieldvaluechange'
        }
    }

    $.FIELD.Base = function(iFieldIndex)
    {
        this.index = iFieldIndex;
        this.m_aInput = [];
        this.m_aMsg = [];
        this.m_fEnabled = true;
    }
    $.FIELD.Base.prototype =
    {
        // abstract methods - these methods must be overriden
        tryValidate: function() { return this },

        // virtual methods - these methods will likely be overriden
        // depending on the Field type
        getFullValue: function() { return this.getValue() },
        setFullValue: function(oVal) { return this.setValue(oVal) },
        setFocus: function(fSelect)
        {
            if (this.inputExists(0))
                this.m_aInput[0].setFocus(fSelect);
            return this;
        },
        isFocusAllowed: function() { return true },
        isEnabled: function() { return this.m_fEnabled },

        // common methods - these methods shouldn't be overriden
        enable: function()
        {
            this.m_fEnabled = true;
            return this;
        },
        disable: function()
        {
            this.m_fEnabled = false;
            return this;
        },
        inputExists: function(eElement) { return $.arrExists(this.m_aInput, eElement) },
        messageExists: function(eType) { return $.arrExists(this.m_aMsg, eType) },
        getName: function(eElement)
        {
            eElement = $.valOrDef(eElement, 0);
            if (this.inputExists(eElement))
                return this.m_aInput[eElement].getName();
            return null;
        },
        getValue: function(eElement)
        {
            eElement = $.valOrDef(eElement, 0);
            if (this.inputExists(eElement))
                return this.m_aInput[eElement].getValue();
            return null;
        },
        setValue: function(oVal, eElement)
        {
            eElement = $.valOrDef(eElement, 0);
            if (this.inputExists(eElement))
                this.m_aInput[eElement].setValue(oVal);
            return this;
        },
        clearValue: function(eElement)
        {
            eElement = $.valOrDef(eElement, 0);
            if (this.inputExists(eElement))
                this.m_aInput[eElement].clearValue();
            return this;
        },
        getValues: function()
        {
            var arrVals = [];
            for (var i = 0; i < this.m_aInput.length; i++)
                arrVals[i] = this.m_aInput[i].getValue();
            return arrVals;
        },
        setValues: function()
        {
            for (var arg, i = 0; exists(arg = arguments[i]) && this.inputExists(i); i++)
                this.m_aInput[i].setValue(arg);
            return this;
        },
        setMessage: function(eType, oData)
        {
            if (this.messageExists(eType))
                this.m_aMsg[eType].set(oData);
            return this;
        },
        clearMessage: function(eType)
        {
            if (this.messageExists(eType))
                this.m_aMsg[eType].clear();
            return this;
        },
        hideMessage: function(eType)
        {
            if (this.messageExists(eType))
                this.m_aMsg[eType].hide();
            return this;
        },
        showMessage: function(eType)
        {
            if (this.messageExists(eType))
                this.m_aMsg[eType].show();
            return this;
        },
        hasMessage: function(eType)
        {
            return (this.messageExists(eType) && this.m_aMsg[eType].hasData());
        },
        tryValidateValue: function()
        {
            return this.tryValidate.apply(this, this.getValues());
        },
        attachEvents: function()
        {
            var self = this;
            $.each(this.m_aInput,
            function(idx, oInput)
            {
                oInput.attachEvents([{ name: $.On.Focus, handler: self.evt_input_onfocus, context: self },
                                     { name: $.On.Blur, handler: self.evt_input_onblur, context: self },
                                     { name: $.On.Change, handler: self.evt_input_onchange, context: self },
                                     { name: $.On.Input, handler: self.evt_input_oninput, context: self}]);
            });
            return this;
        },

        // Events
        evt_input_onfocus: function(oEvt) 
        { 
            $(this).customEvent($.FIELD.On.Focus, oEvt).trigger() 
        },
        evt_input_onblur: function(oEvt) 
        { 
            $(this).customEvent($.FIELD.On.Blur, oEvt).trigger() 
        },
        evt_input_onchange: function(oEvt) 
        { 
            $(this).customEvent($.FIELD.On.Change, oEvt).trigger() 
        },
        evt_input_oninput: function(oEvt) 
        { 
            $(this).customEvent($.FIELD.On.ValueChange, oEvt).trigger() 
        }
    }
})(jQuery);