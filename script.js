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

// Auto-load latest Instagram posts for wrestlers
const wrestlers = [
    { name: 'Roman Reigns', username: 'romanreigns', containerId: 'roman-instagram' },
    { name: 'Sasha Banks', username: 'sashabanks', containerId: 'sasha-instagram' },
    // Add more wrestlers here
];

wrestlers.forEach(wrestler => {
    const container = document.getElementById(wrestler.containerId);
    if (!container) return;

    // Fetch the latest post using Instagram oEmbed
    const url = `https://www.instagram.com/${wrestler.username}/?__a=1`;
    
    fetch(url)
        .then(res => res.json())
        .then(data => {
            // Instagram JSON structure changed often; fallback to user feed
            const latestPost = data.graphql.user.edge_owner_to_timeline_media.edges[0].node;
            const postUrl = `https://www.instagram.com/p/${latestPost.shortcode}/`;
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.instagram.com/p/${latestPost.shortcode}/embed`;
            iframe.width = "320";
            iframe.height = "440";
            iframe.frameBorder = "0";
            iframe.scrolling = "no";
            iframe.allowTransparency = true;
            container.appendChild(iframe);
        })
        .catch(err => console.error(`Error loading Instagram for ${wrestler.name}:`, err));
});
