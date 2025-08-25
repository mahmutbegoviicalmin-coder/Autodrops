import { useState } from 'react';
import { Calculator, DollarSign, TrendingUp, Package, ShoppingCart, Zap } from 'lucide-react';
import { Product } from '../types';
import { getCategoryIconByName } from '../data/categoryIcons';

interface BudgetCalculatorProps {
  products: Product[];
}

interface ProductRecommendation {
  product: Product;
  quantity: number;
  totalCost: number;
  estimatedProfit: number;
}

interface BudgetPlan {
  totalBudget: number;
  productCosts: number;
  marketingBudget: number;
  emergencyFund: number;
  recommendations: ProductRecommendation[];
  totalEstimatedProfit: number;
  profitMargin: number;
}

export function BudgetCalculator({ products }: BudgetCalculatorProps) {
  const [budget, setBudget] = useState<number>(500);
  const [budgetPlan, setBudgetPlan] = useState<BudgetPlan | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateOptimalPlan = async () => {
    setIsCalculating(true);
    
    // Simulate calculation delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Budget allocation strategy
    const marketingPercentage = 0.3; // 30% for marketing
    const emergencyPercentage = 0.15; // 15% for emergency fund
    const productPercentage = 0.55; // 55% for products

    const marketingBudget = budget * marketingPercentage;
    const emergencyFund = budget * emergencyPercentage;
    const productBudget = budget * productPercentage;

    // Sort products by profit potential and rating
    const sortedProducts = [...products]
      .filter(p => p.price <= productBudget) // Only products we can afford
      .sort((a, b) => {
        const scoreA = (a.profitMargin / 100) * a.rating * (a.trendingScore / 100);
        const scoreB = (b.profitMargin / 100) * b.rating * (b.trendingScore / 100);
        return scoreB - scoreA;
      });

    // Select optimal product mix
    const recommendations: ProductRecommendation[] = [];
    let remainingBudget = productBudget;
    let totalEstimatedProfit = 0;

    // Strategy: Mix of high-profit and trending products
    for (let i = 0; i < Math.min(3, sortedProducts.length) && remainingBudget > 0; i++) {
      const product = sortedProducts[i];
      
      // Calculate optimal quantity based on remaining budget and product performance
      const maxQuantity = Math.floor(remainingBudget / product.price);
      let optimalQuantity;

      if (i === 0) {
        // Primary product: invest more
        optimalQuantity = Math.min(maxQuantity, Math.floor(remainingBudget * 0.6 / product.price));
      } else {
        // Secondary products: smaller quantities
        optimalQuantity = Math.min(maxQuantity, Math.max(1, Math.floor(remainingBudget * 0.2 / product.price)));
      }

      if (optimalQuantity > 0) {
        const totalCost = product.price * optimalQuantity;
        const estimatedProfit = totalCost * (product.profitMargin / 100);
        
        recommendations.push({
          product,
          quantity: optimalQuantity,
          totalCost,
          estimatedProfit
        });

        remainingBudget -= totalCost;
        totalEstimatedProfit += estimatedProfit;
      }
    }

    const plan: BudgetPlan = {
      totalBudget: budget,
      productCosts: productBudget - remainingBudget,
      marketingBudget,
      emergencyFund,
      recommendations,
      totalEstimatedProfit,
      profitMargin: totalEstimatedProfit > 0 ? (totalEstimatedProfit / (productBudget - remainingBudget)) * 100 : 0
    };

    setBudgetPlan(plan);
    setIsCalculating(false);
  };

  return (
    <div className="card-gradient rounded-2xl p-8 border border-dark-600 shadow-card-dark">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 premium-gradient rounded-xl flex items-center justify-center shadow-purple">
          <Calculator className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Smart Budget Calculator</h2>
          <p className="text-gray-400">Get personalized product recommendations for your budget</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Budget Input */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">
            Your Starting Budget
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-premium-purple" />
            </div>
            <input
              type="number"
              min="100"
              max="10000"
              step="50"
              value={budget}
              onChange={(e) => setBudget(parseInt(e.target.value) || 500)}
              className="block w-full pl-12 pr-4 py-4 premium-input rounded-xl text-2xl font-bold focus:outline-none transition-all duration-300"
              placeholder="500"
            />
          </div>
          <div className="mt-3 flex justify-between text-sm text-gray-400">
            <span>Minimum: $100</span>
            <span>Recommended: $300+</span>
            <span>Maximum: $10,000</span>
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculateOptimalPlan}
          disabled={isCalculating || budget < 100}
          className="w-full premium-button py-4 px-6 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCalculating ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Calculating optimal plan...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Generate Smart Plan</span>
            </div>
          )}
        </button>

        {/* Results */}
        {budgetPlan && (
          <div className="space-y-6 pt-6 border-t border-dark-700">
            {/* Budget Breakdown */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-dark-800 rounded-xl border border-dark-600">
                <div className="text-2xl font-bold text-premium-purple">
                  ${budgetPlan.productCosts.toFixed(0)}
                </div>
                <div className="text-sm text-gray-400">Product Investment</div>
              </div>
              <div className="text-center p-4 bg-dark-800 rounded-xl border border-dark-600">
                <div className="text-2xl font-bold text-blue-400">
                  ${budgetPlan.marketingBudget.toFixed(0)}
                </div>
                <div className="text-sm text-gray-400">Marketing Budget</div>
              </div>
              <div className="text-center p-4 bg-dark-800 rounded-xl border border-dark-600">
                <div className="text-2xl font-bold text-green-400">
                  ${budgetPlan.emergencyFund.toFixed(0)}
                </div>
                <div className="text-sm text-gray-400">Emergency Fund</div>
              </div>
            </div>

            {/* Profit Projection */}
            <div className="p-6 bg-gradient-to-r from-green-900/20 to-purple-900/20 rounded-xl border border-green-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Profit Projection</h3>
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-3xl font-black text-green-400">
                    ${budgetPlan.totalEstimatedProfit.toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-400">Estimated Profit</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-premium-purple">
                    {budgetPlan.profitMargin.toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-400">Profit Margin</div>
                </div>
              </div>
            </div>

            {/* Recommended Products */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-premium-purple" />
                <span>Recommended Product Mix</span>
              </h3>
              <div className="space-y-4">
                {budgetPlan.recommendations.map((rec, index) => (
                  <div key={rec.product.id} className="p-4 bg-dark-800 rounded-xl border border-dark-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-premium-purple rounded-lg flex items-center justify-center text-white font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{rec.product.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            {(() => {
                              const { icon, color } = getCategoryIconByName(rec.product.category);
                              return (
                                <span className={`flex items-center space-x-1 ${color}`}>
                                  <span className="text-sm">{icon}</span>
                                  <span>{rec.product.category}</span>
                                </span>
                              );
                            })()}
                            <span>•</span>
                            <span>Qty: {rec.quantity}</span>
                            <span>•</span>
                            <span>${rec.product.price.toFixed(2)} each</span>
                            <span>•</span>
                            <span>{rec.product.profitMargin}% margin</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">
                          ${rec.totalCost.toFixed(0)}
                        </div>
                        <div className="text-sm text-green-400">
                          +${rec.estimatedProfit.toFixed(0)} profit
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Success Tips */}
            <div className="p-6 bg-dark-800 rounded-xl border border-dark-600">
              <h3 className="text-lg font-bold text-white mb-4">💡 Success Tips</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Start with your primary product to validate market demand</li>
                <li>• Use 30% of budget for targeted social media advertising</li>
                <li>• Keep emergency fund for unexpected costs or opportunities</li>
                <li>• Test different products to find your winning combinations</li>
                <li>• Reinvest profits to scale successful products</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 