// Dispatcher is totally a hack for now. :(

qx.Class.define("poxdesk.Dispatcher",
{
  members : {
    set_channel : function (channel)
    {
      this.channel = channel;
      channel.addListener("message", this._on_message, this);
    },

    _on_message : function (msg)
    {
    },

    channel: null
  }
});

