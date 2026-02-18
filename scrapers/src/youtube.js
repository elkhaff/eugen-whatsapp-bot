const axios = require("axios");
const cheerio = require("cheerio");
const { api } = require("../../settings");

class YouTubeUtility {
  search = async function search(query) {
    try {
      const response = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`);
      const $ = cheerio.load(response.data);

      let parseSearch;
      $('script').each((_, script) => {
        const scriptContent = script.children?.[0]?.data;
        if (scriptContent?.includes('var ytInitialData = ')) {
          parseSearch = JSON.parse(scriptContent.split('var ytInitialData = ')[1].replace(/;/g, ''));
        }
      });

      if (!parseSearch) throw new Error("Failed to parse YouTube search results.");

      const searchContents = parseSearch.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents;
      const searchResults = searchContents.length === 2
        ? searchContents[0].itemSectionRenderer.contents
        : searchContents[1].itemSectionRenderer.contents;

      const resultsArray = searchResults.map((result) => {
        const videoData = result.videoRenderer;
        if (!videoData) return null;

        const isLive = videoData.badges?.some((badge) => /live/i.test(badge.metadataBadgeRenderer.label));

        const processedResult = {
          videoId: videoData.videoId,
          url: `https://www.youtube.com${videoData.navigationEndpoint.commandMetadata.webCommandMetadata.url}`,
          title: videoData.title.runs[0].text,
          description: videoData.detailedMetadataSnippets?.[0]?.snippetText.runs[0].text || 'Unknown',
          thumbnail: (videoData.thumbnail.thumbnails[1] || videoData.thumbnail.thumbnails[0]).url || 'https://telegra.ph/file/355e8ae7da2299a554eba.jpg',
          duration: videoData.thumbnailOverlays?.[0]?.thumbnailOverlayTimeStatusRenderer?.text.simpleText.replace(/\./gi, ':') || 'Unknown',
          uploaded: videoData.publishedTimeText?.simpleText || 'Unknown',
          views: videoData.viewCountText?.simpleText,
          isLive,
          author: {
            name: videoData.ownerText.runs[0].text,
            url: `https://www.youtube.com${videoData.ownerText.runs[0].navigationEndpoint.commandMetadata?.webCommandMetadata?.url}`,
          },
        };

        if (isLive) {
          delete processedResult.duration;
          delete processedResult.uploaded;
          delete processedResult.views;
        }

        return processedResult;
      }).filter(Boolean);

      return resultsArray;
    } catch (e) {
      console.error(e);
      throw new Error("An error occurred while searching YouTube.");
    }
  };
    
  download = async function download(url, type = "mp3", quality = "480") {
    try {
      const isVideo = type.toLowerCase() === "mp4";
      const endpoint = isVideo
        ? `${api.base}/api/download/ytmp4?url=${encodeURIComponent(url)}&quality=${encodeURIComponent(quality)}&apikey=${encodeURIComponent(api.key)}`
        : `${api.base}/api/download/ytmp3?url=${encodeURIComponent(url)}&apikey=${encodeURIComponent(api.key)}`;

      const response = await axios.get(endpoint);
      return response.data;
    } catch (e) {
      return { success: false, msg: e.message };
    }
  };

  getMediaDetails = async function (url) {
    if (!url) return { size: "Unknown", url: null };
    return {
      size: await this.getFileSize(url),
      url: await this.getBuffer(url)
    };
  };

  getFileSize = async function (url) {
    try {
      const response = await axios.head(url);
      const sizeInBytes = response.headers['content-length'];
      return sizeInBytes ? (sizeInBytes / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown';
    } catch (error) {
      console.error("Get Size Error: ", error);
      return 'Unknown';
    }
  };

  getBuffer = async function (url) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    } catch (error) {
      console.error("Get Buffer Error: ", error);
      return null;
    }
  };
}

module.exports = new YouTubeUtility();