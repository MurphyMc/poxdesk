/*

*/
qx.Class.define("poxdesk.Messenger",
{
  extend : qx.core.Object,
  events :
  {
    "connected" : "qx.event.type.Data",
    "disconnected" : "qx.event.type.Data"  //TODO: Fire this
  },
  properties : {

  },
  construct : function()
  {
    var rpc = new qx.io.remote.Rpc("/_jrpcmsg/", "messenger_tx");
    this._txer = rpc;
    rpc.setTimeout(1000 * 10);
    this._rx_requests = {

    };
    this._channels = {

    };
    this._channel_rc = {

    };  // Refcounts (join counts)
    rpc = new qx.io.remote.Rpc("/_jrpcmsg/", "messenger_rx");
    this._rxer = rpc;
    rpc.setTimeout(1000 * 30);  // * 60 * 1);
    rpc.addListener("completed", this._on_rx_completed, this);
    rpc.addListener("failed", this._on_rx_failed, this);
    rpc.addListener("timeout", this._on_rx_timeout, this);
  },
  members :
  {
    stop : function()
    {
      this._dead = true;
      this._txer.callAsync(function() {
      }, "stop", this._ses_key);

      /*
      for (var x in this._rx_requests)
      {
        this._rxer.abort(this._rx_requests[x]);
        delete this._rx_requests[x];
      }
      */
    },
    start : function() {
      this._cycle_rx();
    },
    send : function(_data, channel)
    {
      var data = {

      };
      if (channel)data.CHANNEL = channel;

      qx.lang.Object.mergeWith(data, _data, false);
      this.debug("sending", JSON.stringify(data));
      var seq = this._tx_seq;
      this._tx_seq++;
      var self = this;
      function f(result, err, id)
      {
        if (this._dead)return;

        if (result) {
          if (result.ack)
          {
            self._maybe_connect(result.session);

            //TODO: ACK/resend

            //if (self._tx_seq < result.ack) self._tx_seq = result.ack;
          } else
          {
            window.alert("Bad send");
          }
        } else {
          self.debug("tx error", err);
        }
      }
      this._txer.callAsync(f, "send", this._ses_key, data, seq);
    },
    _cycle_rx : function()
    {
      //this.debug("cycling rx");
      var r = this._rxer.callAsyncListeners(true, "poll", this._ses_key, this._rx_seq);
      var xid = r.getSequenceNumber();
      this._rx_requests[xid] = r;
    },
    _maybe_connect : function(ses)
    {
      if (!ses)return;

      if (this._ses_key == "new!")
      {
        this._ses_key = ses;
        this.fireDataEvent('connected', this);
        this.debug("connected!");
      } else
      {
        //TODO: Check that it matches
      }
    },
    getSession : function() {
      //TODO: make property?
      return this._ses_key;
    },
    _on_rx_completed : function(e)
    {
      if (this._dead)return;

      this.warn(e.getData());
      var r = e.getData().result;
      delete this._rx_requests[e.getData().id]
      this._maybe_connect(r.session);
      if (r.failure) {
        this.error("Messenger failure " + this._ses_id + " " + JSON.stringify(r));
      }
      for (var i = 0; i < r.messages.length; i++)
      {
        var msg = r.messages[i];

        //this.info(typeof msg);

        //this.info(r.session + ":" + JSON.stringify(msg));
        var listeners = this._channels[msg['CHANNEL']];
        if (listeners) {
          for (var j = 0; j < listeners.length; j++)
          {
            var l = listeners[j];
            l.callback.call(l.context, msg, this, msg['CHANNEL']);
          }
        }
      }
      if (this._rx_seq != r.seq) {
        this.error("Sequence mistmatch!");
      }
      var seq = r.seq + r.messages.length;
      this._rx_seq = Math.max(seq, this._rx_seq);
      this._cycle_rx();
    },
    _on_rx_failed : function(e)
    {
      if (this._dead)return;

      this.debug("rx failed");
      var data = e.getData();
      var req = this._rx_requests[data.id];
      req.abort();
      delete this._rx_requests[data.id]

      //this.debug(JSON.stringify(e.getData()));
      if (data.origin == qx.io.remote.Rpc.origin.local) {
        if (data.code == qx.io.remote.Rpc.localError.timeout)
        {
          this._cycle_rx();

          //this.debug("cycling rx");
        }
      }
    },
    _on_rx_timeout : function(e)
    {
      if (this._dead)return;

      this._cycle_rx();
    },
    removeChannelListener : function(callback, context)
    {
      var chains = qx.lang.Object.getValues(this._channels);
      for (var i = 0; i < chains.length; i++)
      {
        var chain = chains[i];
        for (var j = 0; j < chain.length; j++)
        {
          var e = chain[j];
          if (e.callback == callback) {
            if (e.context == context)
            {
              qx.lang.Array.removeAt(chain, j);
              return;
            }
          }
        }
      }
      this.warn("No listener removed");
    },
    addChannelListener : function(channel, callback, context)
    {
      //TODO: Handle doing this when we're not connected...
      if (this._channels[channel] === undefined)
      {
        this._channels[channel] = [];

        //Send subscribe?
      }
      var o = Object();
      o.callback = callback;
      o.context = context;
      this._channels[channel].push(o);
    },
    leave : function(channel)
    {
      var c = this._channel_rc[channel];
      if (!c)c = 0;

      c--;
      this._channel_rc[channel] = c;
      if (c != 0)return;

      var m =
      {
        'CHANNEL' : '',
        'cmd' : 'leave_channel',
        'channel' : channel
      };
      this.send(m);
    },
    join : function(channel, extra)
    {
      var c = this._channel_rc[channel];
      if (!c)c = 0;

      c++;
      this._channel_rc[channel] = c;
      if (c != 1)return;

      var m =
      {
        'CHANNEL' : '',
        'cmd' : 'join_channel',
        'channel' : channel
      };
      if (extra)qx.lang.Object.mergeWith(m, extra, false);

      this.send(m);
    },
    _ses_key : 'new!',
    _rx_seq : 0,
    _tx_seq : 0,
    _rxer : null,
    _txer : null,
    _rx_requests : null,  //TODO: Remove this? (we're not using it)
    _channels : null,
    _channel_rc : null
  },
  destruct : function()
  {
    this.stop();
    this._disposeObjects("_rxer", "_txer");
  }
});
