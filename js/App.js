Ext.ns("App");

Ext.setup({
	fullscreen: true,
	onReady: function() {
		App.Main = new App.UI();
	}
});