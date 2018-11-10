qx.Class.define("poxdesk.POXDesk",
{
  extend : qx.core.Object,

  events :
  {
    "configured" : "qx.event.type.Data"
  },

  construct : function ()
  {
    var path = location.protocol + "//" + location.host + "/poxdesk/_/cfg/config.json";
    var req = new qx.io.request.Xhr(path);
    req.addListener("success", this._on_config, this);
    req.send();
  },

  members : {
    _on_config : function (e)
    {
      var req = e.getTarget();
      var resp = req.getResponse();
      console.log("POXDesk Config", resp);
      if (resp.ws)
      {
        this.dispatcher = new poxdesk.WebsocketDispatcher();
        this.dispatcher.setLocation("//" + location.host + "/poxdesk/_/ws/main");

        if (resp.ws.queue_pending !== undefined) this.dispatcher.setQueuePending(resp.ws.queue_pending);
        if (resp.ws.json_mode !== undefined) this.dispatcher.setJsonMode(resp.ws.json_mode);

        this.dispatcher.start();
      }
      this.fireDataEvent("configured", resp);
    },

    dispatcher: null
  }
});
