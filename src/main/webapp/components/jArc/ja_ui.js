/// <reference path="ja_core.js" />

(function($)
{
    $.UI =
    {
        createAsObject: function(sTag, oProps)
        {
            var el = $('<' + sTag + '/>', oProps).un$();
            var base = new Object();
            $.each(base,
                function(sFnName, oFn)
                {
                    if ($.isFunction(oFn))
                        el[sFnName] = oFn;
                }
            );
            return el;
        },
        Hybrid: function(fnConstructor, sTag, oProps, arrArgs)
        {
            function objProto() { }
            objProto.prototype = fnConstructor.prototype;
            var protoObj = new objProto();
            var base = $.UI.createAsObject(sTag, oProps || {});

            var iter = $.Iterator(protoObj, {});
            for (var i = 0; i < iter.length; i++)
            {
                if (!exists(base[iter[i]]))
                    base[iter[i]] = protoObj[iter[i]];
            }
            base[$._jaexpando] = 'hybrid';

            if (base.objConstructor.apply(base, arrArgs) !== false)
                base.refresh.apply(base, []);

            return base;
        }
    }

    $.UI.Hybrid.prototype =
    {
        objConstructor: function() { },
        refresh: function() { },
        inDocument: function() { return $.contains(document.documentElement, this) || ($.isStrVal(this.id) && $exists($('#' + this.id))) }
    }
})(jQuery);