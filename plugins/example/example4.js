const example = async (m, { conn }) => {

await conn.sendCarousel(m.chat, {
  headerText: '📸 Image Gallery',
  globalFooterText: 'Swipe to see more →',
  cards: [
    {
      imageUrl: global.IMG.profile,
      bodyText: '*Anime Girl 1*',
      footerText: '🌸 Cute anime style',
      buttons: [
        { name: 'quick_reply', params: { display_text: '👍 Like', id: 'like1' } },
        { name: 'cta_url', params: { display_text: '🔗 Download', url: 'https://example.com/img1' } }
      ]
    },
    {
      imageUrl: global.IMG.profile,
      bodyText: '*Anime Girl 2*',
      footerText: '✨ Beautiful character',
      buttons: [
        { name: 'quick_reply', params: { display_text: '❤️ Love', id: 'love2' } },
        { name: 'cta_copy', params: { display_text: '📋 Copy URL', copy_code: 'https://example.com/img2' } }
      ]
    },
{
      mediaUrl: 'https://qu.ax/x/6GwxA.mp4',
      mediaType: 'video',
      bodyText: 'Intro Video',
      buttons: [
        { name: 'cta_url', params: { display_text: 'Details', url: 'https://example.com/details' } }
      ]
    },
    {
      imageUrl: global.IMG.profile,
      bodyText: '*Anime Girl 3*',
      footerText: '🎨 Amazing artwork',
      buttons: [
        { 
          name: 'single_select', 
          params: { 
            title: '📁 More Options',
            sections: [{
              title: 'Choose action',
              rows: [
                { title: 'Save to gallery', id: 'save3' },
                { title: 'Share with friend', id: 'share3' },
                { title: 'Report image', id: 'report3' }
              ]
            }]
          } 
        }
      ]
    }
  ],
  mentions: [m.sender],
  newsletter: {
      name: '𝙉𝙀𝙓𝘼 ~ 𝐂𝐡𝐚𝐧𝐧𝐞𝐥 🕷️',
      jid: '120363225356834044@newsletter'
    },
}, m)

};
example.usage = ["تست4"]
example.category = "example";
example.command = ["تست4"]
export default example;