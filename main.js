
const {
	app,
	BrowserWindow
} = require('electron')

const upath = require('upath');
const icon_app = upath.join(__dirname, "res", "images", "main_icon.ico");

let win

function createWindow() {
	win = new BrowserWindow({
		width: 800,
		height: 600,
        webPreferences: {
            nodeIntegration: true
        },
		icon: icon_app
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
