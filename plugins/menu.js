module.exports = () => {
	name = 'Menú',
	command = ['menu', 'menus'],
	prefix = true,
	models = '%prefix%command',
	desactive = false,
	runCode  = async(m, { sock }) => {
		await m.reply('Menu aun no disponible!')
	}
}
