const { proto, jidDecode, downloadContentFromMessage } = require('baileys')
const fs = require('fs')

const client = (sock) => {
	sock.parseMention = (text = '') => {
		return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
	}
	sock.decodeJid = (jid) => {
		if (!jid) return jid
		if (/:\d+@/gi.test(jid)) {
			let decode = jidDecode(jid) || {}
			return decode.user && decode.server && decode.user + '@' + decode.server || jid
		} else return jid
	}
	sock.getAdmins = async(jids) => {
		let jid;
		if (!jid || !jid.endsWith("@g.us")) return
		let group = await sock.groupMetadata(jid).catch(_ => {})
		let admins = new Array()
		
		for (let user of group.participants) {
			if (user.admin == 'admin' || user.admin == 'superadmin') admins.push(sock.decodeJid(user.id))
		}
		return admins
	}
	sock.bufferMessage = async(m) => {
		const stream = await downloadContentFromMessage(m, m.mimetype.includes('video') ? 'video' : 'image')
		let buffer = Buffer.concat([])
		for await (const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk])
		}
		return buffer
	}
	return sock
}

const sms = async(sock, m) => {
	if (m.key) {
		m.id = m.key.id
		m.isBaileys = m.id.startsWith('3EB0')
		m.chat = m.key.remoteJid
		m.fromMe = m.key.fromMe
		m.isGroup = m.chat.endsWith('@g.us')
		m.sender = m.fromMe ? sock.decodeJid(sock.user.id) : m.isGroup ? m.key.participant : m.key.remoteJid
		if (m.isGroup) {
			let admins = await sock.getAdmins(m.from)
			if (admins) {
				m.isAdmin = admins.includes(m.sender)
				m.isBotAdmin = admins.includes(sock.decodeJid(sock.user.id))
			}
		}
	}
	if (m.message) {
		m.type = Object.keys(m.message)[0]
		m.msg = (m.type == 'viewOnceMessageV2') ? m.message[m.type].message[Object.entries(m.message[m.type].message)[0][0]] : m.message[m.type]
		if (m.msg){
			if (m.type == 'viewOnceMessageV2') {
				m.msg.type = Object.entries(m.message[m.type].message)[0][0]
			}
			let quotedMention = m.msg.contextInfo != null ? m.msg.contextInfo.participant : ''
			let tagMention = m.msg.contextInfo != null ? m.msg.contextInfo.mentionedJid : []
			let mention = typeof(tagMention) == 'string' ? [tagMention] : tagMention
			mention != undefined ? mention.push(quotedMention) : []
			m.mentionUser = mention != undefined ? mention.filter(x => x) : []
			m.body = (m.type == 'conversation') ? m.msg : (m.type == 'extendedTextMessage') ? m.msg.text : (m.type == 'imageMessage') && m.msg.caption ? m.msg.caption : (m.type == 'videoMessage') && m.msg.caption ? m.msg.caption : (m.type == 'templateButtonReplyMessage') && m.msg.selectedId ? m.msg.selectedId : (m.type == 'buttonsResponseMessage') && m.msg.selectedButtonId ? m.msg.selectedButtonId : (m.type == 'listResponseMessage') && m.msg.singleSelectReply.selectedRowId ? m.msg.singleSelectReply.selectedRowId : ''
			m.quoted = m.msg.contextInfo != undefined ? m.msg.contextInfo.quotedMessage : null
			if (m.quoted) {
				m.quoted.type = Object.entries(m.quoted)[0][0]
				m.quoted.id = m.msg.contextInfo.stanzaId
				m.quoted.sender = m.msg.contextInfo.participant
				m.quoted.fromMe = m.quoted.sender.split('@')[0] == sock.user.id.split(':')[0]
				m.quoted.msg = (m.quoted.type == 'viewOnceMessageV2') ? m.quoted[m.quoted.type].message[Object.entries(m.quoted[m.quoted.type].message)[0][0]] : m.quoted[m.quoted.type]
				if (m.quoted.type == 'viewOnceMessageV2') {
					m.quoted.msg.type = Object.entries(m.quoted[m.quoted.type].message)[0][0]
				}
				m.quoted.mentionUser = m.quoted.msg.contextInfo != null ? m.quoted.msg.contextInfo.mentionedJid : []
				m.quoted.fakeObj = proto.WebMessageInfo.fromObject({
					key: {
						remoteJid: m.chat,
						fromMe: m.quoted.fromMe,
						id: m.quoted.id,
						participant: m.quoted.sender
					},
					message: m.quoted
				})
				m.quoted.delete = () => sock.sendMessage(m.chat, { delete: m.quoted.fakeObj.key })
				m.quoted.download = async() => await sock.bufferMessage(m.quoted.msg)
			}
		}
		m.download = async() => await sock.bufferMessage(m.msg)
	}
	m.reply = (teks = '', option = { id: m.chat, mentions: sock.parseMention(teks), quoted: m }) => sock.sendMessage(option.id ? option.id : m.chat, {
		text: teks,
		mentions: option.mentions
	}, {
		quoted: option.quoted ? option.quoted : m
	})
	m.replyImg = (buffer, option = { id: m.chat, caption: '', quoted: m }) => sock.sendMessage(option.id ? option.id : m.chat, {
		image: buffer,
		caption: option.caption
	}, { quoted: option.quoted })
	m.replyVid = (buffer, option = { id: m.chat, caption: '', quoted: m }) => sock.sendMessage(option.id ? option.id : m.chat, {
		video: buffer,
		caption: option.caption
	}, { quoted: option.quoted })
	return m
}

module.exports = { client, sms }
