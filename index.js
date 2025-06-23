const P = require('pino')
const path = require('path')
const fs = require('node:fs')
const { fileURLToPath } = require('url')
const { useMultiFileAuthState, makeCacheableSignalKeyStore, makeWASocket, DisconnectReason, getContentType } = require('baileys')
const { exec } = require('child_process')
const QRCode = require('qrcode')

let plugins;

const start = async() => {
	const level = P({ level: 'silent' }).child({ level: 'silent' })
	const {
		state,
		saveCreds
	} = await useMultiFileAuthState('session')
	
	const sock = makeWASocket({
		logger: level,
		printQRInTerminal: true,
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, level),
		}
	})
	
	sock.ev.on('connection.update', async(update) => {
		const { connection, lastDisconnect, qr } = update
		if (qr) {
			// as an example, this prints the qr code to the terminal
			console.log(await QRCode.toString(qr, {type:'terminal'}))
		}
	})
	
	sock.ev.on('creds.update', saveCreds)
	
	sock.ev.on('messages.upsert', async({ type, messages }) => {
		m = messages[0]
		if (m.key.remoteJid === 'status@broadcast') return
		
		if (m.message) {
			m.message = m.message?.ephemeralMessage ? m.message.ephemeralMessage.message : m.message
			let pluginFolder = path.join(__dirname, 'plugins')
			let pluginFilter = (filename) => /\.js$/.test(filename)
			plugins = {}
				for (let filename of fs.readdirSync(pluginFolder).filter(pluginFilter)) {
					try {
						const module = await import(path.join(pluginFolder, filename));
						plugins[filename] = module.default || module;
					} catch (e) {
						console.error(`Error al cargar ${filename}:`, e);
						delete plugins[filename];
					}
				}
		}
		console.log(m)
		require('./message/upsert')(sock, m, plugins)
	})
}

start()
