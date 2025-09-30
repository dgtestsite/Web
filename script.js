const rssUrl = 'https://www.wrestlinginc.com/rss/news.xml';
const rssContainer = document.getElementById('rss-feeds');

fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`)
    .then(res => res.json())
    .then(data => {
        rssContainer.innerHTML = '';
        data.items.slice(0, 5).forEach(item => {
            const article = document.createElement('div');
            article.innerHTML = `
                <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
                <p>${item.pubDate}</p>
            `;
            rssContainer.appendChild(article);
        });
    })
    .catch(err => {
        rssContainer.innerHTML = `<p>Error loading news.</p>`;
        console.error(err);
    });
