module.exports = () => {
	name: 'Menú',
	command: 'menu',
	prefix: true,
	models: '%prefix%command',
	desactive: false,
	runCode: async(m, { sock }) => {
		await m.reply('Menu aun no disponible!')
	}
}
