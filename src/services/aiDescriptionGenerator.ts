interface ProductInfo {
  name: string;
  category: string;
  price: number;
  originalDescription?: string;
  images?: string[];
  tags?: string[];
}

interface GeneratedDescription {
  title: string;
  shortDescription: string;
  fullDescription: string;
  seoKeywords: string[];
  tags: string[];
}

export class AIDescriptionGenerator {
  private openaiApiKey: string;
  private apiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(apiKey: string) {
    this.openaiApiKey = apiKey;
  }

  async generateProductDescription(productInfo: ProductInfo): Promise<GeneratedDescription> {
    try {
      console.log(`🤖 Generating AI description for: ${productInfo.name}`);

      const prompt = this.createDescriptionPrompt(productInfo);
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an expert copywriter for a premium dropshipping fashion brand targeting Gen Z and young millennials. Your writing style is:

- Conversational and authentic (never robotic)
- Benefit-focused rather than feature-focused
- Emotionally compelling and aspirational
- Uses modern slang naturally (but not excessively)
- Creates FOMO and urgency
- Includes social proof elements
- SEO-optimized but naturally flowing
- Speaks directly to the customer's desires and lifestyle

Create descriptions that make people feel like they NEED this item to complete their aesthetic and express their personality.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from OpenAI');
      }

      return this.parseAIResponse(aiResponse, productInfo);

    } catch (error) {
      console.error('❌ AI description generation failed:', error);
      
      // Fallback to a template-based description
      return this.generateFallbackDescription(productInfo);
    }
  }

  private createDescriptionPrompt(productInfo: ProductInfo): string {
    return `Create a compelling product description for this fashion item:

**Product Name:** ${productInfo.name}
**Category:** ${productInfo.category}
**Price:** $${productInfo.price}
**Original Description:** ${productInfo.originalDescription || 'No description provided'}
**Tags:** ${productInfo.tags?.join(', ') || 'fashion, trendy'}

Please provide the response in this exact JSON format:
{
  "title": "An irresistible product title (max 60 chars)",
  "shortDescription": "A punchy 1-2 sentence hook that creates desire (max 120 chars)",
  "fullDescription": "A compelling 3-4 paragraph description that tells a story, creates emotion, and drives action. Include benefits, lifestyle appeal, and subtle urgency. Make it feel like it was written by a human, not AI.",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Focus on:
- How this item will make them FEEL
- The lifestyle it represents
- Social situations where they'll shine
- Why they need it NOW
- Specific benefits over generic features
- Natural, conversational tone
- Creating urgency without being pushy

Make it sound like their best friend is recommending this item to them.`;
  }

  private parseAIResponse(aiResponse: string, productInfo: ProductInfo): GeneratedDescription {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        title: parsed.title || productInfo.name,
        shortDescription: parsed.shortDescription || 'Elevate your style with this must-have piece.',
        fullDescription: parsed.fullDescription || this.generateFallbackDescription(productInfo).fullDescription,
        seoKeywords: parsed.seoKeywords || ['fashion', 'trendy', 'style', 'clothing'],
        tags: parsed.tags || ['fashion', 'trendy', 'new']
      };

    } catch (error) {
      console.warn('⚠️ Failed to parse AI response, using fallback');
      return this.generateFallbackDescription(productInfo);
    }
  }

  private generateFallbackDescription(productInfo: ProductInfo): GeneratedDescription {
    const category = productInfo.category.toLowerCase();
    
    return {
      title: `${productInfo.name} - Premium ${productInfo.category}`,
      shortDescription: `Discover your new favorite ${category} that perfectly captures your unique style and personality.`,
      fullDescription: `
        <p>Meet your new style obsession: the <strong>${productInfo.name}</strong>. This isn't just another ${category} – it's your secret weapon for turning heads and expressing your authentic self.</p>
        
        <p>Crafted for the fashion-forward individual who refuses to blend in, this piece effortlessly combines comfort with that coveted "where did you get that?" appeal. Whether you're building the perfect outfit for your feed or just want to feel incredible in your everyday moments, this ${category} delivers.</p>
        
        <p>The best part? It's versatile enough to take you from casual coffee runs to those special occasions where you want to make a statement. Style it your way and watch as it becomes the foundation of countless outfit combinations.</p>
        
        <p><strong>Ready to elevate your wardrobe?</strong> Add this to your collection and experience the confidence that comes with wearing something truly special. Your future self will thank you.</p>
      `,
      seoKeywords: ['fashion', 'trendy', 'style', category, 'clothing'],
      tags: ['fashion', 'trendy', 'new', category, 'popular']
    };
  }

  // Method to enhance existing descriptions
  async enhanceDescription(originalDescription: string, productName: string): Promise<string> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a copywriting expert. Rewrite product descriptions to be more engaging, benefit-focused, and conversion-optimized while maintaining authenticity. Keep the same length but make it more compelling.'
            },
            {
              role: 'user',
              content: `Rewrite this product description for "${productName}" to be more engaging and conversion-focused:

${originalDescription}

Make it more emotional, benefit-focused, and compelling while keeping it natural and authentic.`
            }
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        return originalDescription; // Return original if API fails
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || originalDescription;

    } catch (error) {
      console.warn('⚠️ Description enhancement failed, using original');
      return originalDescription;
    }
  }
}

// Factory function to create the service
export const createAIDescriptionGenerator = (apiKey: string): AIDescriptionGenerator => {
  return new AIDescriptionGenerator(apiKey);
};

// Types for external use
export type { ProductInfo, GeneratedDescription }; 