/// <reference path="..\..\..\scripts\lib\arbor.js" />
/// <reference path="..\ja_core.js" />
/// <reference path="..\ja_events.js" />

Math.connectPoints = function(pt1, pt2)
{
    // Initialize dimensions assuming pts are on the same y-axis
    var dim = { length: Math.abs(pt1.x - pt2.x),
        angle: 0,
        top: pt1.y,
        left: ((pt1.x < pt2.x) ? pt1.x : pt2.x)
    };

    if (pt1.y != pt2.y)
    {
        // Line always goes from left to right, so start with left element
        var startLeft, startTop, endLeft, endTop;
        if (pt1.x < pt2.x)
        {
            startLeft = pt1.x;
            startTop = pt1.y;
            endLeft = pt2.x;
            endTop = pt2.y;
        }
        else
        {
            startLeft = pt2.x;
            startTop = pt2.y;
            endLeft = pt1.x;
            endTop = pt1.y;
        }

        // Find the hypotenuse (aka the length of the line)
        var opp = Math.abs(startTop - endTop);
        dim.length = Math.sqrt(Math.pow(opp, 2) + Math.pow((endLeft - startLeft), 2));

        // When graphing a line that is slanting down from left-to-right, it would normally
        // be known that it's y-axis is decreasing, and it has a negative angle in respect
        // to the x-axis.
        // In regards to HTML and CSS however, there are 2 concepts that change this:
        // 1) CSS rotates clockwise (while radians are counter-clockwise).
        //  - Thus, negative graphing angles are positive in CSS and vice versa
        // 2) HTML and CSS measure positions in respect to the 'top' and 'left, instead of x/y axis.
        //  - Thus, lines going down from left to right are actually increasing in respect to the
        //    'top' axis
        var angleRadians = Math.asin(opp / dim.length); /* sin(theta) = ( opposite / hypotenuse ) */
        dim.angle = ((angleRadians) / (2 * Math.PI)) * 360;  /* degrees = ( 360 * radians ) / ( 2 * pi ) */

        // * A line slanting up from left-to-right is decreasing in 'top' axis and has a negative angle
        if (endTop < startTop)
        {
            angleRadians = (0 - angleRadians);
            dim.angle = (0 - dim.angle);
        }

        // Since CSS will position the line based on it's left end first, and then rotate it from the middle
        // of the line, we must account for the rotation amount to determine where the line
        // should be positioned before it's rotated. Do this by using these formulas for calculating
        // points on a circle based on the radius and the angle
        // x = r * cos(angle)
        // y = r * sin(angle)

        // If we're doing a negative rotation, the circle angle is (pi - value)
        // If we're doing a positive rotation, the circle angle is (pi + value)
        var circleRadians = (Math.PI + angleRadians);

        // Assuming this line is the diameter of a circle, the radius is half
        var radius = (dim.length / 2);

        // Calculate change in x & y axis
        var xDiff = radius - Math.abs(radius * Math.cos(circleRadians)); /* x1 - x2 = r * cos(90) - r * cos (angle) */
        var yDiff = Math.abs(radius * Math.sin(circleRadians)); /* y1 - y2 = r * sin(90) - r * sin (angle)  */

        // x coordinate will always decrease in this rotation (therefore: 'left' will increase)
        // so the starting x coordinate (before rotation) should be:
        // x coordinate + change in x (therefore: 'left' - change in x)
        dim.left = startLeft - xDiff;

        // y coordinate will decrease in a negative rotation (therefore: 'top' will increase)
        // y coordinate will increase in a positive rotation (therefore: 'top' will decrease)
        // so do the opposite
        dim.top = (dim.angle < 0) ? (startTop - yDiff) : (startTop + yDiff);
    }
    return dim;
}

$.jaGraph = function(oEngine, sDivId, iWidth, iHeight, iPadding)
{
    this.engine = oEngine;
    this.canvasId = sDivId;
    this.width = iWidth;
    this.height = iHeight;
    this.padding = iPadding;
    this.dragging = null;

    this.engine.renderer = this;
}
$.jaGraph.prototype =
{
    init: function(system)
    {
        this.engine = system;
        this.engine.screenSize(this.width, this.height);
        if (this.padding)
            this.engine.screenPadding(this.padding);
        $(this).customEvent($.On.Load).trigger();
    },
    redraw: function()
    {
        this.engine.eachEdge($.proxy(this.drawEdge, this));
        this.engine.eachNode($.proxy(this.drawNode, this));
    },
    drawEdge: function(edge, pt1, pt2)
    {
        /// <summary>Called by arbor engine to draw each existing edge</summary>
        /// <param name="edge">(Object) { source: Node, target: Node, length: #, data: {} }</param>
        /// <param name="pt1">(Object) { x: #, y: # }  source position in screen coords</param>
        /// <param name="pt2">(Object) { x: #, y: # }  target position in screen coords</param>

        // Get dimensions
        var dim = Math.connectPoints(pt1, pt2);

        // Line position + Line width + Rotate line
        $('#' + edge.data.elementId).css({ 'width': dim.length + 'px',
            'top': dim.top + 'px',
            'left': dim.left + 'px',
            '-moz-transform': 'rotate(' + dim.angle + 'deg)',
            '-webkit-transform': 'rotate(' + dim.angle + 'deg)',
            '-o-transform': 'rotate(' + dim.angle + 'deg)',
            '-ms-transform': 'rotate(' + dim.angle + 'deg)',
            'transform': 'rotate(' + dim.angle + 'deg)'
        });
    },
    drawNode: function(node, pt)
    {
        /// <summary>Called by arbor engine to draw each existing node</summary>
        /// <param name="node">(Object) { mass: #, p: {x,y}, name: "", data: {} } node data</param>
        /// <param name="pt">(Objec) {x: #, y: #}  node position in screen coords</param>

        var $div = node.data.item.getElement();
        var offSet = $(this.canvasId).offset();
        $div.offset({ top: (offSet.top + (pt.y - ($div.outerHeight() / 2))), left: (offSet.left + (pt.x - ($div.outerWidth() / 2))) });
        // Attach node object
        if (!$div.data('node'))
            $div.data('node', node);
        // Atttach mouse-down event for drag 'n drop
        if (!$div.data('attached'))
        {
            $div.$bind($.On.MouseDown, this.evt_node_onmousedown, this)
                .data('attached', true)
                .children('p')
                    .$bind($.On.MouseDown, this.evt_node_onmousedown, this);
        }
    },
    showItem: function(oItem)
    {
        var oNode = this.engine.getNode(oItem.id);
        if (oNode)
        {
            this.clearNodes(oNode.name);
            oNode.data.item = oItem;
        }
        else
        {
            oNode = this.addItemNode(oItem);
        }
        oNode.mass = 8;
        return oNode;
    },
    showFullItem: function(oItem)
    {
        var oNode = this.showItem(oItem);
        oNode.mass = (8 * oItem.children.length);
        $('#' + oNode.data.item.elementId)
            .removeClass('child')
            .addClass('root');
        this.showItemNodeChildren(oNode);
    },
    showEdge: function(oParent, oChild)
    {
        var arrEdges = this.engine.getEdges(oParent, oChild);
        var oEdge = (arrEdges.length > 0) ? arrEdges[0] : null;
        if (!oEdge)
        {
            var elementId = oParent.data.item.getEdgeElementId(oChild.data.item);
            $(this.canvasId).append($('<div />', { id: elementId, class: 'graph-edge' }));
            oEdge = this.engine.addEdge(oParent, oChild, { length: 0.5, elementId: elementId });
        }
        return oEdge;
    },
    addItemNode: function(oItem)
    {
        $el = $('<div />', { id: oItem.elementId, class: 'graph-floater child' })
            .appendTo($(this.canvasId))
            .append($('<p />', { class: 'text' })
                .html(oItem.name)
                .data('ownerId', oItem.elementId));
        if (oItem.children.length > 0)
        {
            $el.append($('<div />', { class: 'choose' })
                    .append($('<a />', { href: '#' })
                        .html('Choose')
                        .data('item', oItem)
                        .$bind($.On.Click, this.evt_node_onchoose, this)));
        }
        var oNode = this.engine.addNode(oItem.id, { mass: 8, item: oItem });
        return oNode;
    },
    showItemNodeChildren: function(oNode)
    {
        for (var i = 0; i < oNode.data.item.children.length; i++)
        {
            this.showEdge(oNode, this.showItem(oNode.data.item.children[i]));
        }
    },
    clearNodes: function(sExceptionId)
    {
        var self = this;
        this.engine.eachEdge(function(edge, pt1, pt2)
        {
            var $edge = $('#' + edge.source.data.item.getEdgeElementId(edge.target.data.item));
            if (!$exists($edge))
                $edge = $('#' + edge.target.data.item.getEdgeElementId(edge.source.data.item));
            $edge.remove();
        });
        this.engine.eachNode(function(node, pt)
        {
            if (!$.isString(sExceptionId) || !sExceptionId.equals(node.name, true))
            {
                self.engine.pruneNode(node);
                node.data.item.getElement().remove();
            }
        });
    },
    keepInsideCanvas: function($el, oPoint)
    {
        var xBuffer = $el.outerHeight() / 2;
        var yBuffer = $el.outerWidth() / 2;
        if ((oPoint.x - xBuffer) < 0)
            oPoint.x = xBuffer;
        else if ((oPoint.x + xBuffer) > this.width)
            oPoint.x = (this.width - xBuffer);
        if ((oPoint.y - yBuffer) < 0)
            oPoint.y = yBuffer;
        else if ((oPoint.y + yBuffer) > this.height)
            oPoint.y = (this.height - yBuffer);
        return oPoint;
    },
    releaseNode: function()
    {
        if (this.dragging)
        {
            var oNode = this.dragging.data('node');
            if (oNode)
            {
                oNode.fixed = false;
                // oNode.tempMass = 1000;
            }
        }

        $(window).unbind('mousemove.drag')
            .unbind('mouseup.drag');
        this.dragging = null;
    },
    evt_node_onchoose: function(oEvt)
    {
        var $elLink = $(oEvt.target);
        var oItem = $elLink.data('item');
        this.showFullItem(oItem);
    },
    evt_node_onmousedown: function(oEvt)
    {
        this.dragging = $(oEvt.target);
        var sOwner = this.dragging.data('ownerId');
        if ($.isString(sOwner))
            this.dragging = $('#' + sOwner);
        var oNode = this.dragging.data('node');
        if (oNode != null)
        {
            // while we're dragging, don't let physics move the node
            oNode.fixed = true;
        }

        $(window).bind('mousemove.drag', $.proxy(this.evt_node_ondrag, this))
            .bind('mouseup.drag', $.proxy(this.evt_window_onmouseup, this));

        return false
    },
    evt_node_ondrag: function(oEvt)
    {
        var oCanvasPos = $(this.canvasId).offset();
        var oPoint = arbor.Point(oEvt.pageX - oCanvasPos.left, oEvt.pageY - oCanvasPos.top);
        if (this.dragging)
        {
            var oNode = this.dragging.data('node');
            if (oNode != null)
                oNode.p = this.engine.fromScreen(this.keepInsideCanvas(this.dragging, oPoint));
        }
        return false
    },
    evt_window_onmouseup: function(oEvt)
    {
        this.releaseNode();
        return false
    }
}

$.jaGraphItem = function(sId, sName)
{
    this.id = sId;
    this.name = sName;
    this.elementId = 'idItem_' + sId;
    this.children = [];
}
$.jaGraphItem.prototype =
{
    addChild: function(oNode)
    {
        this.children.push(oNode);
    },
    getElement: function()
    {
        return $('#' + this.elementId)
    },
    getEdgeElementId: function(oChildItem)
    {
        return 'idEdge_' + this.id + '_LINK_' + oChildItem.id
    }
}