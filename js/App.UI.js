Ext.ns("App");

App.UI = Ext.extend(Ext.Panel, {
	fullscreen: true,
	layout: "card",
	cardSwitchAnimation: "slide",
	
	initComponent: function() {
		this.dockedItems = this.buildDocks();
		
		if (!this.store) {
			this.store = new Ext.data.Store({
				storeId: "QRCodes",
				model: "QRCodes",
				autoLoad: true,
				proxy: {
					type: "localstorage",
					id: "QRCodes",
					model: "QRCodes"
				}
			});
		}
		
		this.items = this.buildList();
		
		App.UI.superclass.initComponent.call(this);
	},
	
	buildDocks: function() {
		return [
			{
				xtype : "toolbar",
				dock  : "bottom",
				items : [
					{
						text    : "Create QR Code",
						scope   : this,
						handler : this.createQRCode
					}
				]
			}
		]
	},
	
	buildList: function() {
		return {
			xtype: "list",
			store: this.store,
			itemSelector : "div.qrcode",
			singleSelect : true,
			overItemCls : "x-view-over",
			emptyText : "No Saved QRCodes",
			scroll: "vertical",
			autoHeight: true,
			itemTpl: new Ext.XTemplate(
				'<tpl for=".">',
					'<div class="qrcode">',
						'<div class="qrcode-info">',
							'{data}<br>',
						'</div>',
						'<img src="data:image/png;base64,{image}" />',
					'</div>',
				'</tpl>'
			),
			listeners: {
				scope: this,
				itemtap: this.openDetails
			}
		};
	},
	
	openDetails: function(list, index) {
		var store = list.getStore();
		var rec = store.getAt(index);
		
		var html = new Ext.Template('<img src="data:image/png;base64,{image}" />').apply(rec.data);
		
		var panel = new Ext.Panel({
			floating: true,
			modal: true,
			centered: true,
			html: html,
			listeners: {
				scope: this,
				hide: this.cleanUp
			}
		});
		
		this.detailPanel = panel;
		
		this.detailPanel.show();
		
		this.detailPanel.mon(this.detailPanel.el, {
			scope: this,
			tap: this.panelTap
		});
	},
	
	panelTap: function() {
		this.detailPanel.hide();
	},
	
	cleanUp: function() {
		this.detailPanel.destroy();
		delete this.detailPanel;
	},
	
	createQRCode: function() {
		if (!navigator.onLine) {
			Ext.Msg.alert("Offline", "You are currently Offline and cannot create new QR Codes", Ext.emptyFn);
			return false;
		}
		var sizeOpt = [];
		for (var i = 1; i <= 10; i++) {
			sizeOpt.unshift({ text: i, value: i });
		}
		var panel = new Ext.form.FormPanel({
			defaultType: "selectfield",
			defaults: { labelAlign: "top" },
			scroll: "vertical",
			items: [
				{ name: "correctionLevel", label: "Correction Level", options: [
					{ text: "H - best", value: "H" },
					{ text: "Q", value: "Q" },
					{ text: "M", value: "M" },
					{ text: "L - smallest", value: "L" }
				] },
				{ name: "pointSize", label: "Matrix Point Size", options: sizeOpt },
				{ xtype: "textareafield", name: "data", label: "Data" },
				{ xtype: "fieldset", layout: "hbox", defaults: { flex: 1 }, items: [
					{ xtype: "button", text: "Cancel", ui: "decline", scope: this, handler: this.doCancel },
					{ xtype: "button", text: "Create", ui: "confirm", scope: this, handler: this.doSave }
				] }
			],
			listeners: {
				scope: this,
				deactivate: this.destroyPanel
			}
		});
		
		var cmp = this.add(panel);
		this.doLayout();
		this.setActiveItem(cmp);
	},
	
	doCancel: function() {
		this.setActiveItem(0, { type: "slide", reverse: true });
	},
	
	destroyPanel: function(panel) {
		panel.destroy();
	},
	
	doSave: function() {
		var values = this.getComponent(1).getValues();
		this.doCreateQRCode(values);
	},
	
	doCreateQRCode: function(params) {
		this.Mask = new Ext.LoadMask(Ext.getBody(), { msg: "Creating QR Code..." });
		this.Mask.show();
		Ext.Ajax.request({
			url: "createQRCode.php",
			scope: this,
			params: params,
			success: this.handleResponse,
			failure: this.handleResponse
		});
	},
	
	handleResponse: function(response) {
		this.Mask.hide();
		if (response.status !== 200) {
			return ;
		}
		
		var result = Ext.decode(response.responseText);
		
		Ext.applyIf(result, {
			created: new Date()
		});
		
		this.saveOffline(result);
		
		this.doCancel();
	},
	
	saveOffline: function(obj) {
		var store = this.store;
		
		store.add(obj);
		store.sync();
	}
});

Ext.regModel("QRCodes", {
	fields : [
		{ name : "correctionLevel", type : "string" },
		{ name : "created",         type : "date"   },
		{ name : "data",            type : "string" },
		{ name : "id",              type : "int"    },
		{ name : "image",           type : "string" },
		{ name : "pointSize",       type : "int"    }
	]
});