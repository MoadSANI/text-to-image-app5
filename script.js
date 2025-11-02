class ImageGenerator {
    constructor() {
        // Replace these with your actual Cloudflare credentials
        this.accountId = 'YOUR_CLOUDFLARE_ACCOUNT_ID';
        this.apiToken = 'YOUR_CLOUDFLARE_API_TOKEN';
        
        this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run`;
        
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.promptInput = document.getElementById('promptInput');
        this.modelSelect = document.getElementById('modelSelect');
        this.generateBtn = document.getElementById('generateBtn');
        this.loadingElement = document.getElementById('loading');
        this.resultElement = document.getElementById('result');
        this.errorElement = document.getElementById('error');
        this.generatedImage = document.getElementById('generatedImage');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.regenerateBtn = document.getElementById('regenerateBtn');
        this.errorMessage = document.getElementById('errorMessage');
    }

    attachEventListeners() {
        this.generateBtn.addEventListener('click', () => this.generateImage());
        this.regenerateBtn.addEventListener('click', () => this.generateImage());
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        
        // Allow Enter key to generate (with Ctrl/Cmd)
        this.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.generateImage();
            }
        });
    }

    async generateImage() {
        const prompt = this.promptInput.value.trim();
        const model = this.modelSelect.value;

        if (!prompt) {
            this.showError('Please enter a description for the image.');
            return;
        }

        this.setLoadingState(true);
        this.hideError();
        this.hideResult();

        try {
            const response = await fetch(`${this.baseUrl}/${model}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    // You can add more parameters based on the model
                    width: 1024,
                    height: 1024,
                    steps: 20, // Adjust based on model capabilities
                    guidance: 7.5
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            
            this.displayResult(imageUrl);
            
        } catch (error) {
            console.error('Error generating image:', error);
            this.showError(`Failed to generate image: ${error.message}. Please check your API credentials and try again.`);
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(isLoading) {
        this.generateBtn.disabled = isLoading;
        this.generateBtn.textContent = isLoading ? 'Generating...' : 'Generate Image';
        
        if (isLoading) {
            this.loadingElement.classList.remove('hidden');
        } else {
            this.loadingElement.classList.add('hidden');
        }
    }

    displayResult(imageUrl) {
        this.generatedImage.src = imageUrl;
        this.currentImageUrl = imageUrl; // Store for download
        this.resultElement.classList.remove('hidden');
    }

    hideResult() {
        this.resultElement.classList.add('hidden');
        if (this.currentImageUrl) {
            URL.revokeObjectURL(this.currentImageUrl);
            this.currentImageUrl = null;
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorElement.classList.remove('hidden');
    }

    hideError() {
        this.errorElement.classList.add('hidden');
    }

    downloadImage() {
        if (!this.currentImageUrl) return;

        const link = document.createElement('a');
        link.href = this.currentImageUrl;
        link.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Alternative approach using a server-side proxy (more secure)
class SecureImageGenerator extends ImageGenerator {
    constructor() {
        super();
        // Use a server endpoint instead of direct API calls
        this.baseUrl = '/api/generate-image'; // Your server endpoint
    }

    async generateImage() {
        const prompt = this.promptInput.value.trim();
        const model = this.modelSelect.value;

        if (!prompt) {
            this.showError('Please enter a description for the image.');
            return;
        }

        this.setLoadingState(true);
        this.hideError();
        this.hideResult();

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    model: model
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            
            this.displayResult(imageUrl);
            
        } catch (error) {
            console.error('Error generating image:', error);
            this.showError(`Failed to generate image: ${error.message}`);
        } finally {
            this.setLoadingState(false);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Use SecureImageGenerator if you have a server proxy
    // new SecureImageGenerator();
    
    // Use ImageGenerator for direct API calls (less secure)
    new ImageGenerator();
});
