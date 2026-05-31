/**
 * Utility to fetch and parse URL metadata using Microlink API.
 */

const MICROLINK_API = 'https://api.microlink.io/?url=';

export async function fetchUrlMetadata(url) {
  if (!url || !url.startsWith('http')) {
    throw new Error('无效的 URL');
  }

  try {
    const response = await fetch(`${MICROLINK_API}${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('网络请求失败，可能是该网站拒绝了抓取');
    
    const json = await response.json();
    if (json.status !== 'success' || !json.data) {
      throw new Error('无法提取网页数据');
    }

    const { title, description, logo } = json.data;

    return {
      title: title || '',
      description: description || '',
      icon: logo?.url || ''
    };
  } catch (err) {
    console.error('Scraping error:', err);
    throw err;
  }
}
