import { fetcher } from '@/lib/coingecko.actions';
import { ExternalLink } from 'lucide-react';

type NewsItem = {
  id: number;
  title: string;
  url: string;
  news_site: string;
  author: string;
  created_at: number;
  thumb_2x: string;
  description: string;
};

async function getCryptoNews(): Promise<NewsItem[]> {
  try {
    const data = await fetcher<{ data: NewsItem[] }>('news', { page: 1, per_page: 40 }, 300);
    return Array.isArray(data.data) ? data.data : [];
  } catch {
    return [];
  }
}

function timeAgo(unixTimestamp: number): string {
  const diff = Math.floor(Date.now() / 1000) - unixTimestamp;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default async function NewsPage() {
  const news = await getCryptoNews();

  return (
    <main className="news-page">
      <div className="main-container">
        <div className="news-page__intro">
          <h1 className="news-page__heading">Crypto News</h1>
          <p className="news-page__sub">Latest news from across the crypto space</p>
        </div>

        {news.length === 0 ? (
          <div className="news-empty">
            <p>No news available right now. Try again shortly.</p>
          </div>
        ) : (
          <div className="news-grid">
            {news.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="news-card"
              >
                {item.thumb_2x && (
                  <div className="news-card__img-wrap">
                    <img
                      src={item.thumb_2x}
                      alt={item.title}
                      className="news-card__img"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="news-card__body">
                  <div className="news-card__meta">
                    <span className="news-card__source">{item.news_site}</span>
                    <span className="news-card__dot">·</span>
                    <span className="news-card__time">{timeAgo(item.created_at)}</span>
                    {item.author && (
                      <>
                        <span className="news-card__dot">·</span>
                        <span className="news-card__time">{item.author}</span>
                      </>
                    )}
                  </div>

                  <h2 className="news-card__title">{item.title}</h2>

                  {item.description && (
                    <p className="news-card__excerpt">
                      {item.description.slice(0, 120).trim()}
                      {item.description.length > 120 ? '…' : ''}
                    </p>
                  )}
                </div>

                <div className="news-card__footer">
                  <ExternalLink size={13} className="news-card__icon" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
