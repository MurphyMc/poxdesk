/*
#asset(qx/icon/Tango/16/categories/internet.png)
*/

qx.Class.define("poxdesk.TopoViewer",
{
  extend : qx.core.Object,
  
  events :
  {
  },
  
  properties :
  {    

  },
  
  construct : function()
  {
    this._switches = {};
    this._container = new poxdesk.ui.window.Window("TopoViewer");
    this._container.addListener("close", this.dispose, this);
    this._container.set({
      icon: "icon/16/categories/internet.png",
      width: 400,
      height: 400,
      contentPadding : [ 0, 0, 0, 0 ],
      allowMaximize : true,
      showMaximize : true
    });
    this._container.setLayout(new qx.ui.layout.VBox());
   
    this._canvas = new qx.ui.embed.Canvas().set({
      syncDimension: true
    });

    //alert(this._canvas.getContentElement());//Context2d());

    this._container.add(this._canvas, {flex: 1});







this.graph = new Graph();
var graph = this.graph;

//var jessica = graph.newNode({label: 'Jessica'});
//var barbara = graph.newNode({label: 'Barbara'});
//var jb = graph.newEdge(jessica, barbara, {directional: false, color: '#EB6841', label:"jessica<->barbara"});

var springy;

this._canvas.addListenerOnce('appear', function(){
var canvas = this._canvas.getContentElement().getDomElement();
jQuery(function(){
	springy = jQuery(canvas).springy({
		graph: graph
	});
});
  }, this);

this._canvas.addListener('redraw', function () {
  this.graph.notify();
}, this);





    this._messenger = new poxdesk.Messenger();
    this._messenger.start();
    this._messenger.addListener("connected", function (e) {
      var data = e.getData();
      this.debug("CONNECTED session " + data.getSession());
      var chan = "poxdesk_topo";
      this._messenger.join(chan);
      this._messenger.addChannelListener(chan, this._on_topo, this);
      this.refresh();
    }, this);



this._nodes = {};
this._edges = {};

  },
  
 
  members :
  {

    refresh : function ()
    {
      this._messenger.send({'cmd':'refresh'}, 'poxdesk_topo');
    },

    _on_topo : function (data)
    {
      this.debug("LOG:" + JSON.stringify(data));
      if (data.topo)
      {
        var ne = data.topo.links;
        var nn = data.topo.switches;

        var all_node_names = qx.lang.Object.clone(nn);
        qx.lang.Object.mergeWith(all_node_names, this._nodes);

        //this.warn("SW: " + JSON.stringify(all_node_names));
        

        for (var node_name in all_node_names)
        {
          var old_node = this._nodes[node_name];
          var new_node = nn[node_name];

          if (old_node !== undefined && new_node !== undefined)
          {
            // We're good.
          }
          else if (old_node === undefined)
          {
            // New node
            this.debug(new_node);
            var n = this.graph.newNode({label:new_node.label || node_name});
            this._nodes[node_name] = n;
          }
          else
          {
            // Remove node...
            this.graph.removeNode(old_node);
            delete this._nodes[node_name];
          }
        }

        var dead_edge_names = qx.lang.Object.clone(this._edges);
        for (var i = 0; i < ne.length; i++)
        {
          var a = ne[i][0];
          var b = ne[i][1];
          if (a > b) { var x = a; a = b; b = x; } // Swap
          var en = a + " " + b;
          if (this._edges[en] === undefined)
          {
            // New edge
            var aa = this._nodes[a];
            var bb = this._nodes[b];
            if (!aa || !bb) continue;

            var e = this.graph.newEdge(aa,bb, {directional:false});
            this._edges[en] = e;
          }
          else
          {
            delete dead_edge_names[en];
          }
        }

        for (var edge_name in dead_edge_names)
        {
          var dead = dead_edge_names[edge_name];
          this.graph.removeEdge(dead);
          delete this._edges[edge_name];
        }

      }
    },





    _switches : null, // switches we know about
    _messenger : null,
    _container : null
    //_controls : null,
    //_timer : null
  },

  destruct : function() {
    this._disposeObjects("_messenger");
  }
});
