//TODO: Assert when calling ret/err multiple times

qx.Class.define("poxdesk.DispatchContext",
{
  extend : qx.core.Object,


  properties : {
  },


  construct : function (session, orig_msg)
  {
    this.session = session;
    this.orig_msg = orig_msg;
  },


  members :
  {
    ret : function (val)
    {
      this.ret_called = true;
      if (val === undefined) return;
      if (this.orig_msg.on_ret)
      {
        var m = {method:'_return_dispatch', kw:{data:val, identifier:this.orig_msg.on_ret}};
        this.session.send(m);
      }
    },
    err : function (val)
    {
      this.err_called = true;
      if (this.orig_msg.on_err)
      {
        var m = {method:'_error_dispatch', kw:{data:val, identifier:this.orig_msg.on_err}};
        this.session.send(m);
      }
    },
    isCalled : function ()
    {
      return this.ret_called || this.err_called;
    },

    session: null,
    orig_msg: null,
    ret_called: false,
    err_called: false
  }
});
