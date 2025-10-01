// RSS News Feed
const rssUrl = 'https://www.wrestlinginc.com/rss/news.xml';
const rssContainer = document.getElementById('rss-feeds');

fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`)
.then(res => res.json())
.then(data => {
    rssContainer.innerHTML = '';
    data.items.slice(0, 6).forEach(item => {
        const article = document.createElement('div');
        article.innerHTML = `
            <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
            <p>${new Date(item.pubDate).toLocaleDateString()}</p>
        `;
        rssContainer.appendChild(article);
    });
})
.catch(err => {
    rssContainer.innerHTML = `<p>Error loading news.</p>`;
    console.error(err);
});

// Wrestlers for Instagram Auto-Update
const wrestlers = [
    { name: 'Roman Reigns', username: 'romanreigns', containerId: 'roman-instagram' },
    { name: 'Sasha Banks', username: 'sashabanks', containerId: 'sasha-instagram' },
    // Add more wrestlers here
];

wrestlers.forEach(wrestler => {
    const container = document.getElementById(wrestler.containerId);
    if (!container) return;

    // Instagram oEmbed
    fetch(`https://graph.facebook.com/v16.0/instagram_oembed?url=https://www.instagram.com/${wrestler.username}/&access_token=YOUR_ACCESS_TOKEN`)
    .then(res => res.json())
    .then(data => {
        const iframe = document.createElement('iframe');
        iframe.src = data.html.match(/src="([^"]+)"/)[1];
        iframe.width = "320";
        iframe.height = "440";
        iframe.frameBorder = "0";
        iframe.scrolling = "no";
        iframe.allowTransparency = true;
        container.appendChild(iframe);
    })
    .catch(err => console.error(`Instagram error for ${wrestler.name}:`, err));
});
