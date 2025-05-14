const util = require('util')
const { exec } = require('child_process')

const { removeAccents } = require('../lib/functions')
const { sms } = require('../lib/simple')

module.exports = async(sock, m, plugins) => {
	try {
		m = await msg(sock, m)

		const isCmd = m.body.startsWith(prefix)
		const command = isCmd ? removeAcents(m.body.slice(1).toLowerCase().trim().split(/ +/).filter((c) => c)[0]) : ""

		const args = m.body.trim().split(/ +/).slice(1)
		const q = args.join(" ")
		const senderNumber = m.sender.split("@")[0]
		const botNumber = sock.decodeJid(sock.user.id)

		const isMe = botNumber.includes(senderNumber)

		/* Cmd console */
		isCmd ? console.log('> Comando ' + command + ' ejecutado por ' + senderNumber) : false

		/* Cmd in console */
		if (m.body.startsWith('$')) {
			if (!isMe) return
			exec(m.body.slice(1), (err, stdout, stderr) => {
				if (err) return m.reply('- *Error:*\n\n' + err.message)
				if (stdout) return m.reply(stdout)
			})
		}
		
		/* Eval */
		if (m.body.startsWith('>')) {
			if (!isMe) return
			let textTrim = m.body.slice(1).trim()
			try {
				let evaled = await eval('(async() => { ' + textTrim + ' })()')
				if (typeof evaled !== 'string') evaled = util.inspect(evaled)
				await m.reply(evaled)

			} catch (e) {
				m.reply('- *Error:*\n\n' + String(e))
			}
		}

		/* Plugins */
		for (let name in plugins) {
			let plugin = plugins[name]

			if (!plugin || plugin.desactive) continue

			let _arguments = {
				sock,
				v: m.isQuoted ? m.quoted : m,
				plugins,
				plugin,
				name
			}

			let isCommand = isCmd && plugin.prefix ? plugin.command.includes(command) : false

			if (plugin.runCode && typeof plugin.runCode === 'function' && isCommand) {
				try {
					await plugin.runCode.call(this, m, _arguments);
				} catch(e) {
					console.log(`Error en el plugin ${name}: `, e);
				}
			}
		}

	} catch(e) {
		console.log('Error en messages.upsert: ', e);
	}
}
