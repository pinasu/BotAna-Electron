const {
	app,
	BrowserWindow
} = require('electron')

let win

function createWindow() {
	win = new BrowserWindow({
		width: 700,
		height: 500,
		webPreferences: false,
		icon: '/media/main_icon.ico'
	})

	//Opens Developer Tools
	win.webContents.openDevTools()

	win.setMenu(null)

	win.loadFile('index.html')

	win.on('closed', () => {
		win = null
	})
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (win === null) {
		createWindow()
	}
})

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';