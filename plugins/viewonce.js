module.exports =  {
	name: 'ViewOnceMessage',
	command: ['viewonce', 'viewoncemessage', 'unavista'],
	prefix: true,
	models: '%prefix%command',
	desactive: false,
	runCode: async(m, { sock }) => {
    if (m.quoted) {
      let buffer = await m.quoted.download()
      m.quoted.mimetype.includes('video') ? (await m.replyVid(buffer)) : (await m.replyImg(buffer))
    } else {
      m.reply('Responde a un mensaje para ejecutar')
    }
	}
}
