/*
#asset(qx/icon/Tango/16/apps/utilities-terminal.png)
*/



  



qx.Class.define("poxdesk.Terminal",
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
    this._container = new poxdesk.ui.window.Window("Terminal");

    this._container.setIcon("icon/16/apps/utilities-terminal.png");
    this._container.setContentPadding(0);
    this._container.setResizable(false);
    this._container.setLayout(new qx.ui.layout.Canvas())
    var vt = new poxdesk.TerminalWidget();
    this._container.add(vt);
    this._container.addListener("activate", function (e) { this.activate(); this.focus(); }, vt);        
    vt.activate();
    vt.focus();
    vt.addListener("characters", function (e) { this._tx(e.getData()); }, this);
    this._vt = vt;

    this.addListener("keydown", function (e) {
      if (e.isCtrlPressed())
      {
        e.preventDefault();
      }
    });


    this._container.addListener("close", this.dispose, this);

    this._messenger = new poxdesk.Messenger();
    this._messenger.start();
    this._messenger.addListener("connected", function (e) {
      var data = e.getData();
      this.debug("CONNECTED session " + data.getSession());
      var chan = "terminal" + data.getSession() + "_" + this.toHashCode();
      this._vt.write("Connecting to channel " + chan + "...\n");
      this._channel = chan;
      this._messenger.join(chan);
      this._messenger.addChannelListener(chan, this._on_rx, this);
      this._messenger.send({'cmd':'invite','bot':'TerminalBot','channel':chan}, '');
    }, this);

  },
  
 
  members :
  {

    _on_rx : function (data)
    {
      this._vt.write(data.rx);
      this.debug(data.rx);
    },

    _tx : function (data)
    {
//      this.debug(JSON.stringify(st));
      this._messenger.send({'rx':data}, this._channel);
    },


    _channel : null,
    _messenger : null,
    _container : null,
    _vt : null
  }, 

  destruct : function() {
    this._disposeObjects("_messenger");
  }
});

