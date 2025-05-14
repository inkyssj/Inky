module.exports =  {
	name: 'Menu',
	command: ['menu', 'menus'],
	prefix: true,
	models: '%prefix%command',
	desactive: false,
	runCode: async(m, { sock }) => {
		const moment = require('moment-timezone')
		const argentinaDate = moment().tz('America/Argentina/Buenos_Aires')
		
		let teks = `> *Inky - Bot*

- *Descripción*.
      *WhatsApp Bot* creado a partir de la *Libreria Baileys*, para automatizar y ayudar al usuario.

- *Informacion*.
      *Pais*: Argentina
      *Fecha*: ${argentinaDate.format('DD/MM/YYYY')}
      *Hora*: ${argentinaDate.format('HH:mm')}hs

- *Comandos*.
      *Prefijo*: -
      *Observación*: Comandos en creación.
`
		await m.reply(teks)
	}
}
