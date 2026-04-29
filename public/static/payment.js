// WorVox Payment Module
// TossPayments integration and payment processing
// Usage: Automatically loaded when needed

(function() {
  'use strict';
  
  if (!window.WorVox) {
    console.error('❌ WorVox core not loaded. Payment module requires WorVox class.');
    return;
  }
  
  // Extend WorVox prototype with payment methods
  Object.assign(window.WorVox.prototype, {
    
    // Helper function to load and wait for TossPayments SDK
    async waitForTossPaymentsSDK(clientKey, maxWaitTime = 30000) {
      const startTime = Date.now();
      const checkInterval = 100;
      
      if (typeof window.TossPayments === 'undefined') {
        console.log('🔄 TossPayments SDK not found, loading script dynamically...');
        
        let existingScript = document.querySelector('script[src*="tosspayments.com"]');
        
        if (!existingScript) {
          const script = document.createElement('script');
          script.src = 'https://js.tosspayments.com/v2/standard';
          script.async = false;
          script.defer = false;
          
          script.onload = () => {
            console.log('✅ TossPayments SDK script loaded successfully');
          };
          script.onerror = (error) => {
            console.error('❌ TossPayments SDK script failed to load:', error);
          };
          
          document.head.appendChild(script);
          console.log('✅ TossPayments SDK script added to DOM');
        }
      }
      
      return new Promise((resolve, reject) => {
        const checkSDK = () => {
          const elapsed = Date.now() - startTime;
          
          if (typeof window.TossPayments !== 'undefined') {
            console.log(`✅ TossPayments SDK loaded after ${elapsed}ms`);
            try {
              const tossPayments = window.TossPayments(clientKey);
              resolve(tossPayments);
            } catch (error) {
              console.error('❌ Failed to initialize TossPayments:', error);
              reject(new Error('TossPayments SDK 초기화 실패: ' + error.message));
            }
          } else if (elapsed >= maxWaitTime) {
            console.error(`❌ TossPayments SDK timeout after ${elapsed}ms`);
            reject(new Error(`TossPayments SDK를 ${maxWaitTime/1000}초 동안 기다렸지만 로드되지 않았습니다.`));
          } else {
            setTimeout(checkSDK, checkInterval);
          }
        };
        
        checkSDK();
      });
    },
    
    // Show payment page
    showPaymentPage(plan) {
      if (!this.checkUsageLimit('payment')) {
        return;
      }
      
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
          ${this.getSidebar('payment')}
          
          <div class="max-w-6xl mx-auto">
            <div class="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h1 class="text-3xl font-bold text-gray-900 mb-4">
                <i class="fas fa-crown text-yellow-500 mr-2"></i>
                Premium 플랜
              </h1>
              <p class="text-gray-600 mb-8">
                무제한 AI 대화와 모든 프리미엄 기능을 이용하세요
              </p>
              
              <div class="grid md:grid-cols-3 gap-6">
                <!-- Basic Plan -->
                <div class="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-500 transition-all">
                  <h3 class="text-xl font-bold mb-2">Basic</h3>
                  <div class="text-3xl font-bold mb-4">₩9,900<span class="text-sm text-gray-500">/월</span></div>
                  <ul class="space-y-2 text-sm text-gray-600 mb-6">
                    <li><i class="fas fa-check text-green-500 mr-2"></i>일일 AI 대화 10회</li>
                    <li><i class="fas fa-check text-green-500 mr-2"></i>기본 발음 분석</li>
                    <li><i class="fas fa-check text-green-500 mr-2"></i>단어 학습</li>
                  </ul>
                  <button onclick="worvox.showPaymentMethodModal('Basic', 9900, '₩9,900', 'monthly')" 
                    class="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-900 transition-all">
                    선택하기
                  </button>
                </div>
                
                <!-- Premium Plan -->
                <div class="border-4 border-purple-500 rounded-xl p-6 relative transform scale-105">
                  <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm">
                    인기
                  </div>
                  <h3 class="text-xl font-bold mb-2">Premium</h3>
                  <div class="text-3xl font-bold mb-4">₩29,900<span class="text-sm text-gray-500">/월</span></div>
                  <ul class="space-y-2 text-sm text-gray-600 mb-6">
                    <li><i class="fas fa-check text-green-500 mr-2"></i>무제한 AI 대화</li>
                    <li><i class="fas fa-check text-green-500 mr-2"></i>고급 발음 분석</li>
                    <li><i class="fas fa-check text-green-500 mr-2"></i>AI 맞춤 문장 생성</li>
                    <li><i class="fas fa-check text-green-500 mr-2"></i>시험 모드</li>
                  </ul>
                  <button onclick="worvox.showPaymentMethodModal('Premium', 29900, '₩29,900', 'monthly')" 
                    class="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-all">
                    선택하기
                  </button>
                </div>
                
                <!-- Pro Plan -->
                <div class="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-500 transition-all">
                  <h3 class="text-xl font-bold mb-2">Pro</h3>
                  <div class="text-3xl font-bold mb-4">₩49,900<span class="text-sm text-gray-500">/월</span></div>
                  <ul class="space-y-2 text-sm text-gray-600 mb-6">
                    <li><i class="fas fa-check text-green-500 mr-2"></i>Premium 모든 기능</li>
                    <li><i class="fas fa-check text-green-500 mr-2"></i>1:1 튜터링</li>
                    <li><i class="fas fa-check text-green-500 mr-2"></i>학습 리포트</li>
                    <li><i class="fas fa-check text-green-500 mr-2"></i>우선 지원</li>
                  </ul>
                  <button onclick="worvox.showPaymentMethodModal('Pro', 49900, '₩49,900', 'monthly')" 
                    class="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-900 transition-all">
                    선택하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },
    
    // Handle payment success
    handlePaymentSuccess(plan, billingCycle) {
      console.log('💳 Payment success:', plan, billingCycle);
      
      this.showToast('결제가 완료되었습니다! 🎉', 'success');
      
      // Update user subscription
      if (this.currentUser) {
        this.currentUser.subscription = plan;
        this.currentUser.subscriptionDate = new Date().toISOString();
        localStorage.setItem('worvox_user', JSON.stringify(this.currentUser));
      }
      
      // Redirect to dashboard
      setTimeout(() => {
        this.showTopicSelection();
      }, 2000);
    },
    
    // Show payment method modal
    showPaymentMethodModal(planName, amount, priceText, period) {
      console.log('💳 Opening payment modal:', planName, amount, priceText, period);
      this.showPaymentStayTuned(planName, priceText);
    },
    
    // Show payment stay tuned modal
    showPaymentStayTuned(plan, price) {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
      modal.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-md w-full">
          <div class="text-center">
            <div class="text-6xl mb-4">🚀</div>
            <h2 class="text-2xl font-bold mb-4">곧 출시됩니다!</h2>
            <p class="text-gray-600 mb-6">
              ${plan} 플랜 (${price})은 현재 개발 중입니다.<br>
              빠른 시일 내에 만나보실 수 있습니다.
            </p>
            <button onclick="this.closest('.fixed').remove()" 
              class="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-all">
              확인
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    
  });
  
  console.log('✅ Payment module loaded');
  
})();
