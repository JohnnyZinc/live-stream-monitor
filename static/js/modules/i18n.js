// i18n模块 - 国际化支持
class I18n {
    constructor() {
        this.currentLanguage = 'zh-CN';
        this.defaultLanguage = 'zh-CN';
        this.fallbackLanguage = 'zh-CN';
        this.resources = {};
        this.supportedLanguages = ['zh-CN', 'en', 'zh-TW', 'ja'];
    }

    // 初始化i18n模块
    async init() {
        // 从URL参数获取语言设置
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        
        // 从localStorage获取语言设置
        const savedLang = localStorage.getItem('language');
        
        // 检测浏览器语言
        const browserLang = navigator.language || navigator.userLanguage;
        
        // 确定使用哪种语言
        let langToUse = this.defaultLanguage;
        if (langParam && this.supportedLanguages.includes(langParam)) {
            langToUse = langParam;
        } else if (savedLang && this.supportedLanguages.includes(savedLang)) {
            langToUse = savedLang;
        } else if (this.supportedLanguages.includes(browserLang)) {
            langToUse = browserLang;
        }
        
        this.currentLanguage = langToUse;
        
        // 保存语言设置到localStorage
        localStorage.setItem('language', this.currentLanguage);
        
        // 加载语言资源
        await this.loadLanguage(this.currentLanguage);
        
        // 如果当前语言不是默认语言，也加载默认语言作为后备
        if (this.currentLanguage !== this.defaultLanguage) {
            await this.loadLanguage(this.defaultLanguage);
        }
        
        return this.currentLanguage;
    }

    // 加载指定语言的资源文件
    async loadLanguage(lang) {
        try {
            const response = await fetch(`/static/js/i18n/${lang}.json`);
            if (response.ok) {
                this.resources[lang] = await response.json();
                console.log(`Language ${lang} loaded successfully`);
            } else {
                console.warn(`Failed to load language file for ${lang}`);
            }
        } catch (error) {
            console.error(`Error loading language ${lang}:`, error);
        }
    }

    // 翻译函数
    t(key, params = {}) {
        // 获取当前语言的翻译
        let translation = this.getTranslation(this.currentLanguage, key);
        
        // 如果当前语言没有翻译，使用默认语言
        if (translation === key && this.currentLanguage !== this.defaultLanguage) {
            translation = this.getTranslation(this.defaultLanguage, key);
        }
        
        // 如果仍然没有找到翻译，返回key本身
        if (translation === key) {
            console.warn(`Missing translation for key: ${key}`);
            return key;
        }
        
        // 处理参数替换
        return this.interpolate(translation, params);
    }

    // 获取指定语言和键的翻译
    getTranslation(lang, key) {
        if (!this.resources[lang]) {
            return key;
        }
        
        const keys = key.split('.');
        let translation = this.resources[lang];
        
        for (const k of keys) {
            if (translation && typeof translation === 'object' && k in translation) {
                translation = translation[k];
            } else {
                return key; // 返回原始键如果找不到翻译
            }
        }
        
        return translation;
    }

    // 参数替换
    interpolate(str, params) {
        if (!params || Object.keys(params).length === 0) {
            return str;
        }
        
        let result = str;
        for (const [key, value] of Object.entries(params)) {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        
        return result;
    }

    // 切换语言
    async switchLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) {
            console.warn(`Language ${lang} is not supported`);
            return false;
        }
        
        this.currentLanguage = lang;
        localStorage.setItem('language', lang);
        
        // 重新加载语言资源
        await this.loadLanguage(lang);
        
        // 触发语言切换事件
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: lang }
        }));
        
        return true;
    }

    // 获取当前语言
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    // 获取支持的语言列表
    getSupportedLanguages() {
        return this.supportedLanguages;
    }
    
    // 获取语言名称
    getLanguageName(langCode) {
        const languageNames = {
            'zh-CN': '简体中文',
            'en': 'English',
            'zh-TW': '繁體中文',
            'ja': '日本語'
        };
        return languageNames[langCode] || langCode;
    }
    
    // 检查语言是否支持
    isLanguageSupported(langCode) {
        return this.supportedLanguages.includes(langCode);
    }
}

// 创建i18n实例并初始化
const i18n = new I18n();

// 将i18n添加到全局作用域
window.i18n = i18n;

// 导出类以支持模块化使用
// export default I18n;