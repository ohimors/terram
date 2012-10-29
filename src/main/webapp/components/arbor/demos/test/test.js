/// <reference path="..\_\jquery-1.6.1.min.js" />
/// <reference path="..\..\lib\arbor.js" />

var g_oSystem = null;

TestGraph = function(sDivId)
{
    this.particleSystem;
    this.canvasId = sDivId;
    this.$dragging = null;
}
TestGraph.prototype =
{
    init: function(system)
    {
        this.particleSystem = system;
        this.particleSystem.screenSize(800, 600);
        this.particleSystem.screenPadding(40);
    },
    redraw: function()
    {
        this.particleSystem.eachEdge(function(edge, pt1, pt2)
        {
            // edge: {source:Node, target:Node, length:#, data:{}}
            // pt1:  {x:#, y:#}  source position in screen coords
            // pt2:  {x:#, y:#}  target position in screen coords

            // Get dimensions
            var dim = generateLineBetweenPoints(pt1, pt2);

            // Line position + Line width + Rotate line
            $('#' + edge.data.hrId).css({ 'width': dim.length + 'px',
                'top': dim.top + 'px',
                'left': dim.left + 'px',
                '-moz-transform': 'rotate(' + dim.angle + 'deg)',
                '-webkit-transform': 'rotate(' + dim.angle + 'deg)',
                '-o-transform': 'rotate(' + dim.angle + 'deg)',
                '-ms-transform': 'rotate(' + dim.angle + 'deg)',
                'transform': 'rotate(' + dim.angle + 'deg)'
            });
        });

        var self = this;
        this.particleSystem.eachNode(function(node, pt)
        {
            // node: {mass:#, p:{x,y}, name:"", data:{}}
            // pt:   {x:#, y:#}  node position in screen coords

        	var offSet = $(self.canvasId).offset();
            var $div = $('#' + node.data.divId).offset({ top: (offSet.top + (pt.y - 50)), left: (offSet.left + (pt.x - 50)) });
            if (!$div.prop('node'))
            {
                $div.prop('node', node);
            }
            if (!$div.prop('attached'))
            {
                $div.mousedown($.proxy(self.evt_div_onmousedown, self)).prop('attached', true);
            }
        });
    },
    evt_div_onmousedown: function(oEvt)
    {
        var pos = $(this.canvasId).offset();
        _mouseP = arbor.Point(oEvt.pageX - pos.left, oEvt.pageY - pos.top)
        if (oEvt.target)
        {
            this.dragging = $(oEvt.target);
            var oNode = this.dragging.prop('node');
            if (oNode != null)
            {
                // while we're dragging, don't let physics move the node
                oNode.fixed = true;
            }

            $(this.canvasId).bind('mousemove.drag', $.proxy(this.evt_div_ondrag, this));
            $(window).bind('mouseup.drag', $.proxy(this.evt_document_onmouseup, this));
        }

        return false
    },
    evt_div_ondrag: function(oEvt)
    {
        var pos = $(this.canvasId).offset();
        var s = arbor.Point(oEvt.pageX - pos.left, oEvt.pageY - pos.top)
        if (this.dragging)
        {
            var oNode = this.dragging.prop('node');
            if (oNode != null)
            {
                var p = this.particleSystem.fromScreen(s);
                oNode.p = p;
            }
        }

        return false
    },
    evt_document_onmouseup: function(oEvt)
    {
        if (this.dragging)
        {
            var oNode = this.dragging.prop('node');
            if (oNode)
            {
                oNode.fixed = false;
                oNode.tempMass = 1000;
            }
        }

        $(this.canvasId).unbind('mousemove.drag');
        $(window).unbind('mouseup.drag');
        this.dragging = null;

        return false
    }
}

function evt_Test_onload(oEvt)
{
    g_oSystem = arbor.ParticleSystem(1000, 600, 0.5);
    g_oSystem.parameters({ gravity: false });
    g_oSystem.renderer = new TestGraph('#idDiv_Canvas');

    var nodeOne = g_oSystem.addNode('idDiv_One', { mass: .5, divId: 'idDiv_One' });
    var nodeTwo = g_oSystem.addNode('idDiv_Two', { mass: .5, divId: 'idDiv_Two' });
    var nodeThree = g_oSystem.addNode('idDiv_Three', { mass: .5, divId: 'idDiv_Three' });
    var nodeFour = g_oSystem.addNode('idDiv_Four', { mass: .5, divId: 'idDiv_Four' });
    var nodeFive = g_oSystem.addNode('idDiv_Five', { mass: .5, divId: 'idDiv_Five' });
    g_oSystem.addEdge(nodeOne, nodeTwo, { hrId: 'idHr_ConnectOneTwo' });
    g_oSystem.addEdge(nodeOne, nodeThree, { hrId: 'idHr_ConnectOneThree' });
    g_oSystem.addEdge(nodeOne, nodeFour, { hrId: 'idHr_ConnectOneFour' });
    g_oSystem.addEdge(nodeOne, nodeFive, { hrId: 'idHr_ConnectOneFive' });
}

function generateLineBetweenPoints(pt1, pt2)
{
    var dim = { length: 0, angle: 0, top: 0, left: 0 }

    // If the y coordinates are equal, this is a flat line
    if (pt1.y == pt2.y)
    {
        // Line always goes from left to right
        dim.angle = 0;
        dim.length = Math.abs(pt1.x - pt2.x);
        dim.top = pt1.y;
        dim.left = (pt1.x < pt2.x) ? pt1.x : pt2.x;
    }
    else
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
        var adj = endLeft - startLeft;
        dim.length = Math.sqrt(Math.pow(opp, 2) + Math.pow(adj, 2));

        // If line is going down from left to right, normally the angle would be negative
        // However, the are 2 unique factors here:
        // 1) CSS rotates counter-clockwise since it's in respect to the left end of the line
        // 2) Lines going visually down are actually increasing in 'top' pixels
        // Thus, a line is going down if the endTop is greater than the startTop (and vice versa)
        // and a line going down is positive angle, while a line going up is a negative angle
        var angleRadians = Math.asin(opp / dim.length);
        dim.angle = ((angleRadians) / (2 * Math.PI)) * 360;
        if (endTop < startTop)
        {
            angleRadians = (0 - angleRadians);
            dim.angle = (0 - dim.angle);
        }

        // Since CSS will position the line based on it's left end, but rotate it from the middle
        // of the circle, we must account for the rotation amount to determine where the line
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
        var xDiff = radius - Math.abs(radius * Math.cos(circleRadians));
        var yDiff = Math.abs(radius * Math.sin(circleRadians));

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

$(document).ready(evt_Test_onload);