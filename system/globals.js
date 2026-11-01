// Safe defaults so commands never crash if the "auto" plugin has not run yet
if (!Array.prototype.random) {
  Object.defineProperty(Array.prototype, 'random', {
    value() { return this[Math.floor(Math.random() * this.length)]; },
    enumerable: false, writable: true, configurable: true
  });
}

global.reply_status ||= {
  key: { participant: '212620847586@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false },
  message: {
    contactMessage: {
      displayName: '꧁リヴァイ꧂',
      vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:꧁リヴァイ꧂\nitem1.TEL;waid=212620847586:212620847586\nEND:VCARD'
    }
  },
  participant: '0@s.whatsapp.net'
};
