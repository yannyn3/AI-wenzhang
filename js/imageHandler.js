// 文章生成机器人 - 图片处理模块

const ImageHandler = {
  // 从URL采集图片
  async scrapeImages(url) {
    try {
      const response = await axios.post('/api/scrape-images', { url });
      return response.data.images;
    } catch (error) {
      console.error('采集图片错误:', error);
      throw new Error('采集图片失败');
    }
  },
  
  // 根据提示词生成图片
  async generateImages(prompt, apiModel, apiKey, count = 1) {
    try {
      const response = await axios.post('/api/generate-images', {
        prompt,
        apiModel,
        apiKey,
        count
      });
      return response.data.images;
    } catch (error) {
      console.error('生成图片错误:', error);
      throw new Error('生成图片失败');
    }
  },
  
  // 处理图片插入到文章中
  insertImagesToArticle(html, images, distribution = 'even') {
    if (!images || images.length === 0) return html;
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const paragraphs = doc.querySelectorAll('p');
    
    if (paragraphs.length === 0) return html;
    
    // 根据分布方式插入图片
    switch (distribution) {
      case 'even': // 均匀分布
        this.distributeImagesEvenly(paragraphs, images);
        break;
      case 'top': // 顶部集中
        this.distributeImagesAtTop(paragraphs, images);
        break;
      case 'random': // 随机分布
        this.distributeImagesRandomly(paragraphs, images);
        break;
      default:
        this.distributeImagesEvenly(paragraphs, images);
    }
    
    return doc.body.innerHTML;
  },
  
  // 均匀分布图片
  distributeImagesEvenly(paragraphs, images) {
    const interval = Math.floor(paragraphs.length / (images.length + 1));
    
    images.forEach((image, index) => {
      const position = (index + 1) * interval;
      if (position < paragraphs.length) {
        const imgElement = document.createElement('img');
        imgElement.src = image.url;
        imgElement.alt = image.alt || '文章配图';
        imgElement.className = 'article-image';
        
        paragraphs[position].parentNode.insertBefore(imgElement, paragraphs[position]);
      }
    });
  },
  
  // 顶部集中分布图片
  distributeImagesAtTop(paragraphs, images) {
    images.forEach((image, index) => {
      if (index < Math.min(3, paragraphs.length)) {
        const imgElement = document.createElement('img');
        imgElement.src = image.url;
        imgElement.alt = image.alt || '文章配图';
        imgElement.className = 'article-image';
        
        paragraphs[index].parentNode.insertBefore(imgElement, paragraphs[index]);
      }
    });
  },
  
  // 随机分布图片
  distributeImagesRandomly(paragraphs, images) {
    const usedPositions = new Set();
    
    images.forEach(image => {
      let position;
      do {
        position = Math.floor(Math.random() * paragraphs.length);
      } while (usedPositions.has(position));
      
      usedPositions.add(position);
      
      const imgElement = document.createElement('img');
      imgElement.src = image.url;
      imgElement.alt = image.alt || '文章配图';
      imgElement.className = 'article-image';
      
      paragraphs[position].parentNode.insertBefore(imgElement, paragraphs[position]);
    });
  }
};