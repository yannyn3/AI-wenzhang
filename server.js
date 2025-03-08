const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 配置中间件
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// API路由

// 获取API配置
app.get('/api/config', (req, res) => {
  res.json({
    models: [
      { id: 'openai', name: 'OpenAI GPT-4', endpoint: 'https://api.openai.com/v1', models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
      { id: 'azure', name: 'Azure OpenAI', endpoint: 'https://your-resource.openai.azure.com', models: ['gpt-4', 'gpt-35-turbo'] },
      { id: 'anthropic', name: 'Anthropic Claude', endpoint: 'https://api.anthropic.com', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-2.1'] },
      { id: 'gemini', name: 'Google Gemini', endpoint: 'https://generativelanguage.googleapis.com', models: ['gemini-1.5-pro', 'gemini-1.5', 'gemini-pro'] }
    ]
  });
});

// 验证API密钥
app.post('/api/validate', async (req, res) => {
  const { apiModel, apiKey, secretKey } = req.body;
  
  try {
    let isValid = false;
    
    switch(apiModel) {
      case 'openai':
        try {
          const response = await axios.get('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`
            }
          });
          isValid = response.status === 200;
        } catch (error) {
          isValid = false;
        }
        break;
        
      case 'anthropic':
        try {
          const response = await axios.get('https://api.anthropic.com/v1/models', {
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01'
            }
          });
          isValid = response.status === 200;
        } catch (error) {
          isValid = false;
        }
        break;
        
      case 'gemini':
        try {
          const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          isValid = response.status === 200;
        } catch (error) {
          isValid = false;
        }
        break;
        
      default:
        isValid = false;
    }
    
    res.json({ isValid });
  } catch (error) {
    console.error('API验证错误:', error);
    res.status(500).json({ error: '验证API时出错', isValid: false });
  }
});

// 从URL采集内容
app.post('/api/scrape', async (req, res) => {
  const { url } = req.body;
  
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // 移除不需要的元素
    $('script, style, iframe, img').remove();
    
    // 提取标题
    const title = $('title').text() || $('h1').first().text() || '';
    
    // 提取正文内容
    let content = '';
    $('p, h1, h2, h3, h4, h5, h6, li').each((i, el) => {
      const text = $(el).text().trim();
      if (text) {
        content += text + '\n\n';
      }
    });
    
    res.json({ title, content });
  } catch (error) {
    console.error('采集内容错误:', error);
    res.status(500).json({ error: '采集内容时出错' });
  }
});

// 上传文件
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    res.json({ content: fileContent });
    
    // 清理上传的文件
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({ error: '处理上传文件时出错' });
  }
});

// 生成文章
app.post('/api/generate', async (req, res) => {
  const { apiModel, apiKey, model, prompt, references, theme } = req.body;
  
  try {
    let generatedContent = '';
    
    // 构建提示词
    const fullPrompt = `
      请根据以下参考资料，生成一篇原创文章。
      
      参考资料:
      ${references.join('\n\n')}
      
      要求:
      ${prompt || '生成一篇有深度、有见解的原创文章，语言流畅自然，逻辑清晰。'}
    `;
    
    switch(apiModel) {
      case 'openai':
        try {
          const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: model || 'gpt-4',
            messages: [
              {
                role: 'system',
                content: '你是一个专业的文章写作助手，擅长根据参考资料生成高质量的原创文章。'
              },
              {
                role: 'user',
                content: fullPrompt
              }
            ],
            temperature: 0.7
          }, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          generatedContent = response.data.choices[0].message.content;
        } catch (error) {
          throw new Error(`OpenAI API错误: ${error.message}`);
        }
        break;
        
      case 'anthropic':
        try {
          const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: model || 'claude-3-opus',
            messages: [
              {
                role: 'user',
                content: fullPrompt
              }
            ],
            max_tokens: 4000
          }, {
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json'
            }
          });
          
          generatedContent = response.data.content[0].text;
        } catch (error) {
          throw new Error(`Anthropic API错误: ${error.message}`);
        }
        break;
        
      case 'gemini':
        try {
          const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-pro'}:generateContent?key=${apiKey}`, {
            contents: [
              {
                parts: [
                  {
                    text: fullPrompt
                  }
                ]
              }
            ]
          });
          
          generatedContent = response.data.candidates[0].content.parts[0].text;
        } catch (error) {
          throw new Error(`Gemini API错误: ${error.message}`);
        }
        break;
        
      default:
        throw new Error('不支持的API模型');
    }
    
    // 格式化文章为HTML
    const formattedContent = formatArticleToHtml(generatedContent, theme || 'modern');
    
    res.json({ content: generatedContent, html: formattedContent });
  } catch (error) {
    console.error('生成文章错误:', error);
    res.status(500).json({ error: `生成文章时出错: ${error.message}` });
  }
});

// 格式化文章为微信公众号HTML
function formatArticleToHtml(content, theme = 'modern') {
  // 分割段落
  const paragraphs = content.split('\n').filter(p => p.trim() !== '');
  
  let html = '';
  
  // 处理每个段落
  paragraphs.forEach(paragraph => {
    // 检查是否为标题
    if (paragraph.startsWith('# ')) {
      html += `<h1>${paragraph.substring(2)}</h1>\n`;
    } else if (paragraph.startsWith('## ')) {
      html += `<h2>${paragraph.substring(3)}</h2>\n`;
    } else if (paragraph.startsWith('### ')) {
      html += `<h3>${paragraph.substring(4)}</h3>\n`;
    } else if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
      // 处理列表项
      html += `<ul>\n<li>${paragraph.substring(2)}</li>\n</ul>\n`;
    } else if (/^\d+\.\s/.test(paragraph)) {
      // 处理有序列表
      const listText = paragraph.replace(/^\d+\.\s/, '');
      html += `<ol>\n<li>${listText}</li>\n</ol>\n`;
    } else {
      // 普通段落
      html += `<p>${paragraph}</p>\n`;
    }
  });
  
  // 添加主题样式
  const styledHtml = `
  <div class="theme-${theme}">
    ${html}
  </div>
  `;
  
  return styledHtml;
}

// 从URL采集图片
app.post('/api/scrape-images', async (req, res) => {
  const { url } = req.body;
  
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    const images = [];
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      const alt = $(el).attr('alt') || '';
      
      if (src && src.match(/^https?:\/\//)) {
        images.push({
          url: src,
          alt: alt
        });
      }
    });
    
    res.json({ images });
  } catch (error) {
    console.error('采集图片错误:', error);
    res.status(500).json({ error: '采集图片时出错' });
  }
});

// 生成图片
app.post('/api/generate-images', async (req, res) => {
  const { prompt, apiModel, apiKey, count } = req.body;
  
  try {
    let images = [];
    
    switch(apiModel) {
      case 'openai':
        try {
          const response = await axios.post('https://api.openai.com/v1/images/generations', {
            prompt: prompt,
            n: count || 1,
            size: '1024x1024',
            response_format: 'url'
          }, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          images = response.data.data.map(img => ({
            url: img.url,
            alt: prompt
          }));
        } catch (error) {
          throw new Error(`OpenAI 图片生成错误: ${error.message}`);
        }
        break;
        
      case 'gemini':
        // 注意：Gemini目前不支持图片生成，这里仅作为示例
        throw new Error('Gemini目前不支持图片生成');
        break;
        
      default:
        throw new Error('不支持的API模型');
    }
    
    res.json({ images });
  } catch (error) {
    console.error('生成图片错误:', error);
    res.status(500).json({ error: `生成图片时出错: ${error.message}` });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});