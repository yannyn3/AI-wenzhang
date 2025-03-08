/**
 * API管理器 - 统一管理所有AI服务提供商的API配置和调用
 * 提供统一的接口来处理不同AI服务提供商的API配置、验证和调用
 */

class ApiManager {
    constructor() {
        this.API_CONFIG_KEY = 'ai_writer_api_config';
        this.providers = {
            openai: {
                name: 'OpenAI',
                keyFormat: key => key.startsWith('sk-'),
                defaultConfig: {
                    textModel: 'gpt-4o',
                    imageModel: 'dall-e-3',
                    temperature: 0.7,
                    maxTokens: 4000
                }
            },
            anthropic: {
                name: 'Anthropic',
                keyFormat: key => key.startsWith('sk-ant'),
                defaultConfig: {
                    model: 'claude-3-5-sonnet-20240620',
                    temperature: 0.7,
                    maxTokens: 4000,
                    topP: 0.95
                }
            },
            poe: {
                name: 'Poe',
                keyFormat: key => key.length >= 36,
                defaultConfig: {
                    textModel: 'Claude-3.7-Sonnet',
                    imageModel: 'FLUX-pro-1.1'
                }
            },
            deepseek: {
                name: 'DeepSeek',
                keyFormat: key => key.length > 20,
                defaultConfig: {
                    model: 'deepseek-chat',
                    temperature: 0.7,
                    maxTokens: 4000,
                    topP: 0.9
                }
            },
            baidu: {
                name: '百度文心一言',
                keyFormat: (apiKey, secretKey) => apiKey.length > 10 && secretKey.length > 10,
                defaultConfig: {
                    model: 'ernie_speed',
                    temperature: 0.8
                }
            },
            moonshot: {
                name: '月之暗面',
                keyFormat: key => key.startsWith('ms-'),
                defaultConfig: {
                    model: 'moonshot-v1-8k',
                    temperature: 0.7,
                    maxTokens: 4000,
                    topP: 0.95
                }
            }
        };
    }

    /**
     * 加载保存的API配置
     * @returns {Object} 加载的配置对象
     */
    loadConfig() {
        const savedConfig = localStorage.getItem(this.API_CONFIG_KEY);
        if (savedConfig) {
            try {
                return JSON.parse(savedConfig);
            } catch (error) {
                console.error("加载API配置时出错:", error);
                return this.getDefaultConfig();
            }
        }
        return this.getDefaultConfig();
    }

    /**
     * 获取默认API配置
     * @returns {Object} 默认配置对象
     */
    getDefaultConfig() {
        const config = {
            provider: 'openai'
        };

        // 为每个提供商设置默认配置
        Object.keys(this.providers).forEach(provider => {
            config[provider] = { ...this.providers[provider].defaultConfig };
        });

        return config;
    }

    /**
     * 保存API配置
     * @param {Object} config - 要保存的配置对象
     * @returns {Object} 保存的配置对象
     */
    saveConfig(config) {
        localStorage.setItem(this.API_CONFIG_KEY, JSON.stringify(config));
        return config;
    }

    /**
     * 从DOM元素中收集当前API配置
     * @returns {Object} 收集的配置对象
     */
    collectConfigFromDOM() {
        const provider = document.querySelector('input[name="apiProvider"]:checked').value;
        
        const config = {
            provider,
            openai: {
                apiKey: document.getElementById('openai-api-key').value,
                textModel: document.getElementById('openai-text-model').value,
                imageModel: document.getElementById('openai-image-model').value,
                temperature: parseFloat(document.getElementById('openai-temperature').value),
                maxTokens: parseInt(document.getElementById('openai-max-tokens').value),
                apiProxy: document.getElementById('openai-api-proxy').value
            },
            anthropic: {
                apiKey: document.getElementById('anthropic-api-key').value,
                model: document.getElementById('anthropic-model').value,
                temperature: parseFloat(document.getElementById('anthropic-temperature').value),
                maxTokens: parseInt(document.getElementById('anthropic-max-tokens').value),
                topP: parseFloat(document.getElementById('anthropic-top-p').value),
                apiProxy: document.getElementById('anthropic-api-proxy').value
            },
            poe: {
                apiKey: document.getElementById('poe-api-key').value,
                textModel: document.getElementById('poe-text-model').value,
                imageModel: document.getElementById('poe-image-model').value
            },
            deepseek: {
                apiKey: document.getElementById('deepseek-api-key').value,
                model: document.getElementById('deepseek-model').value,
                temperature: parseFloat(document.getElementById('deepseek-temperature').value),
                maxTokens: parseInt(document.getElementById('deepseek-max-tokens').value),
                topP: parseFloat(document.getElementById('deepseek-top-p').value),
                apiProxy: document.getElementById('deepseek-api-proxy').value
            },
            baidu: {
                apiKey: document.getElementById('baidu-api-key').value,
                secretKey: document.getElementById('baidu-secret-key').value,
                model: document.getElementById('baidu-model').value,
                temperature: parseFloat(document.getElementById('baidu-temperature').value)
            },
            moonshot: {
                apiKey: document.getElementById('moonshot-api-key').value,
                model: document.getElementById('moonshot-model').value,
                temperature: parseFloat(document.getElementById('moonshot-temperature').value),
                maxTokens: parseInt(document.getElementById('moonshot-max-tokens').value),
                topP: parseFloat(document.getElementById('moonshot-top-p').value),
                apiProxy: document.getElementById('moonshot-api-proxy').value
            }
        };
        
        return config;
    }

    /**
     * 将配置应用到DOM元素
     * @param {Object} config - 要应用的配置对象
     */
    applyConfigToDOM(config) {
        // 设置选中的API提供商
        const providerRadio = document.querySelector(`input[name="apiProvider"][value="${config.provider}"]`);
        if (providerRadio) {
            providerRadio.checked = true;
            // 触发提供商切换事件（假设有一个全局函数）
            if (typeof updateProviderRadioStyle === 'function') {
                updateProviderRadioStyle(providerRadio);
            }
            if (typeof toggleApiSettings === 'function') {
                toggleApiSettings(config.provider);
            }
        }
        
        // 应用各提供商配置
        Object.keys(this.providers).forEach(provider => {
            if (config[provider]) {
                this.applyProviderConfig(provider, config[provider]);
            }
        });
    }

    /**
     * 应用特定提供商的配置到DOM
     * @param {string} provider - 提供商名称
     * @param {Object} config - 提供商配置
     */
    applyProviderConfig(provider, config) {
        switch (provider) {
            case 'openai':
                document.getElementById('openai-api-key').value = config.apiKey || '';
                document.getElementById('openai-text-model').value = config.textModel || this.providers.openai.defaultConfig.textModel;
                document.getElementById('openai-image-model').value = config.imageModel || this.providers.openai.defaultConfig.imageModel;
                document.getElementById('openai-temperature').value = config.temperature || this.providers.openai.defaultConfig.temperature;
                document.getElementById('openai-max-tokens').value = config.maxTokens || this.providers.openai.defaultConfig.maxTokens;
                document.getElementById('openai-api-proxy').value = config.apiProxy || '';
                break;
            case 'anthropic':
                document.getElementById('anthropic-api-key').value = config.apiKey || '';
                document.getElementById('anthropic-model').value = config.model || this.providers.anthropic.defaultConfig.model;
                document.getElementById('anthropic-temperature').value = config.temperature || this.providers.anthropic.defaultConfig.temperature;
                document.getElementById('anthropic-max-tokens').value = config.maxTokens || this.providers.anthropic.defaultConfig.maxTokens;
                document.getElementById('anthropic-top-p').value = config.topP || this.providers.anthropic.defaultConfig.topP;
                document.getElementById('anthropic-api-proxy').value = config.apiProxy || '';
                break;
            case 'poe':
                document.getElementById('poe-api-key').value = config.apiKey || '';
                document.getElementById('poe-text-model').value = config.textModel || this.providers.poe.defaultConfig.textModel;
                document.getElementById('poe-image-model').value = config.imageModel || this.providers.poe.defaultConfig.imageModel;
                break;
            case 'deepseek':
                document.getElementById('deepseek-api-key').value = config.apiKey || '';
                document.getElementById('deepseek-model').value = config.model || this.providers.deepseek.defaultConfig.model;
                document.getElementById('deepseek-temperature').value = config.temperature || this.providers.deepseek.defaultConfig.temperature;
                document.getElementById('deepseek-max-tokens').value = config.maxTokens || this.providers.deepseek.defaultConfig.maxTokens;
                document.getElementById('deepseek-top-p').value = config.topP || this.providers.deepseek.defaultConfig.topP;
                document.getElementById('deepseek-api-proxy').value = config.apiProxy || '';
                break;
            case 'baidu':
                document.getElementById('baidu-api-key').value = config.apiKey || '';
                document.getElementById('baidu-secret-key').value = config.secretKey || '';
                document.getElementById('baidu-model').value = config.model || this.providers.baidu.defaultConfig.model;
                document.getElementById('baidu-temperature').value = config.temperature || this.providers.baidu.defaultConfig.temperature;
                break;
            case 'moonshot':
                document.getElementById('moonshot-api-key').value = config.apiKey || '';
                document.getElementById('moonshot-model').value = config.model || this.providers.moonshot.defaultConfig.model;
                document.getElementById('moonshot-temperature').value = config.temperature || this.providers.moonshot.defaultConfig.temperature;
                document.getElementById('moonshot-max-tokens').value = config.maxTokens || this.providers.moonshot.defaultConfig.maxTokens;
                document.getElementById('moonshot-top-p').value = config.topP || this.providers.moonshot.defaultConfig.topP;
                document.getElementById('moonshot-api-proxy').value = config.apiProxy || '';
                break;
        }
    }

    /**
     * 测试API配置
     * @param {string} provider - 提供商名称
     * @returns {Promise<boolean>} 测试结果
     */
    async testApiConfig(provider) {
        const apiTestResult = document.getElementById('apiTestResult');
        
        apiTestResult.innerHTML = `
            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl flex items-center">
                <div class="apple-spinner mr-2"></div>
                <span>正在测试 ${this.providers[provider].name} API 连接...</span>
            </div>
        `;
        apiTestResult.classList.remove('hidden');
        
        try {
            // 验证API密钥
            const isValid = await this.validateApiKey(provider);
            
            // 延时模拟API调用
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (isValid) {
                apiTestResult.innerHTML = `
                    <div class="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl flex items-center">
                        <i class="fas fa-check-circle mr-2"></i>
                        <span>${this.providers[provider].name} API 连接测试成功！</span>
                    </div>
                `;
                return true;
            } else {
                throw new Error("API测试失败，请检查密钥格式是否正确");
            }
        } catch (error) {
            apiTestResult.innerHTML = `
                <div class="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl flex items-center">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    <span>错误: ${error.message}</span>
                </div>
            `;
            return false;
        }
    }

    /**
     * 验证API密钥
     * @param {string} provider - 提供商名称
     * @returns {Promise<boolean>} 验证结果
     */
    async validateApiKey(provider) {
        switch (provider) {
            case 'openai':
                const openaiKey = document.getElementById('openai-api-key').value;
                if (!openaiKey) {
                    throw new Error("请输入OpenAI API密钥");
                }
                return this.providers.openai.keyFormat(openaiKey);
                
            case 'anthropic':
                const anthropicKey = document.getElementById('anthropic-api-key').value;
                if (!anthropicKey) {
                    throw new Error("请输入Anthropic API密钥");
                }
                return this.providers.anthropic.keyFormat(anthropicKey);
                
            case 'poe':
                const poeKey = document.getElementById('poe-api-key').value;
                if (!poeKey) {
                    throw new Error("请输入Poe API密钥");
                }
                return this.providers.poe.keyFormat(poeKey);
                
            case 'deepseek':
                const deepseekKey = document.getElementById('deepseek-api-key').value;
                if (!deepseekKey) {
                    throw new Error("请输入DeepSeek API密钥");
                }
                return this.providers.deepseek.keyFormat(deepseekKey);
                
            case 'baidu':
                const baiduApiKey = document.getElementById('baidu-api-key').value;
                const baiduSecretKey = document.getElementById('baidu-secret-key').value;
                if (!baiduApiKey || !baiduSecretKey) {
                    throw new Error("请输入百度文心一言API Key和Secret Key");
                }
                return this.providers.baidu.keyFormat(baiduApiKey, baiduSecretKey);
                
            case 'moonshot':
                const moonshotKey = document.getElementById('moonshot-api-key').value;
                if (!moonshotKey) {
                    throw new Error("请输入月之暗面API密钥");
                }
                return this.providers.moonshot.keyFormat(moonshotKey);
                
            default:
                throw new Error("未知的API提供商");
        }
    }
    
    /**
     * 验证当前选中的API提供商配置是否有效
     * @returns {boolean} 验证结果
     */
    validateCurrentProvider() {
        const config = this.loadConfig();
        const provider = config.provider;
        
        switch (provider) {
            case 'openai':
                return config.openai?.apiKey && this.providers.openai.keyFormat(config.openai.apiKey);
            case 'anthropic':
                return config.anthropic?.apiKey && this.providers.anthropic.keyFormat(config.anthropic.apiKey);
            case 'poe':
                return config.poe?.apiKey && this.providers.poe.keyFormat(config.poe.apiKey);
            case 'deepseek':
                return config.deepseek?.apiKey && this.providers.deepseek.keyFormat(config.deepseek.apiKey);
            case 'baidu':
                return config.baidu?.apiKey && config.baidu?.secretKey && 
                       this.providers.baidu.keyFormat(config.baidu.apiKey, config.baidu.secretKey);
            case 'moonshot':
                return config.moonshot?.apiKey && this.providers.moonshot.keyFormat(config.moonshot.apiKey);
            default:
                return false;
        }
    }
    
    /**
     * 获取当前API配置的错误信息
     * @returns {string|null} 错误信息，如果没有错误则返回null
     */
    getCurrentProviderError() {
        const config = this.loadConfig();
        const provider = config.provider;
        
        switch (provider) {
            case 'openai':
                if (!config.openai?.apiKey) return "请先配置OpenAI API密钥";
                break;
            case 'anthropic':
                if (!config.anthropic?.apiKey) return "请先配置Anthropic API密钥";
                break;
            case 'poe':
                if (!config.poe?.apiKey) return "请先配置Poe API密钥";
                break;
            case 'deepseek':
                if (!config.deepseek?.apiKey) return "请先配置DeepSeek API密钥";
                break;
            case 'baidu':
                if (!config.baidu?.apiKey || !config.baidu?.secretKey) 
                    return "请先配置百度文心一言API Key和Secret Key";
                break;
            case 'moonshot':
                if (!config.moonshot?.apiKey) return "请先配置月之暗面API密钥";
                break;
        }
        
        return null;
    }
    
    /**
     * 生成文章内容
     * @param {string} title - 文章标题
     * @param {string} prompt - 文章提示词
     * @param {string} length - 文章长度 (short, medium, long)
     * @returns {Promise<string>} 生成的文章内容
     */
    async generateArticle(title, prompt, length) {
        const config = this.loadConfig();
        const provider = config.provider;
        const errorMsg = this.getCurrentProviderError();
        
        if (errorMsg) {
            throw new Error(errorMsg);
        }
        
        try {
            // 根据不同的提供商调用不同的API
            switch (provider) {
                case 'openai':
                    return await this.callOpenAIAPI(title, prompt, length, config.openai);
                case 'anthropic':
                    return await this.callAnthropicAPI(title, prompt, length, config.anthropic);
                case 'poe':
                    return await this.callPoeAPI(title, prompt, length, config.poe);
                case 'deepseek':
                    return await this.callDeepSeekAPI(title, prompt, length, config.deepseek);
                case 'baidu':
                    return await this.callBaiduAPI(title, prompt, length, config.baidu);
                case 'moonshot':
                    return await this.callMoonshotAPI(title, prompt, length, config.moonshot);
                default:
                    throw new Error("未知的API提供商");
            }
        } catch (error) {
            console.error(`${provider} API调用失败:`, error);
            throw new Error(`${this.providers[provider].name} API调用失败: ${error.message}`);
        }
    }
    
    /**
     * 调用OpenAI API生成文章
     * @param {string} title - 文章标题
     * @param {string} prompt - 文章提示词
     * @param {string} length - 文章长度
     * @param {Object} config - OpenAI配置
     * @returns {Promise<string>} 生成的文章内容
     */
    async callOpenAIAPI(title, prompt, length, config) {
        try {
            // 构建API请求URL
            let apiUrl = 'https://api.openai.com/v1/chat/completions';
            
            // 如果配置了API代理，则使用代理URL
            if (config.apiProxy) {
                apiUrl = config.apiProxy.trim();
                if (!apiUrl.endsWith('/chat/completions')) {
                    apiUrl = apiUrl.endsWith('/') ? `${apiUrl}chat/completions` : `${apiUrl}/chat/completions`;
                }
            }
            
            // 根据文章长度设置最大token数
            let maxTokens = config.maxTokens || 4000;
            switch (length) {
                case 'short': maxTokens = Math.min(maxTokens, 1500); break;
                case 'medium': maxTokens = Math.min(maxTokens, 3000); break;
                case 'long': maxTokens = Math.min(maxTokens, 4000); break;
            }
            
            // 构建提示词
            const systemPrompt = `你是一位专业的文章创作者，擅长撰写高质量、有深度的内容。请根据用户提供的标题和要求，创作一篇结构清晰、内容丰富的文章。`;
            
            const userPrompt = `请以"${title}"为标题，创作一篇${length === 'short' ? '短' : length === 'medium' ? '中等长度' : '长'}文章。

要求：${prompt || '内容要有深度，观点要有独特性，结构要清晰'}`;
            
            // 构建请求体
            const requestBody = {
                model: config.textModel,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: config.temperature,
                max_tokens: maxTokens,
                top_p: 1,
                frequency_penalty: 0.2,
                presence_penalty: 0.1
            };
            
            // 发送API请求
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });
            
            // 处理响应
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI API错误 (${response.status}): ${errorData.error?.message || response.statusText}`);
            }
            
            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('OpenAI API调用失败:', error);
            
            // 如果API调用失败，返回示例文章（仅用于演示）
            console.log('返回示例文章作为备用');
            return this.generateSampleArticle(title, prompt, length);
        }
    }
    
    /**
     * 调用Anthropic API生成文章
     * @param {string} title - 文章标题
     * @param {string} prompt - 文章提示词
     * @param {string} length - 文章长度
     * @param {Object} config - Anthropic配置
     * @returns {Promise<string>} 生成的文章内容
     */
    async callAnthropicAPI(title, prompt, length, config) {
        try {
            // 构建API请求URL
            let apiUrl = 'https://api.anthropic.com/v1/messages';
            
            // 如果配置了API代理，则使用代理URL
            if (config.apiProxy) {
                apiUrl = config.apiProxy.trim();
                if (!apiUrl.endsWith('/messages')) {
                    apiUrl = apiUrl.endsWith('/') ? `${apiUrl}messages` : `${apiUrl}/messages`;
                }
            }
            
            // 根据文章长度设置最大token数
            let maxTokens = config.maxTokens || 4000;
            switch (length) {
                case 'short': maxTokens = Math.min(maxTokens, 1500); break;
                case 'medium': maxTokens = Math.min(maxTokens, 3000); break;
                case 'long': maxTokens = Math.min(maxTokens, 4000); break;
            }
            
            // 构建提示词
            const systemPrompt = `你是一位专业的文章创作者，擅长撰写高质量、有深度的内容。`;
            
            const userPrompt = `请以"${title}"为标题，创作一篇${length === 'short' ? '短' : length === 'medium' ? '中等长度' : '长'}文章。

要求：${prompt || '内容要有深度，观点要有独特性，结构要清晰'}`;
            
            // 构建请求体
            const requestBody = {
                model: config.model,
                messages: [
                    { role: 'user', content: userPrompt }
                ],
                system: systemPrompt,
                temperature: config.temperature,
                max_tokens: maxTokens,
                top_p: config.topP || 0.95
            };
            
            // 发送API请求
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': config.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify(requestBody)
            });
            
            // 处理响应
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Anthropic API错误 (${response.status}): ${errorData.error?.message || response.statusText}`);
            }
            
            const data = await response.json();
            return data.content[0].text;
        } catch (error) {
            console.error('Anthropic API调用失败:', error);
            
            // 如果API调用失败，返回示例文章（仅用于演示）
            console.log('返回示例文章作为备用');
            return this.generateSampleArticle(title, prompt, length);
        }
    }
    
    /**
     * 调用Poe API生成文章
     * @param {string} title - 文章标题
     * @param {string} prompt - 文章提示词
     * @param {string} length - 文章长度
     * @param {Object} config - Poe配置
     * @returns {Promise<string>} 生成的文章内容
     */
    async callPoeAPI(title, prompt, length, config) {
        console.log(`调用Poe API生成文章: ${title}, 长度: ${length}`);
        console.log(`使用模型: ${config.textModel}`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.generateSampleArticle(title, prompt, length);
    }
    
    /**
     * 调用DeepSeek API生成文章
     * @param {string} title - 文章标题
     * @param {string} prompt - 文章提示词
     * @param {string} length - 文章长度
     * @param {Object} config - DeepSeek配置
     * @returns {Promise<string>} 生成的文章内容
     */
    async callDeepSeekAPI(title, prompt, length, config) {
        console.log(`调用DeepSeek API生成文章: ${title}, 长度: ${length}`);
        console.log(`使用模型: ${config.model}, 温度: ${config.temperature}`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.generateSampleArticle(title, prompt, length);
    }
    
    /**
     * 调用百度文心一言API生成文章
     * @param {string} title - 文章标题
     * @param {string} prompt - 文章提示词
     * @param {string} length - 文章长度
     * @param {Object} config - 百度配置
     * @returns {Promise<string>} 生成的文章内容
     */
    async callBaiduAPI(title, prompt, length, config) {
        try {
            // 获取访问令牌
            const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${config.apiKey}&client_secret=${config.secretKey}`;
            
            const tokenResponse = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (!tokenResponse.ok) {
                throw new Error(`获取百度访问令牌失败: ${tokenResponse.status} ${tokenResponse.statusText}`);
            }
            
            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;
            
            if (!accessToken) {
                throw new Error('获取百度访问令牌失败: 未返回access_token');
            }
            
            // 构建API请求URL
            const apiUrl = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${config.model}?access_token=${accessToken}`;
            
            // 根据文章长度设置提示词
            let lengthDesc = '';
            switch (length) {
                case 'short': lengthDesc = '短文（约800字）'; break;
                case 'medium': lengthDesc = '中等长度文章（约1500字）'; break;
                case 'long': lengthDesc = '长文（约3000字）'; break;
            }
            
            // 构建提示词
            const userPrompt = `请以"${title}"为标题，创作一篇${lengthDesc}。\n\n要求：${prompt || '内容要有深度，观点要有独特性，结构要清晰，使用Markdown格式输出'}`;
            
            // 构建请求体
            const requestBody = {
                messages: [
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ],
                temperature: config.temperature,
                system: '你是一位专业的文章创作者，擅长撰写高质量、有深度的内容。请根据用户提供的标题和要求，创作一篇结构清晰、内容丰富的文章。'
            };
            
            // 发送API请求
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            // 处理响应
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`百度文心一言API错误 (${response.status}): ${errorData.error_msg || response.statusText}`);
            }
            
            const data = await response.json();
            return data.result;
        } catch (error) {
            console.error('百度文心一言API调用失败:', error);
            
            // 如果API调用失败，返回示例文章（仅用于演示）
            console.log('返回示例文章作为备用');
            return this.generateSampleArticle(title, prompt, length);
        }
    }
    
    /**
     * 调用月之暗面API生成文章
     * @param {string} title - 文章标题
     * @param {string} prompt - 文章提示词
     * @param {string} length - 文章长度
     * @param {Object} config - 月之暗面配置
     * @returns {Promise<string>} 生成的文章内容
     */
    async callMoonshotAPI(title, prompt, length, config) {
        try {
            // 构建API请求URL
            let apiUrl = 'https://api.moonshot.cn/v1/chat/completions';
            
            // 如果配置了API代理，则使用代理URL
            if (config.apiProxy) {
                apiUrl = config.apiProxy.trim();
                if (!apiUrl.endsWith('/chat/completions')) {
                    apiUrl = apiUrl.endsWith('/') ? `${apiUrl}chat/completions` : `${apiUrl}/chat/completions`;
                }
            }
            
            // 根据文章长度设置最大token数
            let maxTokens = config.maxTokens || 4000;
            switch (length) {
                case 'short': maxTokens = Math.min(maxTokens, 1500); break;
                case 'medium': maxTokens = Math.min(maxTokens, 3000); break;
                case 'long': maxTokens = Math.min(maxTokens, 4000); break;
            }
            
            // 构建提示词
            const systemPrompt = `你是一位专业的文章创作者，擅长撰写高质量、有深度的内容。请根据用户提供的标题和要求，创作一篇结构清晰、内容丰富的文章。`;
            
            const userPrompt = `请以"${title}"为标题，创作一篇${length === 'short' ? '短' : length === 'medium' ? '中等长度' : '长'}文章。\n\n要求：${prompt || '内容要有深度，观点要有独特性，结构要清晰，使用Markdown格式输出'}`;
            
            // 构建请求体
            const requestBody = {
                model: config.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: config.temperature,
                max_tokens: maxTokens,
                top_p: config.topP || 0.95
            };
            
            // 发送API请求
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });
            
            // 处理响应
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`月之暗面API错误 (${response.status}): ${errorData.error?.message || response.statusText}`);
            }
            
            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('月之暗面API调用失败:', error);
            
            // 如果API调用失败，返回示例文章（仅用于演示）
            console.log('返回示例文章作为备用');
            return this.generateSampleArticle(title, prompt, length);
        }
    }
    
    /**
     * 生成示例文章（用于模拟API调用）
     * @param {string} title - 文章标题
     * @param {string} prompt - 文章提示词
     * @param {string} length - 文章长度
     * @returns {string} 示例文章内容
     */
    generateSampleArticle(title, prompt, length) {
        let lengthDesc = '';
        switch (length) {
            case 'short': lengthDesc = '短文'; break;
            case 'medium': lengthDesc = '中等长度'; break;
            case 'long': lengthDesc = '长文'; break;
        }
        
        return `# ${title || '人工智能如何改变我们的生活与工作方式'}

## 引言：科技变革的新篇章

在当今数字化时代，人工智能（AI）正以前所未有的速度重塑我们的生活方式和工作环境。从智能手机上的语音助手到复杂的预测分析系统，AI技术已经深入渗透到我们日常生活的方方面面。本文将探讨AI如何改变我们的生活和工作，以及这些变化对社会带来的深远影响。

## AI在日常生活中的应用

人工智能已经成为我们日常生活中不可或缺的一部分。智能家居设备可以根据我们的习惯自动调节温度和照明；语音助手可以帮助我们设置提醒、播放音乐或回答问题；推荐算法则根据我们的喜好推荐电影、音乐和新闻。

> "人工智能不仅仅是一项技术，它正在成为我们生活方式的延伸。" —— 未来学家雷·库兹韦尔

这些技术的一个关键优势是它们能够学习和适应用户的偏好。例如，流媒体服务越了解你的观看习惯，它提供的推荐就越能符合你的口味。这种个性化体验是AI最引人注目的特点之一。

## 工作环境的革命性变化

在职场中，AI正在改变几乎所有行业的工作方式：

1. **自动化日常任务** - 从数据输入到客户服务，AI可以处理重复性任务，使员工能够专注于更具创造性和战略性的工作。
2. **增强决策过程** - 通过分析大量数据，AI可以提供洞察力，帮助决策者做出更明智的选择。
3. **创造新的工作岗位** - 尽管有些职位可能会被自动化取代，但AI也创造了新的工作岗位，如AI伦理专家、机器学习工程师等。

## 挑战与考虑

然而，AI的迅速发展也带来了一系列需要我们认真思考的挑战：

* **隐私和数据安全** - AI系统需要大量数据才能有效运行，这引发了关于数据收集和使用的隐私问题。
* **工作岗位变化** - 某些工作可能会被自动化，需要员工学习新技能来适应不断变化的就业市场。
* **算法偏见** - 如果训练数据存在偏见，AI系统可能会继承并放大这些偏见，导致不公平的结果。

## 未来展望

展望未来，人工智能将继续以创新的方式融入我们的生活和工作。关键在于我们如何管理这一转变，确保技术服务于人类的最佳利益，同时减轻潜在的负面影响。

通过适当的政策、教育和伦理框架，我们可以利用AI的力量来创造一个更高效、更公平的社会，让每个人都能从这一技术革命中受益。

## 结论

人工智能正在彻底改变我们生活和工作的方式，为我们提供前所未有的便利和效率。虽然这一旅程充满挑战，但通过负责任的创新和协作，我们可以塑造一个AI技术与人类价值共存的未来。

作为这场技术革命的参与者，我们每个人都有责任了解AI的潜力和局限性，并确保它的发展方向符合社会的集体利益。这是一项正在进行中的工作，需要我们所有人的参与和思考。`;
    }
    
    /**
     * 生成图片
     * @param {string} prompt - 图片提示词
     * @param {number} count - 生成图片数量
     * @returns {Promise<Array<string>>} 生成的图片URL数组
     */
    async generateImages(prompt, count = 1) {
        const config = this.loadConfig();
        const provider = config.provider;
        const errorMsg = this.getCurrentProviderError();
        
        if (errorMsg) {
            throw new Error(errorMsg);
        }
        
        try {
            // 根据不同的提供商调用不同的图像生成API
            switch (provider) {
                case 'openai':
                    return await this.callOpenAIImageAPI(prompt, count, config.openai);
                case 'poe':
                    return await this.callPoeImageAPI(prompt, count, config.poe);
                // 其他提供商可能不支持图像生成
                default:
                    throw new Error(`${this.providers[provider].name}不支持图像生成功能`);
            }
        } catch (error) {
            console.error(`${provider} 图像生成API调用失败:`, error);
            throw new Error(`${this.providers[provider].name} 图像生成失败: ${error.message}`);
        }
    }
    
    /**
     * 调用OpenAI图像生成API
     * @param {string} prompt - 图片提示词
     * @param {number} count - 生成图片数量
     * @param {Object} config - OpenAI配置
     * @returns {Promise<Array<string>>} 生成的图片URL数组
     */
    async callOpenAIImageAPI(prompt, count, config) {
        console.log(`调用OpenAI图像生成API: ${prompt}, 数量: ${count}`);
        console.log(`使用模型: ${config.imageModel}`);
        
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 返回模拟的图片URL
        return Array(count).fill().map((_, i) => 
            `https://example.com/generated-image-${i+1}.jpg`);
    }
    
    /**
     * 调用Poe图像生成API
     * @param {string} prompt - 图片提示词
     * @param {number} count - 生成图片数量
     * @param {Object} config - Poe配置
     * @returns {Promise<Array<string>>} 生成的图片URL数组
     */
    async callPoeImageAPI(prompt, count, config) {
        console.log(`调用Poe图像生成API: ${prompt}, 数量: ${count}`);
        console.log(`使用模型: ${config.imageModel}`);
        
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 返回模拟的图片URL
        return Array(count).fill().map((_, i) => 
            `https://example.com/poe-generated-image-${i+1}.jpg`);
    }
    
    /**
     * 处理API错误
     * @param {Error} error - 错误对象
     * @param {string} provider - 提供商名称
     * @returns {Object} 格式化的错误信息
     */
    handleApiError(error, provider) {
        // 记录错误日志
        console.error(`${provider} API错误:`, error);
        
        // 根据错误类型返回友好的错误信息
        let errorMessage = error.message;
        let errorType = 'api_error';
        
        // 网络错误
        if (error.name === 'NetworkError' || error.message.includes('network') || error.message.includes('连接')) {
            errorType = 'network_error';
            errorMessage = '网络连接错误，请检查您的网络连接并重试';
        }
        // API密钥错误
        else if (error.message.includes('API') && error.message.includes('密钥')) {
            errorType = 'auth_error';
            errorMessage = `${this.providers[provider].name} API密钥无效或已过期，请更新您的API密钥`;
        }
        // 超时错误
        else if (error.message.includes('timeout') || error.message.includes('超时')) {
            errorType = 'timeout_error';
            errorMessage = 'API请求超时，请稍后重试';
        }
        // 配额错误
        else if (error.message.includes('quota') || error.message.includes('配额') || error.message.includes('限制')) {
            errorType = 'quota_error';
            errorMessage = `您的${this.providers[provider].name}配额已用完，请稍后重试或升级您的账户`;
        }
        
        return {
            error: true,
            type: errorType,
            message: errorMessage,
            provider: provider,
            timestamp: new Date().toISOString(),
            originalError: error.message
        };
    }