// 文章生成机器人 - 前端逻辑

const { createApp, ref, reactive, onMounted, computed } = Vue;

const app = createApp({
  setup() {
    // API配置
    const apiConfig = reactive({
      model: 'openai',
      apiKey: '',
      endpoint: ''
    });
    
    // 模型选项
    const modelOptions = ref([]);
    
    // API状态
    const apiStatus = ref('');
    
    // 参考资料
    const references = ref([]);
    
    // 生成配置
    const generateConfig = reactive({
      articlePrompt: '',
      imagePrompt: '',
      style: 'popular',
      length: 'medium',
      theme: 'modern'
    });
    
    // 生成状态
    const isGenerating = ref(false);
    
    // 生成结果
    const generatedContent = ref('');
    const generatedHtml = ref('');
    
    // 初始化
    onMounted(async () => {
      // 加载API配置
      loadApiConfig();
      
      // 获取模型选项
      try {
        const response = await axios.get('/api/config');
        modelOptions.value = response.data.models;
      } catch (error) {
        showToast('错误', '获取API配置失败');
      }
    });
    
    // 加载API配置
    const loadApiConfig = () => {
      const savedConfig = localStorage.getItem('apiConfig');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        apiConfig.model = config.model || 'openai';
        apiConfig.apiKey = config.apiKey || '';
        apiConfig.endpoint = config.endpoint || '';
      }
    };
    
    // 保存API配置
    const saveApiConfig = () => {
      localStorage.setItem('apiConfig', JSON.stringify(apiConfig));
    };
    
    // 验证API密钥
    const validateApiKey = async () => {
      if (!apiConfig.apiKey) {
        showToast('错误', 'API密钥不能为空');
        return;
      }
      
      try {
        const response = await axios.post('/api/validate', {
          apiModel: apiConfig.model,
          apiKey: apiConfig.apiKey,
          secretKey: ''
        });
        
        if (response.data.isValid) {
          apiStatus.value = 'valid';
          saveApiConfig();
          showToast('成功', 'API配置有效');
        } else {
          apiStatus.value = 'invalid';
          showToast('错误', 'API配置无效');
        }
      } catch (error) {
        apiStatus.value = 'invalid';
        showToast('错误', '验证API时出错');
      }
    };
    
    // 添加参考资料输入
    const addReferenceInput = (type) => {
      references.value.push({
        type,
        content: '',
        url: ''
      });
    };
    
    // 移除参考资料
    const removeReference = (index) => {
      references.value.splice(index, 1);
    };
    
    // 显示文件上传
    const showFileUpload = () => {
      document.getElementById('fileUpload').click();
    };
    
    // 处理文件上传
    const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        references.value.push({
          type: 'file',
          content: response.data.content,
          fileName: file.name
        });
        
        // 清空文件输入
        event.target.value = '';
      } catch (error) {
        showToast('错误', '上传文件失败');
      }
    };
    
    // 从URL采集内容
    const scrapeContent = async (index) => {
      const reference = references.value[index];
      if (!reference.url) {
        showToast('错误', 'URL不能为空');
        return;
      }
      
      try {
        const response = await axios.post('/api/scrape', {
          url: reference.url
        });
        
        reference.content = response.data.content;
        showToast('成功', '内容采集成功');
      } catch (error) {
        showToast('错误', '采集内容失败');
      }
    };
    
    // 生成文章
    const generateArticle = async () => {
      // 检查API配置
      if (!apiConfig.apiKey) {
        showToast('错误', '请先配置API密钥');
        return;
      }
      
      // 检查参考资料
      const referenceContents = references.value
        .filter(ref => ref.content)
        .map(ref => ref.content);
      
      if (referenceContents.length === 0) {
        showToast('错误', '请至少添加一篇参考资料');
        return;
      }
      
      // 构建提示词
      let prompt = generateConfig.articlePrompt || '生成一篇原创文章';
      
      // 添加风格要求
      switch (generateConfig.style) {
        case 'professional':
          prompt += '，风格专业学术，使用专业术语和引用';
          break;
        case 'popular':
          prompt += '，风格通俗易懂，适合大众阅读';
          break;
        case 'story':
          prompt += '，以故事叙述的方式展开';
          break;
        case 'news':
          prompt += '，采用新闻报道的客观风格';
          break;
        case 'tutorial':
          prompt += '，以教程指南的形式，包含步骤和说明';
          break;
      }
      
      // 添加长度要求
      switch (generateConfig.length) {
        case 'short':
          prompt += '，长度约500字';
          break;
        case 'medium':
          prompt += '，长度约1000字';
          break;
        case 'long':
          prompt += '，长度约2000字';
          break;
        case 'comprehensive':
          prompt += '，长度3000字以上，内容详尽';
          break;
      }
      
      isGenerating.value = true;
      
      try {
        const response = await axios.post('/api/generate', {
          apiModel: apiConfig.model,
          apiKey: apiConfig.apiKey,
          model: getSelectedModel(),
          prompt: prompt,
          references: referenceContents,
          theme: generateConfig.theme
        });
        
        generatedContent.value = response.data.content;
        generatedHtml.value = response.data.html;
        
        // 滚动到结果区域
        setTimeout(() => {
          document.querySelector('#resultTabs').scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } catch (error) {
        showToast('错误', `生成文章失败: ${error.response?.data?.error || error.message}`);
      } finally {
        isGenerating.value = false;
      }
    };
    
    // 获取选中的模型
    const getSelectedModel = () => {
      const selectedModelOption = modelOptions.value.find(m => m.id === apiConfig.model);
      return selectedModelOption ? selectedModelOption.models[0] : null;
    };
    
    // 复制内容
    const copyContent = (type) => {
      let content = '';
      
      if (type === 'markdown') {
        content = generatedContent.value;
      } else if (type === 'html') {
        content = generatedHtml.value;
      }
      
      navigator.clipboard.writeText(content)
        .then(() => {
          showToast('成功', `已复制${type === 'markdown' ? 'Markdown' : 'HTML'}内容到剪贴板`);
        })
        .catch(() => {
          showToast('错误', '复制失败');
        });
    };
    
    // 显示提示消息
    const showToast = (title, message) => {
      const toastEl = document.getElementById('toast');
      const titleEl = document.getElementById('toast-title');
      const messageEl = document.getElementById('toast-message');
      
      titleEl.textContent = title;
      messageEl.textContent = message;
      
      const toast = new bootstrap.Toast(toastEl);
      toast.show();
    };
    
    return {
      apiConfig,
      modelOptions,
      apiStatus,
      references,
      generateConfig,
      isGenerating,
      generatedContent,
      generatedHtml,
      validateApiKey,
      addReferenceInput,
      removeReference,
      showFileUpload,
      handleFileUpload,
      scrapeContent,
      generateArticle,
      copyContent
    };
  }
});

app.mount('#app');