//TODO: So much stuff missing...

qx.Class.define("poxdesk.WebsocketDispatcher",
{
  extend : poxdesk.WebsocketChannel,


  properties : {
    exposedObjects : {init: {}},
    exposedFunctions: {init: {}}
  },


  members :
  {
    _on_message : function (msg)
    {
      var m = this.getExposedFunctions()[msg.method];
      var o = this.getExposedObjects()[msg.object];
      if (o !== undefined)
      {
        var mm = o["_pdmethod_" + msg.method];
        if (mm !== undefined) m = mm;
      }

      var args = msg.args;
      if (args === undefined) args = [];
      if (msg.kw !== undefined) args.push(msg.kw);
      var ctxt = new poxdesk.DispatchContext(this, msg);
      args.splice(0, 0, ctxt);
      if (m === undefined)
      {
        console.log("No such method as " + msg.method);
        return;
      }
      //console.log("Calling",m,"with",args);
      try
      {
        m.apply(o, args);
      }
      catch (err)
      {
        if (!ctxt.isCalled())
        {
          ctxt.err(err);
        }
      }
    }
  }
});
