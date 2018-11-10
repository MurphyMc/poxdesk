// Currently has no support for stopping and restarting (though shouldn't be
// too hard).

qx.Class.define("poxdesk.WebsocketChannel",
{
  extend : qx.core.Object,

  events :
  {
    "connected" : "qx.event.type.Data",
    "message" : "qx.event.type.Data",
    "disconnected" : "qx.event.type.Data"
  },

  properties : {
    location : {init: null},
    queuePending : {init: true, check: 'Boolean'}, // Queue sends when closed
    jsonMode : {init: true, check: 'Boolean'} // messages are json
  },

  construct : function()
  {
    this._buffer = [];
  },


  members :
  {
    start:function(loc)
    {
      if (loc) this.setLocation(loc);
      qx.core.Assert.assert(this._timer === null, "Already started");

      qx.lang.Function.delay(this._connect, 0, this);
      this._timer = new qx.event.Timer(2500);
      this._timer.addListener("interval", this._connect, this);
      this._timer.start();
    },

    _connect:function()
    {
      if (this._socket)
      {
        switch (this._socket.readyState)
        {
          case 0:
          case 1:
            return;
        }
      }
      if (this._socket)
      {
        this._socket.onclose = this._socket.onmessage = this._socket.onerror = null;
        try
        {
          this._socket.close();
        }
        catch (err)
        {
        }
        try
        {
          this._socket.terminate();
        }
        catch (err)
        {
        }
        this._socket = null;
        if (this._ever_connected)
        {
          this._ever_connected = false; //XXX
          this.fireDataEvent('disconnected', this);
        }
      }
      //console.log(this['$$hash']); //XXX
      if (this._close)
      {
        if (this._timer.isEnabled()) this._timer.stop();
        return;
      }

      var loc = this.getLocation();
      if (loc.startsWith("/"))
      {
        var proto = location.protocol == "https:" ? "wss://" : "ws://";
        loc = proto + loc;
      }
      this._socket = new window.WebSocket(loc);
      this._socket.onclose = function () {
        console.log("Reconnect momentarily...");
        try
        {
          this._socket.close();
          this._socket.terminate();
        }
        catch (err)
        {
        }
        //this._socket_failed = true;
      }.bind(this);
      this._socket.onerror = this._socket.onclose;
      this._socket.onmessage = function (event) {
        var data = this.isJsonMode() ? JSON.parse(event.data) : event.data;
        //console.log("Got data", this, data);
        try
        {
          this._on_message(data);
        }
        catch (err)
        {
          console.log("Error handling WebsocketChannel message", err);
        }
      }.bind(this);
      this._socket.onopen = function (event) {
        console.log("Connected to", this.getLocation());
        this._ever_connected = true;
        var len = this._buffer.length;
        while (len > 0) {
          var nxt = this._buffer.shift();
          this.send(nxt);
          len--;
        }
        this.fireDataEvent('connected', this);
      }.bind(this);
    },


    _on_message : function (data)
    {
      this.fireDataEvent('message', data);
    },


    send : function (msg)
    {
      var m = this.isJsonMode() ? JSON.stringify(msg) : msg;
      try
      {
        this._socket.send(m);
        //console.log("SENT", msg);
      }
      catch (err)
      {
        console.log("SEND FAIL", msg);
        if (this.isQueuePending()) this._buffer.push(msg);
        this._socket.onerror();
      }
    },


    close : function()
    {
      this._close = true;
      this._connect(); // irony == true;
    },


    _ever_connected : false,
    _close : false,
    socket : null,
    _buffer : null,
    _timer : null // (re)connect timer
  },


  destruct : function()
  {
    this.close();
    this._disposeObjects("_timer");
    this._socket = null;
  }
});
