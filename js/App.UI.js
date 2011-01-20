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
						'<img src="{image}" />',
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
		
		var html = new Ext.Template('<img class="qrcode-popup" src="{image}" />').apply(rec.data);
		
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
		if (this.items.getCount() === 2) {
			return ;
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
				{ name: "pointSize", label: "Matrix Point Size", value: 4, options: sizeOpt },
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
		
		var qr = new QRCode(values.pointSize, QRErrorCorrectLevel[values.correctionLevel]);
        
        qr.addData(values.data);
        
        qr.make();
		
		var blockSize = 10;
		var canvasSize = qr.getModuleCount() * blockSize;
		
		var el = Ext.get("canvas-wrap");
		
		el.update("<canvas id='canvas' width='"+canvasSize+"' height='"+canvasSize+"'></canvas>");
		
		var canvas = document.getElementById("canvas");
		var ctx = canvas.getContext("2d");
		
		for (var r = 0; r < qr.getModuleCount(); r++) {
            for (var c = 0; c < qr.getModuleCount(); c++) {
                if (qr.isDark(r, c) ) {
					ctx.fillStyle = "rgb(0,0,0)";
                } else {
					ctx.fillStyle = "rgb(255, 255, 255)";
                }
				ctx.fillRect ((blockSize*r), (blockSize*c), blockSize, blockSize);
            }
        }
		
		var base64 = canvas.toDataURL();
		
		var obj = {
			correctionLevel: values.correctinLevel,
			created: new Date(),
			data: values.data,
			image: base64,
			pointSize: values.pointSize
		};
		
		this.saveOffline(obj);
		
		this.setActiveItem(0, { type: "slide", reverse: true });
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