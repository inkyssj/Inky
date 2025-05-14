module.exports =  {
	name: 'ResendBuffer',
	command: ['resendimg', 'resendvid', 'unavista', 'viewonce', 'viewoncemessage', 'resendbuffer'],
	prefix: true,
	models: '%prefix%command',
	desactive: false,
	runCode: async(m, { sock }) => {
		if (m.quoted) {
			let buffer = await m.quoted.download()
			if (m.quoted.msg.mimetype) m.quoted.msg.mimetype.includes('video') ? (await m.replyVid(buffer)) : (await m.replyImg(buffer))
		} else {
			m.reply('Responde a un mensaje para ejecutar')
		}
	}
}
