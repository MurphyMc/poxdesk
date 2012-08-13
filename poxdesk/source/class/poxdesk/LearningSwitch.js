/*
#asset(qx/icon/Tango/16/devices/network*)
#asset(qx/icon/Tango/64/status/dialog-error.png)
*/

qx.Class.define("poxdesk.LearningSwitch",
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
    this._mac_to_port = {};
    this._rows = {};
    this._switches = {};
    this._container = new poxdesk.ui.window.Window("Disconnected - L2LS");
    this._container.addListener("close", this.dispose, this);
    this._container.set({
      icon: "icon/16/devices/network-wired.png",
      width: 180 + 50,
      height: 200,
      contentPadding : [ 0, 0, 0, 0 ]
    });
    this._container.setLayout(new qx.ui.layout.VBox());
    //this._container.open();
    
    //this.getRoot().add(this._container, {left: 50, top: 10});
    
    this._table = this.createTable();
    this._controls = this.createControls();
    if (this._controls) this._container.add(this._controls);
    
    this._container.add(this._table, {flex: 1});

    this._messenger = new poxdesk.Messenger();
    this._messenger.start();
    this._messenger.addListener("connected", function (e) {
      var data = e.getData();
      this.debug("CONNECTED session " + data.getSession());
      var chan = "of_01";//"openflow" + data.getSession() + "_" + data.toHashCode();
      this._messenger.join(chan);
      this._messenger.addChannelListener(chan, this._on_openflow, this);
      this._messenger.send({'cmd':'list_switches'}, chan);
      this._messenger.send({'packetins':'True'}, chan);
      this.debug("Sending switch request");
    }, this);
    //this.refresh();

    this._buildMenu();

    this._tableModel.addRows([["","(Not Connected)"]]);
  },
  
 
  members :
  {

    _on_openflow : function (data)
    {
      this.debug("LOG:" + JSON.stringify(data));
//this._tableModel.addRows([[icon,time,subsystem,msg]]);
      if (data.type_str == 'ConnectionUp')
      {
        this.addSwitch(data);//Probably not quite right!
      }
      else if (data.type_str == 'ConnectionDown')
      {
        //this.removeSwitch(data.dpid);
      }
      else if (data.switch_list)
      {
        for (var i = 0; i < data.switch_list.length; i++)
        {
          this.addSwitch(data.switch_list[i]);
        }
      }
      else if (data.type_str == "OFPT_PACKET_IN" && data.dpid === this._selected)
      {
        //this.debug("PACKETIN:" + JSON.stringify(data.payload));
        //try
        {
          // Learn
          if ((parseInt("0x" + data.payload.dst.substring(0,2)) & 1) == 0)
          {
            var key = data.payload.dst + "/" + data.payload.src;
            if (this._mac_to_port[key] == undefined)
            {
              // New!
              this._mac_to_port[key] = data.in_port;

              if (this._rows[data.in_port + "/" + data.payload.src] === undefined)
              {
                this._tableModel.addRows([[data.in_port,data.payload.src]]);
                this._rows[data.in_port + "/" + data.payload.src] = true;
              }

              this._sendTable();
            }
          }
          var dst = data.payload.dst;
          var out_port = this._mac_to_port[dst];
          var po = {'cmd':'packet_out', 'dpid':this._selected};
          po.buffer_id = data.buffer_id;
          po.in_port = data.in_port;

          if (out_port !== undefined)
            po.output = out_port; // Shortcut
          else
          {
            if (this._use_flood)
              po.output = "OFPP_FLOOD";
            else
              po.output = "OFPP_ALL";
          }
          this.debug(po.output);

          /*
          po.actions = {};
          po.actions.type = 'OFPAT_OUTPUT';
          po.actions.port = out_port;
          */

          //this.debug(JSON.stringify(po));
          this._messenger.send(po, 'of_01');
        }
        //catch (e)
        {
        }
      }
    },

    _sendTable : function ()
    {
      var table = [];
      for (var macs in this._mac_to_port)
      {
        var port = this._mac_to_port[macs];
        macs = macs.split("/");
        var flipped = macs[1] + "/" + macs[0];
        if (this._mac_to_port[flipped] === undefined) continue;
        var entry = {};
        table.push(entry);
        var out = {};
        out.type = "OFPAT_OUTPUT";
        out.port = port;
        entry.actions = [out];
        entry.match = {};
        entry.match.dl_src = macs[0];
        entry.match.dl_dst = macs[1];
        //entry.idle_timeout = 30;
      }

      var st = {'cmd':'set_table', 'dpid':this._selected};
      st.flows = table;

      this.debug(JSON.stringify(st));
      this._messenger.send(st, 'of_01');
    },

    addSwitch : function (sw)
    {
      this.debug(sw);
      this._switches[sw.dpid] = sw;
      this._buildMenu();
    },

    _checkItem : function (checkbox)
    {
      this._selected = checkbox.getLabel();
      this._buildMenu();
      this._container.setCaption(this._selected + " - L2LS");
      this._tableModel.setData([]);
      this._sendTable();
    },

    _buildMenu : function ()
    {
      var count = 0;
      var self = this;
      function cb (e)
      {
        self._checkItem(this);
      }

      this._switchMenu.removeAll();
      for (var dpid in this._switches)
      {
        count++;
        var opt = new qx.ui.menu.CheckBox(dpid);
        if (!this._selected)
        {
          opt.addListener('changeValue', cb);
        }
        else
        {
          opt.setEnabled(false);
        }
        if (dpid == this._selected) opt.setValue(true);
        this._switchMenu.add(opt);
      }

      if (count == 0)
      {
        var opt = new qx.ui.menu.CheckBox("(No switches yet)");
        opt.setEnabled(false);
        this._switchMenu.add(opt);
      }
    },

    createTable : function()
    {
      // table model
      var tableModel = this._tableModel = new qx.ui.table.model.Simple();
      tableModel.setColumns([ "Port", "MAC" ]);
      tableModel.sortByColumn(1, true);
      //tableModel.setColumnSortable(3, false);
      
      // Customize the table column model.  We want one that automatically resizes columns.
      var custom =
      {
        tableColumnModel : function(obj) {
          return new qx.ui.table.columnmodel.Resize(obj);
        }
      };
      
      var table = new qx.ui.table.Table(tableModel, custom);
      
      /*
      table.set({
        width: 300,
        height: 400,
        decorator : null
      });
      */
      
      //table.getSelectionModel().setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);
      
      var tcm = table.getTableColumnModel();
            
      var rez = tcm.getBehavior();
      rez.setWidth(0, 45);
      //rez.setWidth(1, 110);

      return table;
    },



    createControls : function()
    {

      var bar = new qx.ui.menubar.MenuBar;
      var menu, opt;

      //menu = new qx.ui.menu.Menu;
      //opt = new qx.ui.menu.CheckBox();
      //menu.add(opt);

      this._switchMenu = new qx.ui.menu.Menu();
      menu = new qx.ui.menubar.Button("Switch", null, this._switchMenu);
      bar.add(menu);

      /*
      menu.addListener("execute", function (e) {
        this.debug("REQUEST SWITCHES");
        this._messenger.send({'cmd':'list_switches'}, 'of_01');
      }, this);
      */

      menu = new qx.ui.menu.Menu();
      opt = new qx.ui.menu.CheckBox("Use Flood");
      opt.setValue(this._use_flood);
      opt.addListener("changeValue", function (v) {
        this._use_flood = v.getData();
      }, this);
      menu.add(opt);
      opt = new qx.ui.menu.Button("Refresh");
      opt.addListener("execute", function () {
        this._sendTable();
      }, this);
      menu.add(opt);
      opt = new qx.ui.menu.Button("Clear");
      opt.addListener("execute", function () {
        this._tableModel.setData([]);
        this._rows = {};
        this._mac_to_port = {};
        this._sendTable();
      }, this);
      menu.add(opt);
      bar.add(new qx.ui.menubar.Button("Operations", null, menu));
      

      return bar;
    },

    _mac_to_port : null, // learn table
    _selected : null, // selected switch (or null)
    _switches : null, // switches we know about
    _switchMenu : null,
    _messenger : null,
    _container : null,
    _controls : null,
    _table : null,
    _use_flood : true,
    _tableModel : null
  }, 

  destruct : function() {
    this._disposeObjects("_messenger");
  }
});
