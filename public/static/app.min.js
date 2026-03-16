// WorVox - AI English Learning App - v2.4.0 - INLINE STYLE FIX
// Force hide text with inline style display:none !important
// No more Tailwind responsive classes - use inline CSS
class WorVox {
  constructor() {
    this.currentUser = null;
    this.currentSession = null;
    this.currentTopic = null;
    this.messages = [];
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.currentAudio = null;
    
    // 🚀 Option C: Preloaded prompts cache
    this.preloadedPrompts = {};
    this.isPreloading = false;
    
    // User plan and usage tracking
    this.userPlan = 'free'; // 'free', 'premium', 'business'
    this.currentBillingPeriod = 'monthly'; // 'monthly' or 'yearly'
    this.dailyUsage = {
      aiConversations: 0,
      pronunciationPractice: 0,
      wordSearch: 0,
      lastReset: new Date().toDateString()
    };
    this.usageLimits = {
      free: {
        aiConversations: 5,
        pronunciationPractice: 10,
        wordSearch: 10,
        timerMode: 0,  // Free users: no access
        scenarioMode: 0,  // Free users: no access
        examMode: 0  // Free users: no access
      },
      core: {
        aiConversations: Infinity,  // Core: unlimited
        pronunciationPractice: Infinity,
        wordSearch: Infinity,  // Core: unlimited
        timerMode: 30,  // Core: 30 per day
        scenarioMode: 30,  // Core: 30 per day
        examMode: 10  // Core: 10 per day
      },
      premium: {
        aiConversations: Infinity,
        pronunciationPractice: Infinity,
        wordSearch: Infinity,
        timerMode: Infinity,
        scenarioMode: Infinity,
        examMode: Infinity
      },
      business: {
        aiConversations: Infinity,
        pronunciationPractice: Infinity,
        wordSearch: Infinity,
        timerMode: Infinity,
        scenarioMode: Infinity,
        examMode: Infinity
      }
    };
    
    // Scenario Mode Data (30 real-life scenarios with practice sentences)
    this.scenarios = [
      { id: 1, title: "공항 체크인", category: "여행", difficulty: "beginner", icon: "✈️", description: "항공편 체크인과 수하물 처리",
        sentences: [
          "I'd like to check in for flight KE123 to New York.",
          "Can I have a window seat, please?",
          "I have two bags to check in.",
          "Is the flight on time?",
          "Where is gate number fifteen?"
        ],
        translations: [
          "뉴욕행 KE123편으로 체크인하고 싶습니다.",
          "창가 좌석으로 부탁드립니다.",
          "위탁 수하물이 두 개 있습니다.",
          "비행기가 정시에 출발하나요?",
          "15번 게이트가 어디인가요?"
        ]
      },
      { id: 2, title: "호텔 예약", category: "여행", difficulty: "beginner", icon: "🏨", description: "호텔 룸 예약 및 체크인",
        sentences: [
          "I have a reservation under the name Smith.",
          "What time is checkout?",
          "Could you call a taxi for me, please?",
          "Does the room have Wi-Fi?",
          "Is breakfast included in the rate?"
        ],
        translations: [
          "스미스 이름으로 예약했습니다.",
          "체크아웃 시간이 언제인가요?",
          "택시를 불러주시겠어요?",
          "방에 와이파이가 있나요?",
          "조식이 요금에 포함되어 있나요?"
        ]
      },
      { id: 3, title: "레스토랑 주문", category: "일상", difficulty: "beginner", icon: "🍽️", description: "레스토랑에서 음식 주문하기",
        sentences: [
          "Can I see the menu, please?",
          "I'll have the grilled salmon with vegetables.",
          "Could I get the bill, please?",
          "What would you recommend?",
          "Is this dish spicy?"
        ],
        translations: [
          "메뉴판을 볼 수 있을까요?",
          "그릴에 구운 연어와 야채로 주세요.",
          "계산서를 받을 수 있을까요?",
          "추천해주실 만한 게 있나요?",
          "이 요리는 매운가요?"
        ]
      },
      { id: 4, title: "길 묻기", category: "일상", difficulty: "beginner", icon: "🗺️", description: "길을 잃었을 때 방향 묻기",
        sentences: [
          "Excuse me, how do I get to the train station?",
          "Is it within walking distance?",
          "Thank you for your help.",
          "Should I turn left or right at the traffic light?",
          "How long will it take to walk there?"
        ],
        translations: [
          "실례합니다, 기차역으로 어떻게 가나요?",
          "걸어갈 수 있는 거리인가요?",
          "도와주셔서 감사합니다.",
          "신호등에서 왼쪽으로 돌아야 하나요, 오른쪽으로 돌아야 하나요?",
          "걸어서 얼마나 걸리나요?"
        ]
      },
      { id: 5, title: "카페 주문", category: "일상", difficulty: "beginner", icon: "☕", description: "커피숍에서 음료 주문",
        sentences: [
          "I'd like a large cappuccino to go, please.",
          "Do you have any sugar-free options?",
          "Can I pay with a credit card?",
          "Could I also get a blueberry muffin?",
          "Do you have almond milk?"
        ],
        translations: [
          "큰 사이즈 카푸치노 테이크아웃으로 주세요.",
          "무설탕 옵션이 있나요?",
          "신용카드로 결제할 수 있나요?",
          "블루베리 머핀도 하나 주시겠어요?",
          "아몬드 우유가 있나요?"
        ]
      },
      { id: 6, title: "택시 타기", category: "교통", difficulty: "beginner", icon: "🚕", description: "택시 타고 목적지 가기",
        sentences: [
          "Could you take me to the airport, please?",
          "How long will it take to get there?",
          "Keep the change, thank you.",
          "Can you help me with my luggage?",
          "Could you turn on the air conditioning?"
        ],
        translations: [
          "공항으로 가주시겠어요?",
          "거기까지 얼마나 걸리나요?",
          "거스름돈은 가지세요, 감사합니다.",
          "짐 좀 도와주시겠어요?",
          "에어컨 좀 켜주시겠어요?"
        ]
      },
      { id: 7, title: "쇼핑하기", category: "일상", difficulty: "beginner", icon: "🛍️", description: "매장에서 물건 구매하기",
        sentences: [
          "Do you have this in a smaller size?",
          "How much does this cost?",
          "I'll take it. Can I pay by card?",
          "Can I try this on?",
          "Do you have this in a different color?"
        ],
        translations: [
          "이것보다 작은 사이즈가 있나요?",
          "이것은 얼마인가요?",
          "이걸로 하겠습니다. 카드로 결제할 수 있나요?",
          "이것 입어봐도 될까요?",
          "이것 다른 색깔로 있나요?"
        ]
      },
      { id: 8, title: "은행 업무", category: "비즈니스", difficulty: "intermediate", icon: "🏦", description: "계좌 개설 및 은행 업무",
        sentences: [
          "I'd like to open a checking account.",
          "What documents do I need to bring?",
          "What's the minimum balance requirement?",
          "Are there any monthly fees?",
          "How long will it take to process?"
        ],
        translations: [
          "당좌예금 계좌를 개설하고 싶습니다.",
          "어떤 서류를 가져와야 하나요?",
          "최소 잔액 요건이 얼마인가요?",
          "월 수수료가 있나요?",
          "처리하는 데 얼마나 걸리나요?"
        ]
      },
      { id: 9, title: "병원 예약", category: "일상", difficulty: "intermediate", icon: "🏥", description: "의사 진료 예약하기",
        sentences: [
          "I'd like to make an appointment with Doctor Johnson.",
          "I've been having headaches for the past week.",
          "Do you accept my insurance?",
          "What's the earliest available appointment?",
          "Should I bring my medical records?"
        ],
        translations: [
          "존슨 박사님과 진료 예약을 하고 싶습니다.",
          "지난 주부터 계속 두통이 있었습니다.",
          "제 보험을 받으시나요?",
          "가장 빠른 예약 가능한 시간이 언제인가요?",
          "진료 기록을 가져와야 하나요?"
        ]
      },
      { id: 10, title: "전화 예약", category: "일상", difficulty: "intermediate", icon: "📞", description: "전화로 레스토랑 예약",
        sentences: [
          "I'd like to make a reservation for four people at seven PM.",
          "Do you have any tables available by the window?",
          "Could you please confirm my reservation?",
          "Is there a dress code?",
          "Can we bring our own wine?"
        ],
        translations: [
          "저녁 7시에 4명으로 예약하고 싶습니다.",
          "창가 자리가 있나요?",
          "예약을 확인해주시겠어요?",
          "복장 규정이 있나요?",
          "와인을 직접 가져가도 되나요?"
        ]
      },
      { id: 11, title: "면접 대비", category: "비즈니스", difficulty: "advanced", icon: "💼", description: "영어 취업 면접 준비",
        sentences: [
          "I have five years of experience in digital marketing.",
          "I believe my skills align perfectly with this position.",
          "What opportunities are there for professional development?",
          "Why should we hire you for this role?",
          "Where do you see yourself in five years?"
        ],
        translations: [
          "저는 디지털 마케팅 분야에서 5년의 경력이 있습니다.",
          "제 능력이 이 직책에 완벽하게 부합한다고 생각합니다.",
          "전문성 개발을 위한 기회는 어떤 것이 있나요?",
          "왜 저를 이 역할에 채용해야 할까요?",
          "5년 후 자신의 모습을 어떻게 보시나요?"
        ]
      },
      { id: 12, title: "회의 진행", category: "비즈니스", difficulty: "advanced", icon: "👥", description: "영어 비즈니스 미팅",
        sentences: [
          "Let's move on to the next item on the agenda.",
          "I'd like to propose an alternative approach.",
          "Could we schedule a follow-up meeting next week?",
          "Does anyone have any questions or concerns?",
          "Let's take a five-minute break."
        ]
      },
      { id: 13, title: "프레젠테이션", category: "비즈니스", difficulty: "advanced", icon: "📊", description: "영어 발표 연습",
        sentences: [
          "Today, I'll be presenting our quarterly sales results.",
          "As you can see from this chart, sales increased by fifteen percent.",
          "Are there any questions before we proceed?",
          "Let me highlight the key findings.",
          "In conclusion, we exceeded our targets this quarter."
        ]
      },
      { id: 14, title: "고객 응대", category: "비즈니스", difficulty: "intermediate", icon: "🤝", description: "고객 서비스 상황",
        sentences: [
          "How may I assist you today?",
          "I apologize for any inconvenience this may have caused.",
          "Is there anything else I can help you with?",
          "Let me look into that for you right away.",
          "Thank you for bringing this to our attention."
        ]
      },
      { id: 15, title: "클레임 처리", category: "비즈니스", difficulty: "intermediate", icon: "⚠️", description: "불만 사항 처리하기",
        sentences: [
          "I understand your frustration, and I'm here to help.",
          "Let me check what options are available for you.",
          "We'll process your refund within three business days.",
          "I'll personally ensure this issue is resolved.",
          "Would you like to speak with a supervisor?"
        ]
      },
      { id: 16, title: "헬스장 등록", category: "일상", difficulty: "beginner", icon: "💪", description: "체육관 회원 가입",
        sentences: [
          "I'm interested in signing up for a gym membership.",
          "What are your membership options?",
          "Do you offer personal training sessions?",
          "Can I get a tour of the facility?",
          "What are your operating hours?"
        ]
      },
      { id: 17, title: "영화관 예매", category: "여가", difficulty: "beginner", icon: "🎬", description: "영화표 예매하기",
        sentences: [
          "Two tickets for the seven o'clock showing, please.",
          "Are there any seats available in the middle section?",
          "Can I get a large popcorn and two drinks?",
          "Do you offer student discounts?",
          "How long is the movie?"
        ]
      },
      { id: 18, title: "우체국 업무", category: "일상", difficulty: "intermediate", icon: "📮", description: "소포 발송하기",
        sentences: [
          "I'd like to send this package to Los Angeles.",
          "How long will it take to arrive?",
          "I'd like to insure it for one hundred dollars.",
          "Do you offer tracking service?",
          "What's the weight limit for this package?"
        ]
      },
      { id: 19, title: "렌터카 빌리기", category: "여행", difficulty: "intermediate", icon: "🚗", description: "렌터카 대여 절차",
        sentences: [
          "I have a reservation for a compact car.",
          "Is insurance included in the price?",
          "What time should I return the car?",
          "Is there a mileage limit?",
          "Can I drop off the car at a different location?"
        ]
      },
      { id: 20, title: "부동산 문의", category: "비즈니스", difficulty: "advanced", icon: "🏠", description: "집 구하기 및 계약",
        sentences: [
          "I'm looking for a two-bedroom apartment in the downtown area.",
          "What's included in the monthly rent?",
          "When would be the earliest move-in date?",
          "Are pets allowed in the building?",
          "What's the lease term?"
        ]
      },
      { id: 21, title: "전화 영어", category: "비즈니스", difficulty: "intermediate", icon: "☎️", description: "업무 전화 통화",
        sentences: [
          "This is John Smith calling from ABC Company.",
          "Could I speak with Mr. Johnson, please?",
          "I'll send you an email with the details shortly.",
          "May I leave a message?",
          "Could you please repeat that?"
        ]
      },
      { id: 22, title: "이메일 작성", category: "비즈니스", difficulty: "intermediate", icon: "✉️", description: "비즈니스 이메일 상황",
        sentences: [
          "I'm writing to inquire about the product specifications.",
          "Could you please provide more information?",
          "I look forward to hearing from you soon.",
          "Thank you for your prompt response.",
          "Please let me know if you need any additional information."
        ]
      },
      { id: 23, title: "네트워킹", category: "비즈니스", difficulty: "advanced", icon: "🌐", description: "네트워킹 이벤트 대화",
        sentences: [
          "It's a pleasure to meet you. I work in software development.",
          "What brings you to this conference?",
          "Here's my business card. Let's keep in touch.",
          "Have you attended this event before?",
          "I'd love to connect on LinkedIn."
        ]
      },
      { id: 24, title: "협상하기", category: "비즈니스", difficulty: "advanced", icon: "🤝", description: "비즈니스 협상 연습",
        sentences: [
          "I believe we can reach a mutually beneficial agreement.",
          "Would you be open to discussing a volume discount?",
          "Let's review the terms one more time before finalizing.",
          "What are your payment terms?",
          "Can we schedule a follow-up call next week?"
        ]
      },
      { id: 25, title: "미용실 가기", category: "일상", difficulty: "beginner", icon: "💇", description: "헤어 스타일 주문",
        sentences: [
          "I'd like a haircut and a blow-dry, please.",
          "Could you take about two inches off the length?",
          "That looks great, thank you.",
          "Can you recommend a good shampoo?",
          "How often should I get a trim?"
        ]
      },
      { id: 26, title: "약국 방문", category: "일상", difficulty: "intermediate", icon: "💊", description: "약국에서 약 구매",
        sentences: [
          "I need something for a headache.",
          "Do I need a prescription for this medication?",
          "How often should I take this?",
          "Are there any side effects I should know about?",
          "Can I take this with food?"
        ]
      },
      { id: 27, title: "스몰톡", category: "일상", difficulty: "beginner", icon: "💬", description: "일상적인 가벼운 대화",
        sentences: [
          "How's your day going so far?",
          "The weather is beautiful today, isn't it?",
          "Have a great weekend!",
          "Did you do anything fun recently?",
          "I hope you have a wonderful day!"
        ]
      },
      { id: 28, title: "날씨 이야기", category: "일상", difficulty: "beginner", icon: "🌤️", description: "날씨에 관한 대화",
        sentences: [
          "It looks like it's going to rain later.",
          "I hope the weather stays nice for the weekend.",
          "It's been unusually warm this year.",
          "I heard there's a storm coming tomorrow.",
          "The forecast says it'll be sunny all week."
        ]
      },
      { id: 29, title: "취미 이야기", category: "일상", difficulty: "intermediate", icon: "🎨", description: "취미와 관심사 공유",
        sentences: [
          "I enjoy hiking on the weekends.",
          "Have you tried any new restaurants lately?",
          "I've been learning to play the guitar recently.",
          "What do you like to do in your free time?",
          "I'm thinking about taking up photography."
        ]
      },
      { id: 30, title: "여행 경험", category: "여가", difficulty: "intermediate", icon: "🌍", description: "여행 경험 나누기",
        sentences: [
          "I visited Paris last summer, and it was amazing.",
          "The local food was absolutely delicious.",
          "I'd love to go back someday.",
          "Have you ever been to Europe?",
          "I'm planning a trip to Japan next year."
        ],
        translations: [
          "지난 여름에 파리를 방문했는데 정말 놀라웠습니다.",
          "현지 음식이 정말 맛있었습니다.",
          "언젠가 다시 가고 싶습니다.",
          "유럽에 가본 적 있으신가요?",
          "내년에 일본 여행을 계획하고 있습니다."
        ]
      },
      { id: 31, title: "Military English", category: "비즈니스", difficulty: "advanced", icon: "🎖️", description: "군사 작전 및 임무 관련 대화",
        sentences: [
          "Roger that, we're proceeding to the designated checkpoint.",
          "Request permission to engage the target.",
          "All units, stand by for further instructions.",
          "Enemy contact at grid coordinates three-one-seven-niner.",
          "Mission accomplished, returning to base."
        ],
        translations: [
          "알겠습니다, 지정된 검문소로 이동 중입니다.",
          "목표물 교전 허가를 요청합니다.",
          "전 부대, 추가 지시가 있을 때까지 대기하십시오.",
          "좌표 3179에서 적과 조우했습니다.",
          "임무 완수, 기지로 복귀 중입니다."
        ]
      }
    ];
    
    // Onboarding state
    this.onboardingData = {
      username: '',
      level: '',
      referralSource: '',
      ageGroup: '',
      gender: '',
      occupation: ''
    };
    this.onboardingStep = 1;
    
    // Load usage from localStorage
    this.loadUsageData();
    
    this.init();
  }

  async init() {
    // Check for existing user in localStorage
    const savedUser = localStorage.getItem('worvox_user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      // Set user plan from currentUser
      this.userPlan = this.currentUser.plan || 'free';
      // Load usage data from server
      await this.loadUsageFromServer();
      await this.loadGamificationStats();
      this.showTopicSelection();
    } else {
      this.showLogin();
    }
  }

  async loadGamificationStats() {
    if (!this.currentUser || typeof gamificationManager === 'undefined') return;
    
    try {
      const stats = await gamificationManager.getStats(this.currentUser.id);
      if (stats) {
        this.updateGamificationUI(stats.stats);
      }
    } catch (error) {
      console.error('Error loading gamification stats:', error);
    }
  }

  updateGamificationUI(stats) {
    // Update level
    const levelBadge = document.querySelector('#user-level');
    if (levelBadge) {
      levelBadge.textContent = `Lv.${stats.level}`;
    }
    
    // Update XP progress bar
    const xpBar = document.querySelector('#xp-progress-bar');
    if (xpBar) {
      xpBar.style.width = `${stats.progress}%`;
    }
    
    // Update XP text
    const xpText = document.querySelector('#xp-text');
    if (xpText) {
      xpText.textContent = `${stats.xp} / ${stats.xpForNextLevel} XP`;
    }
    
    // Update coins
    const coinsDisplay = document.querySelector('#user-coins');
    if (coinsDisplay) {
      coinsDisplay.textContent = `💰 ${stats.coins}`;
    }
  }

  initGoogleSignIn() {
    // Wait for Google Sign-In library to load
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.initialize({
        client_id: '506018364729-ichplnfnqlk2hmh1bhblepm0un44ltdr.apps.googleusercontent.com',
        callback: this.handleGoogleSignIn.bind(this),
        auto_select: false,
      });
    } else {
      // Retry after 500ms if library not loaded yet
      setTimeout(() => this.initGoogleSignIn(), 500);
    }
  }

  async handleGoogleSignIn(response) {
    try {
      console.log('Google Sign-In response:', response);
      
      // Decode JWT token to get user info
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const profileObj = JSON.parse(jsonPayload);
      console.log('Decoded profile:', profileObj);

      // Send to backend
      const authResponse = await axios.post('/api/users/auth/google', {
        credential: response.credential,
        profileObj: profileObj
      });

      if (authResponse.data.success) {
        this.currentUser = authResponse.data.user;
        localStorage.setItem('worvox_user', JSON.stringify(this.currentUser));
        
        // Load gamification stats
        await this.loadGamificationStats();
        
        // If new user, show onboarding for additional info
        if (authResponse.data.isNew) {
          this.onboardingStep = 2; // Skip name step
          this.onboardingData.username = this.currentUser.username;
          this.showOnboardingStep();
        } else {
          this.showTopicSelection();
        }
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      alert('Failed to sign in with Google. Please try again.');
    }
  }

  // UI Rendering Methods
  getSidebar(activeItem = 'home') {
    return `
      <!-- Mobile Sidebar Overlay -->
      <div id="sidebarOverlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden md:hidden" onclick="worvox.toggleMobileSidebar()"></div>
      
      <!-- Sidebar (hidden on mobile by default) -->
      <div id="sidebar" class="fixed md:static inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col z-50 transform -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out">
        <!-- Logo -->
        <div class="p-4 border-b border-gray-700 flex items-center justify-between">
          <a href="#" onclick="worvox.showTopicSelection(); worvox.closeMobileSidebar(); return false;" class="text-xl font-bold cursor-pointer hover:opacity-90 transition-opacity">
            WorVox
          </a>
          <button onclick="worvox.toggleMobileSidebar()" class="md:hidden text-white">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <!-- Menu Items -->
        <nav class="flex-1 p-3 space-y-2 overflow-y-auto">
          <a href="#" onclick="worvox.showTopicSelection(); worvox.closeMobileSidebar(); return false;" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${activeItem === 'home' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-all">
            <i class="fas fa-home" style="width: 20px; text-align: center;"></i>
            <span>Home</span>
          </a>
          <a href="#" onclick="worvox.startConversation(); worvox.closeMobileSidebar(); return false;" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${activeItem === 'conversation' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-all">
            <i class="fas fa-comments" style="width: 20px; text-align: center;"></i>
            <span>AI Conversation</span>
          </a>
          <a href="#" onclick="worvox.startVocabulary(); worvox.closeMobileSidebar(); return false;" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${activeItem === 'vocabulary' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-all">
            <i class="fas fa-book" style="width: 20px; text-align: center;"></i>
            <span>Vocabulary</span>
          </a>
          <a href="#" onclick="worvox.showHistory(); worvox.closeMobileSidebar(); return false;" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${activeItem === 'history' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-all">
            <i class="fas fa-history" style="width: 20px; text-align: center;"></i>
            <span>History</span>
          </a>
          <a href="#" onclick="worvox.showStats(); worvox.closeMobileSidebar(); return false;" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${activeItem === 'stats' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-all">
            <i class="fas fa-chart-line" style="width: 20px; text-align: center;"></i>
            <span>Statistics</span>
          </a>
          <a href="#" onclick="worvox.showRewards(); worvox.closeMobileSidebar(); return false;" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${activeItem === 'rewards' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-all">
            <i class="fas fa-gift" style="width: 20px; text-align: center;"></i>
            <span>Rewards</span>
          </a>
          <a href="#" onclick="worvox.showPlan(); worvox.closeMobileSidebar(); return false;" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${activeItem === 'plan' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-all">
            <i class="fas fa-crown" style="width: 20px; text-align: center;"></i>
            <span>Plan</span>
          </a>
          <a href="#" onclick="worvox.showRealConversation(); worvox.closeMobileSidebar(); return false;" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${activeItem === 'live-speaking' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-all">
            <i class="fas fa-phone-volume" style="width: 20px; text-align: center;"></i>
            <span class="text-sm">1:1 Live Speaking</span>
          </a>
        </nav>
        
        <!-- User Profile -->
        <div class="p-4 border-t border-gray-700">
          <!-- Plan Badge -->
          <div class="mb-3">
            ${this.isPremiumUser() ? `
              <div class="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-3 text-center">
                <div class="flex items-center justify-center gap-2 mb-1">
                  <i class="fas fa-crown text-yellow-300"></i>
                  <span class="text-white font-bold text-sm">PREMIUM</span>
                </div>
                <div class="text-xs text-purple-100">무제한 학습</div>
              </div>
            ` : `
              <div class="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                <div class="flex items-center justify-center gap-2 mb-1">
                  <i class="fas fa-user text-gray-400"></i>
                  <span class="text-gray-300 font-bold text-sm">FREE</span>
                </div>
                <div class="text-xs text-gray-400">일일 제한</div>
                <button onclick="worvox.showPlan(); worvox.closeMobileSidebar();" class="mt-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs py-1.5 rounded transition-all">
                  <i class="fas fa-arrow-up mr-1"></i>업그레이드
                </button>
              </div>
            `}
          </div>
          
          <!-- Level & XP Info -->
          <div class="mb-3 bg-gray-800 rounded-lg p-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-gray-400">레벨</span>
              <span id="user-level" class="text-sm font-bold text-yellow-400">Lv.1</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2 mb-1">
              <div id="xp-progress-bar" class="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all" style="width: 0%"></div>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span id="xp-text" class="text-gray-400">0 / 100 XP</span>
              <span id="user-coins" class="text-yellow-400">💰 0</span>
            </div>
          </div>
          
          <!-- User Info -->
          <div class="flex items-center gap-3">
            <button onclick="worvox.showProfile(); worvox.closeMobileSidebar();" class="flex items-center gap-3 flex-1 hover:bg-gray-800 p-2 rounded-lg transition-all">
              <div class="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-semibold">
                ${this.currentUser.username.charAt(0).toUpperCase()}
              </div>
              <div class="flex-1 text-left">
                <div class="font-medium text-sm">${this.currentUser.username}</div>
                <div class="text-xs text-gray-400">${this.currentUser.level}</div>
              </div>
            </button>
            <button onclick="worvox.logout()" class="text-gray-400 hover:text-white p-2" title="Logout">
              <i class="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Footer with company information
  getFooter() {
    return `
      <footer class="w-screen bg-gray-900 text-gray-400 py-4 md:py-6 -ml-4 md:-ml-8 mt-6 md:mt-12">
        <div class="px-4 md:px-8 max-w-full">
          <div class="flex flex-col gap-2 md:gap-3 text-xs">
            <!-- Company Info -->
            <div class="text-center md:text-left">
              <div class="flex flex-wrap items-center justify-center md:justify-start gap-1 md:gap-2 mb-1 md:mb-2">
                <span class="font-medium text-gray-300">위아솔루션즈</span>
                <span class="text-gray-600 hidden md:inline">|</span>
                <span class="text-gray-500">대표자: 이강돈</span>
                <span class="text-gray-600 hidden md:inline">|</span>
                <span class="text-gray-500">사업자번호: 542-07-02097</span>
              </div>
              <div class="flex flex-wrap items-center justify-center md:justify-start gap-1 md:gap-2 mb-1 md:mb-2">
                <span class="text-gray-500 text-center md:text-left">주소: 대전광역시 서구 대덕대로241번길 20, 5층 548-2호</span>
              </div>
              <div class="flex flex-wrap items-center justify-center md:justify-start gap-1 md:gap-2">
                <span class="text-gray-500">통신판매: 제 2021-대전동구-0501호</span>
                <span class="text-gray-600 hidden md:inline">|</span>
                <span class="text-gray-500">문의전화: 070-8064-0485</span>
              </div>
            </div>
            
            <!-- Copyright & Links -->
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3 pt-2 md:pt-3 border-t border-gray-800">
              <span class="text-gray-500">© ${new Date().getFullYear()} WorVox</span>
              <span class="text-gray-700 hidden md:inline">|</span>
              <a href="#" onclick="worvox.showTerms(); return false;" class="hover:text-gray-300 transition-colors whitespace-nowrap">이용약관</a>
              <span class="text-gray-700">|</span>
              <a href="#" onclick="worvox.showPrivacy(); return false;" class="hover:text-gray-300 transition-colors whitespace-nowrap">개인정보처리방침</a>
              <span class="text-gray-700">|</span>
              <a href="#" onclick="worvox.showRefund(); return false;" class="hover:text-gray-300 transition-colors whitespace-nowrap">환불정책</a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
      sidebar.classList.toggle('-translate-x-full');
      overlay.classList.toggle('hidden');
    }
  }

  closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
      sidebar.classList.add('-translate-x-full');
      overlay.classList.add('hidden');
    }
  }

  // Toggle Dark Mode
  toggleDarkMode() {
    const currentMode = localStorage.getItem('worvox_dark_mode') || 'light';
    const newMode = currentMode === 'light' ? 'dark' : 'light';
    
    localStorage.setItem('worvox_dark_mode', newMode);
    
    if (newMode === 'dark') {
      document.documentElement.classList.add('dark');
      // Update desktop icon
      const icon = document.getElementById('darkModeIcon');
      if (icon) {
        icon.className = 'fas fa-sun text-yellow-400';
      }
      // Update mobile icon
      const iconMobile = document.getElementById('darkModeIconMobile');
      if (iconMobile) {
        iconMobile.className = 'fas fa-sun text-yellow-400';
      }
      console.log('🌙 Dark mode enabled');
      alert('🌙 다크모드가 활성화되었습니다!\n\n페이지 배경과 카드가 어두운 테마로 변경됩니다.');
    } else {
      document.documentElement.classList.remove('dark');
      // Update desktop icon
      const icon = document.getElementById('darkModeIcon');
      if (icon) {
        icon.className = 'fas fa-moon text-gray-600';
      }
      // Update mobile icon
      const iconMobile = document.getElementById('darkModeIconMobile');
      if (iconMobile) {
        iconMobile.className = 'fas fa-moon text-gray-600 dark:text-gray-300';
      }
      console.log('☀️ Light mode enabled');
      alert('☀️ 라이트모드가 활성화되었습니다!');
    }
  }

  // Initialize Dark Mode on page load
  initDarkMode() {
    const savedMode = localStorage.getItem('worvox_dark_mode') || 'light';
    if (savedMode === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }

  getMobileHeader(title = 'WorVox') {
    return `
      <div class="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <button onclick="worvox.toggleMobileSidebar()" class="text-gray-600 dark:text-gray-300">
          <i class="fas fa-bars text-xl"></i>
        </button>
        <h1 class="text-lg font-semibold text-gray-800 dark:text-gray-200">${title}</h1>
        <button onclick="worvox.toggleDarkMode()" 
          class="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all" 
          title="다크모드 전환">
          <i class="fas fa-moon text-gray-600 dark:text-gray-300" id="darkModeIconMobile"></i>
        </button>
      </div>
    `;
  }

  async startConversation() {
    // Check usage limit for free users
    if (!this.checkUsageLimit('aiConversations')) {
      return; // Show upgrade banner
    }
    
    // Increment usage when starting conversation
    this.incrementUsage('aiConversations');
    
    // Create session directly
    try {
      const response = await axios.post('/api/sessions/create', {
        userId: this.currentUser.id,
        topicId: 1,
        level: 'intermediate'
      });

      if (response.data.success) {
        this.currentSession = response.data.sessionId;
        this.currentTopic = {
          name: 'AI English Conversation',
          systemPrompt: 'You are a friendly AI assistant helping users practice English conversation.'
        };
        this.messages = [];
        this.showChatInterface();
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('세션 시작 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }

  async startVocabulary() {
    const topics = await axios.get('/api/topics');
    const vocabTopic = topics.data.topics.find(t => t.name === 'Vocabulary');
    if (vocabTopic) {
      this.startSession(vocabTopic.id, vocabTopic.name, '', vocabTopic.level);
    }
  }

  // Timer Mode - Premium Feature
  showTimerMode() {
    // Check if core or premium user
    if (!this.isCoreOrPremiumUser()) {
      alert('⏱️ 타이머 모드는 Core/Premium 전용 기능입니다!\n\n지금 업그레이드하고 압박 훈련을 시작하세요.');
      this.showPlan();
      return;
    }

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        ${this.getSidebar('timer-mode')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Mobile & Desktop Header with Back Button -->
          <div class="bg-white border-b border-purple-200 px-4 md:px-6 py-3">
            <div class="flex items-center gap-2 md:gap-4">
              <button onclick="worvox.showTopicSelection()" 
                class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
                <i class="fas fa-arrow-left text-xl"></i>
              </button>
              <div class="flex-1">
                <h1 class="text-lg md:text-2xl font-bold text-gray-800">
                  <i class="fas fa-stopwatch mr-2 text-purple-600"></i>타이머 모드
                </h1>
                <p class="hidden md:block text-gray-600 text-sm mt-1">압박 훈련으로 빠른 반응력 향상</p>
              </div>
              <span class="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs md:text-sm px-3 md:px-4 py-1 rounded-full font-bold">
                PREMIUM
              </span>
            </div>
          </div>
          
          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-8">
              <div class="max-w-4xl mx-auto">
                <!-- Intro Card -->
                <div class="bg-white rounded-2xl p-6 md:p-8 shadow-lg border-2 border-purple-200 mb-6">
                  <div class="text-center mb-6">
                    <div class="text-6xl mb-4">⏱️</div>
                    <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-3">타이머 모드</h2>
                    <p class="text-gray-600 text-lg">제한 시간 안에 문장을 완성하는 압박 훈련</p>
                  </div>
                  
                  <div class="bg-purple-50 rounded-xl p-6 mb-6">
                    <h3 class="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <i class="fas fa-info-circle text-purple-600"></i>
                      사용 방법
                    </h3>
                    <ol class="space-y-2 text-gray-700">
                      <li class="flex items-start gap-2">
                        <span class="font-bold text-purple-600">1.</span>
                        <span>시간 제한(5초 또는 10초)을 선택하세요</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="font-bold text-purple-600">2.</span>
                        <span>화면에 표시된 문장을 읽고 준비하세요</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="font-bold text-purple-600">3.</span>
                        <span><i class="fas fa-microphone text-emerald-500"></i> <strong>녹음 버튼</strong>을 누르면 타이머가 시작됩니다</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="font-bold text-purple-600">4.</span>
                        <span>제한 시간 안에 문장을 말하세요 (중단 없이!)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="font-bold text-purple-600">5.</span>
                        <span>타이머 종료 시 AI가 발음과 유창성을 분석합니다</span>
                      </li>
                    </ol>
                  </div>
                  
                  <!-- AI Prompt Status Banner -->
                  ${this.currentUser.use_ai_prompts && this.isPremiumUser() ? `
                  <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                    <div class="flex items-center gap-3">
                      <div class="text-3xl">🤖</div>
                      <div class="flex-1">
                        <h4 class="font-bold text-green-900 flex items-center gap-2">
                          <i class="fas fa-magic text-green-600"></i>
                          AI 프롬프트 생성 활성화
                        </h4>
                        <p class="text-sm text-green-700 mt-1">
                          ${
                            this.currentUser.level === 'beginner' ? '🌱 초급 레벨에 맞는 간단한 문장이 생성됩니다' :
                            this.currentUser.level === 'intermediate' ? '🌿 중급 레벨에 맞는 실용적인 문장이 생성됩니다' :
                            '🌳 고급 레벨에 맞는 심화 문장이 생성됩니다'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  ` : `
                  <div class="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 mb-6">
                    <div class="flex items-center gap-3">
                      <div class="text-3xl">📚</div>
                      <div class="flex-1">
                        <h4 class="font-bold text-gray-900">기본 문장 풀 사용</h4>
                        <p class="text-sm text-gray-600 mt-1">
                          50개의 고정된 문장으로 연습합니다
                          ${this.isPremiumUser() ? 
                            ' • <a href="#" onclick="worvox.showProfile(); return false;" class="text-purple-600 hover:underline">설정에서 AI 프롬프트를 활성화하세요</a>' : 
                            ' • <a href="#" onclick="worvox.showPaymentPage(); return false;" class="text-purple-600 hover:underline">Premium으로 업그레이드하여 AI 맞춤 문장을 받으세요</a>'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  `}
                  
                  <!-- Timer Selection -->
                  <div class="grid md:grid-cols-2 gap-4 mb-6">
                    <button onclick="worvox.startTimerChallenge(5)" 
                      class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-6 transition-all transform hover:scale-105">
                      <div class="text-4xl mb-2">⚡</div>
                      <div class="text-2xl font-bold mb-1">5초 챌린지</div>
                      <div class="text-blue-100 text-sm">빠른 반응 훈련</div>
                    </button>
                    
                    <button onclick="worvox.startTimerChallenge(10)" 
                      class="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl p-6 transition-all transform hover:scale-105">
                      <div class="text-4xl mb-2">🎯</div>
                      <div class="text-2xl font-bold mb-1">10초 챌린지</div>
                      <div class="text-purple-100 text-sm">정확한 발음 훈련</div>
                    </button>
                  </div>
                  
                  <!-- Benefits -->
                  <div class="grid md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                    <div class="text-center">
                      <div class="text-3xl mb-2">🚀</div>
                      <div class="font-bold text-gray-900 mb-1">빠른 반응력</div>
                      <div class="text-sm text-gray-600">즉각적인 대응 능력 향상</div>
                    </div>
                    <div class="text-center">
                      <div class="text-3xl mb-2">💪</div>
                      <div class="font-bold text-gray-900 mb-1">압박 극복</div>
                      <div class="text-sm text-gray-600">긴장 상황 대처 훈련</div>
                    </div>
                    <div class="text-center">
                      <div class="text-3xl mb-2">📊</div>
                      <div class="font-bold text-gray-900 mb-1">AI 분석</div>
                      <div class="text-sm text-gray-600">정확한 피드백 제공</div>
                    </div>
                  </div>
                </div>
              </div>
              
              ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Start Timer Challenge
  async startTimerChallenge(seconds) {
    let randomSentence, translation;

    // Check if AI prompts are enabled
    if (this.currentUser.use_ai_prompts && this.isPremiumUser()) {
      // 🚀 Option A: Enhanced loading with progress bar
      let progressValue = 0;
      const progressInterval = setInterval(() => {
        progressValue = Math.min(progressValue + Math.random() * 15, 95);
        const progressBar = document.getElementById('ai-progress-bar');
        const progressText = document.getElementById('ai-progress-text');
        if (progressBar) progressBar.style.width = `${progressValue}%`;
        if (progressText) progressText.textContent = `${Math.round(progressValue)}%`;
      }, 150);

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
          <div class="text-center text-white px-4 max-w-md w-full">
            <div class="text-6xl mb-4 animate-bounce">🤖</div>
            <h2 class="text-2xl font-bold mb-2">AI 프롬프트 생성 중...</h2>
            <p class="text-purple-200 mb-6">
              ${
                this.currentUser.level === 'beginner' ? '초급 레벨에 맞는 간단한 문장을 준비하고 있습니다' :
                this.currentUser.level === 'intermediate' ? '중급 레벨에 맞는 실용적인 문장을 준비하고 있습니다' :
                '고급 레벨에 맞는 심화 문장을 준비하고 있습니다'
              }
            </p>
            
            <div class="w-full bg-purple-800/30 rounded-full h-3 mb-3 overflow-hidden">
              <div id="ai-progress-bar" class="bg-gradient-to-r from-yellow-400 to-pink-400 h-3 rounded-full transition-all duration-300 ease-out" style="width: 0%"></div>
            </div>
            <p id="ai-progress-text" class="text-sm text-purple-200 mb-4">0%</p>
            
            <div class="flex items-center justify-center space-x-2 text-sm text-purple-200">
              <i class="fas fa-spinner fa-spin"></i>
              <span id="ai-status-text">캐시 확인 중...</span>
            </div>
          </div>
        </div>
      `;

      try {
        const updateStatus = (text) => {
          const statusEl = document.getElementById('ai-status-text');
          if (statusEl) statusEl.textContent = text;
        };

        console.log('🤖 Generating AI prompt for level:', this.currentUser.level);
        
        // 🚀 Option C: Check preloaded cache first
        const cacheKey = `ai_prompt_${this.currentUser.level}_timer`;
        if (this.preloadedPrompts && this.preloadedPrompts[cacheKey]) {
          console.log('⚡ Using preloaded prompt!');
          clearInterval(progressInterval);
          const progressBar = document.getElementById('ai-progress-bar');
          const progressText = document.getElementById('ai-progress-text');
          if (progressBar) progressBar.style.width = '100%';
          if (progressText) progressText.textContent = '100%';
          updateStatus('캐시에서 로드 완료! ⚡');
          
          const cached = this.preloadedPrompts[cacheKey];
          randomSentence = cached.sentence;
          translation = cached.translation;
          delete this.preloadedPrompts[cacheKey];
          await new Promise(resolve => setTimeout(resolve, 300));
        } else {
          updateStatus('AI 프롬프트 생성 중...');
          
          const response = await axios.post('/api/ai-prompts/generate', {
            mode: 'timer',
            level: this.currentUser.level,
            userId: this.currentUser.id,
            useCache: true
          });

          console.log('🤖 AI Response:', response.data);
          
          clearInterval(progressInterval);
          const progressBar = document.getElementById('ai-progress-bar');
          const progressText = document.getElementById('ai-progress-text');
          if (progressBar) progressBar.style.width = '100%';
          if (progressText) progressText.textContent = '100%';
          
          if (response.data.cached) {
            updateStatus('캐시에서 로드 완료! ⚡');
            console.log('✅ Using cached prompt');
          } else {
            updateStatus('새 프롬프트 생성 완료! ✨');
            console.log('✅ Generated new prompt');
          }

          if (response.data.success && response.data.data.sentence) {
            randomSentence = response.data.data.sentence;
            translation = response.data.data.translation || '✨ AI가 생성한 맞춤형 문장';
            console.log('✅ Using AI-generated prompt:', randomSentence);
            console.log('✅ Korean translation:', translation);
          } else {
            throw new Error('AI generation failed: ' + JSON.stringify(response.data));
          }
          
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // 🚀 Option C: Preload next prompt in background
        this.preloadNextPrompt();
      } catch (error) {
        clearInterval(progressInterval);
        console.error('❌ AI prompt generation failed:', error);
        console.error('Error details:', error.response?.data);
        
        alert('AI 프롬프트 생성에 실패했습니다.\n기본 문장 풀을 사용합니다.');
        ({ randomSentence, translation } = this.getDefaultTimerSentence());
      }
    } else {
      // Use default sentences pool
      console.log('📚 Using default sentence pool');
      ({ randomSentence, translation } = this.getDefaultTimerSentence());
    }
    
    this.renderTimerChallenge(seconds, randomSentence, translation);
  }

  // 🚀 Option C: Preload next prompt in background
  async preloadNextPrompt() {
    if (this.isPreloading || !this.currentUser) return;
    
    try {
      this.isPreloading = true;
      const cacheKey = `ai_prompt_${this.currentUser.level}_timer`;
      
      // Skip if already cached
      if (this.preloadedPrompts[cacheKey]) {
        console.log('⏩ Prompt already preloaded');
        this.isPreloading = false;
        return;
      }
      
      console.log('🔄 Preloading next prompt in background...');
      
      const response = await axios.post('/api/ai-prompts/generate', {
        mode: 'timer',
        level: this.currentUser.level,
        userId: this.currentUser.id,
        useCache: true
      });
      
      if (response.data.success && response.data.data.sentence) {
        this.preloadedPrompts[cacheKey] = {
          sentence: response.data.data.sentence,
          translation: response.data.data.translation
        };
        console.log('✅ Next prompt preloaded successfully!');
      }
    } catch (error) {
      console.error('⚠️ Preload failed (non-critical):', error);
    } finally {
      this.isPreloading = false;
    }
  }

  getDefaultTimerSentence() {
    // Sample sentences for timer challenge (50 intermediate-advanced level sentences)
    const sentences = [
      "I believe that consistent practice is the key to mastering any skill.",
      "The weather forecast predicts heavy rain throughout the weekend.",
      "She decided to pursue her dream of becoming a professional photographer.",
      "Learning a new language opens doors to different cultures and perspectives.",
      "Technology has fundamentally changed the way we communicate with each other.",
      "Regular exercise and a balanced diet are essential for maintaining good health.",
      "The company announced plans to expand its operations into international markets.",
      "Reading books helps improve vocabulary and critical thinking skills.",
      "He graduated from university with honors in computer science.",
      "Environmental protection should be a priority for all governments worldwide.",
      "The research team discovered a breakthrough in renewable energy technology.",
      "Many successful entrepreneurs attribute their achievements to persistent effort and adaptability.",
      "Climate change poses significant challenges to agricultural production in many regions.",
      "The museum's collection includes masterpieces from various historical periods.",
      "Effective communication requires both active listening and clear expression of ideas.",
      "The financial advisor recommended diversifying investments to minimize potential risks.",
      "Scientists have made remarkable progress in understanding the human brain's complexity.",
      "The conference brought together experts from diverse fields to discuss innovation.",
      "Public transportation systems play a crucial role in reducing urban traffic congestion.",
      "Cultural exchange programs help students develop a broader worldview and understanding.",
      "The architect designed a building that seamlessly blends modern and traditional elements.",
      "Online education platforms have revolutionized access to quality learning resources.",
      "The negotiation process requires patience, strategic thinking, and mutual respect.",
      "Artificial intelligence is transforming industries ranging from healthcare to manufacturing.",
      "The documentary explored the fascinating relationship between humans and wildlife.",
      "Collaboration among team members is essential for achieving ambitious project goals.",
      "The pharmaceutical company invested heavily in developing new treatment methods.",
      "Historical events continue to shape contemporary political and social landscapes.",
      "The artist's work challenges conventional perspectives and encourages critical reflection.",
      "Economic policies must balance growth objectives with social welfare considerations.",
      "Remote work arrangements offer flexibility but require strong self-discipline and time management.",
      "The chef combines traditional recipes with innovative cooking techniques.",
      "Understanding different perspectives is fundamental to resolving conflicts effectively.",
      "The startup secured substantial funding from venture capital investors.",
      "Archaeological discoveries provide valuable insights into ancient civilizations and cultures.",
      "Professional development opportunities help employees enhance their skills and career prospects.",
      "The novel examines complex themes of identity, belonging, and personal transformation.",
      "Sustainable business practices benefit both the environment and long-term profitability.",
      "The legal framework establishes clear guidelines for protecting intellectual property rights.",
      "Community engagement initiatives strengthen social bonds and collective problem-solving capacity.",
      "The presentation outlined strategic priorities for the organization's future development.",
      "Consumer preferences have shifted significantly toward environmentally conscious products.",
      "The medical breakthrough offers hope for patients with previously untreatable conditions.",
      "Leadership requires the ability to inspire others while making difficult decisions.",
      "The software update introduces enhanced security features and improved user experience.",
      "International cooperation is essential for addressing global challenges effectively.",
      "The performance showcased extraordinary talent and years of dedicated training.",
      "Data analytics provides companies with actionable insights for informed decision-making.",
      "The policy aims to promote equal opportunities and reduce systemic inequalities.",
      "Innovation thrives in environments that encourage experimentation and embrace calculated risks."
    ];
    
    const randomIndex = Math.floor(Math.random() * sentences.length);
    const randomSentence = sentences[randomIndex];
    
    // Translation map for sentences (partial coverage)
    const translations = [
      "일관된 연습이 어떤 기술이든 마스터하는 핵심이라고 믿습니다.",
      "일기예보에 따르면 주말 내내 많은 비가 예상됩니다.",
      "그녀는 전문 사진작가가 되려는 꿈을 추구하기로 결심했습니다.",
      "새로운 언어를 배우는 것은 다른 문화와 관점의 문을 열어줍니다.",
      "기술은 우리가 서로 소통하는 방식을 근본적으로 변화시켰습니다.",
      "규칙적인 운동과 균형 잡힌 식단은 건강 유지에 필수적입니다.",
      "회사는 해외 시장으로 사업을 확장할 계획을 발표했습니다.",
      "책을 읽는 것은 어휘력과 비판적 사고 능력을 향상시키는 데 도움이 됩니다.",
      "그는 컴퓨터 과학 전공으로 우등 졸업을 했습니다.",
      "환경 보호는 전 세계 모든 정부의 우선순위가 되어야 합니다."
    ];
    const translation = translations[randomIndex] || '';
    
    return { randomSentence, translation };
  }

  renderTimerChallenge(seconds, randomSentence, translation) {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
        <div class="flex-1 flex flex-col items-center justify-center p-4">
          <!-- Back Button -->
          <button onclick="worvox.showTimerMode()" 
            class="absolute top-4 left-4 md:top-6 md:left-6 text-white/70 hover:text-white transition-all p-2 hover:bg-white/10 rounded-lg">
            <i class="fas fa-arrow-left text-xl mr-2"></i><span class="hidden md:inline">뒤로가기</span>
          </button>
          
          <!-- Timer Display -->
          <div id="timerDisplay" class="text-center mb-8">
            <div class="text-8xl md:text-9xl font-bold text-white mb-4" id="timerCountdown">${seconds}</div>
            <div class="text-2xl text-purple-200 font-medium">준비하세요...</div>
          </div>
          
          <!-- Sentence Card -->
          <div class="bg-white rounded-2xl p-8 md:p-12 shadow-2xl max-w-4xl w-full mb-8">
            <div class="text-center mb-6">
              <div class="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-bold mb-4">
                ${seconds}초 챌린지
              </div>
            </div>
            <p class="text-2xl md:text-3xl text-gray-900 leading-relaxed text-center font-medium mb-4" id="challengeSentence">
              ${randomSentence}
            </p>
            <p class="text-base text-gray-600 text-center italic" id="challengeTranslation">
              ${translation}
            </p>
          </div>
          
          <!-- Recording Button -->
          <div class="text-center mb-4">
            <button id="timerRecordBtn" 
              onclick="worvox.startTimerCountdown()" 
              ontouchstart="this.style.transform='scale(0.95)'" 
              ontouchend="this.style.transform='scale(1)'"
              class="w-20 h-20 md:w-24 md:h-24 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-2xl mx-auto transform hover:scale-105 active:scale-95">
              <i class="fas fa-microphone text-3xl md:text-4xl"></i>
            </button>
            <div class="text-white text-lg mt-4" id="instructionText">
              준비되면 녹음 버튼을 눌러 시작하세요
            </div>
            <div class="text-purple-200 text-sm mt-2" id="statusText">
              문장을 읽고 준비되면 버튼을 누르세요
            </div>
          </div>
          
          <!-- Recording Indicator (Hidden initially) -->
          <div id="recordingIndicator" class="hidden mt-6">
            <div class="flex items-center gap-3 bg-red-500 text-white px-6 py-3 rounded-full animate-pulse">
              <div class="w-3 h-3 bg-white rounded-full animate-ping"></div>
              <span class="font-bold">녹음 중...</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Store challenge data
    this.timerChallenge = {
      seconds: seconds,
      sentence: randomSentence,
      translation: translation,
      started: false,
      recording: false
    };
  }

  // Start Timer Countdown
  async startTimerCountdown() {
    console.log('🎬 startTimerCountdown called');
    
    // Prevent multiple starts
    if (this.timerChallenge && this.timerChallenge.started) {
      console.log('⚠️ Timer already started');
      return;
    }
    
    if (!this.timerChallenge) {
      console.error('❌ timerChallenge is not initialized');
      return;
    }
    
    this.timerChallenge.started = true;
    console.log('✅ Timer challenge started flag set');
    
    // Track timer mode usage (non-blocking)
    try {
      this.incrementDailyUsage('timer_mode');
      console.log('✅ Usage tracked');
    } catch (error) {
      console.warn('⚠️ Failed to track usage:', error);
      // Continue anyway
    }
    
    // Create session for timer mode
    try {
      const sessionResponse = await axios.post('/api/sessions/create', {
        userId: this.currentUser.id,
        topicId: 999, // Special ID for timer mode
        level: this.currentUser.level || 'intermediate'
      });
      this.timerChallenge.sessionId = sessionResponse.data.sessionId;
      console.log('✅ Timer session created:', this.timerChallenge.sessionId);
    } catch (error) {
      console.warn('⚠️ Failed to create timer session:', error);
    }
    
    const countdownEl = document.getElementById('timerCountdown');
    const instructionEl = document.getElementById('instructionText');
    const statusEl = document.getElementById('statusText');
    const recordingIndicator = document.getElementById('recordingIndicator');
    const recordBtn = document.getElementById('timerRecordBtn');
    
    console.log('📝 UI elements found:', {
      countdownEl: !!countdownEl,
      instructionEl: !!instructionEl,
      statusEl: !!statusEl,
      recordingIndicator: !!recordingIndicator,
      recordBtn: !!recordBtn
    });
    
    // Update UI
    if (instructionEl) instructionEl.innerHTML = '🎤 지금 말하세요!';
    if (statusEl) statusEl.textContent = '타이머가 시작되었습니다. 문장을 말하세요!';
    if (recordingIndicator) recordingIndicator.classList.remove('hidden');
    
    // Disable record button
    if (recordBtn) {
      recordBtn.disabled = true;
      recordBtn.classList.remove('bg-emerald-500', 'hover:bg-emerald-600');
      recordBtn.classList.add('bg-red-600', 'cursor-not-allowed');
      recordBtn.innerHTML = '<i class="fas fa-microphone text-3xl md:text-4xl animate-pulse"></i>';
    }
    
    console.log('✅ UI updated');
    
    // Start recording with proper audio configuration
    console.log('🎤 Starting recording...');
    try {
      await this.startTimerRecording();
      console.log('✅ Recording started successfully');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      alert('마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
      this.timerChallenge.started = false;
      this.showTimerMode();
      return;
    }
    
    // Countdown
    let timeLeft = this.timerChallenge.seconds;
    console.log('⏱️ Starting countdown from:', timeLeft);
    
    const interval = setInterval(() => {
      timeLeft--;
      if (countdownEl) {
        countdownEl.textContent = timeLeft;
      }
      console.log('⏱️ Time left:', timeLeft);
      
      // Color change as time runs out
      if (timeLeft <= 3 && countdownEl) {
        countdownEl.classList.add('text-red-400');
      }
      
      if (timeLeft <= 0) {
        console.log('⏱️ Time\'s up! Ending challenge...');
        clearInterval(interval);
        this.endTimerChallenge();
      }
    }, 1000);
    
    console.log('✅ Countdown started, interval ID:', interval);
  }

  // Start Timer Recording
  async startTimerRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to use audio/webm with opus codec, fallback to default
      let options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log('audio/webm;codecs=opus not supported, trying audio/webm');
        options = { mimeType: 'audio/webm' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.log('audio/webm not supported, using default');
          options = {};
        }
      }
      
      this.mediaRecorder = new MediaRecorder(stream, options);
      this.audioChunks = [];
      
      console.log('Timer Mode: MediaRecorder created with mimeType:', this.mediaRecorder.mimeType);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log('Timer Mode: Audio chunk received, size:', event.data.size);
        }
      };
      
      this.mediaRecorder.onstop = async () => {
        const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        console.log('Timer Mode: Recording stopped. Blob size:', audioBlob.size, 'type:', audioBlob.type);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        await this.analyzeTimerPerformance(audioBlob);
      };
      
      this.mediaRecorder.start();
      this.timerChallenge.recording = true;
      console.log('Timer Mode: Recording started');
    } catch (error) {
      console.error('Timer Mode: Recording error:', error);
      if (error.name === 'NotAllowedError') {
        alert('마이크 접근 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
      } else {
        alert('마이크에 접근할 수 없습니다: ' + error.message);
      }
    }
  }

  // End Timer Challenge
  async endTimerChallenge() {
    console.log('Timer Mode: Ending challenge');
    
    // Stop recording
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      console.log('Timer Mode: Stopping recorder');
      this.mediaRecorder.stop();
    }
    
    // Show completion message
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 items-center justify-center p-4">
        <div class="bg-white rounded-2xl p-8 md:p-12 shadow-2xl max-w-2xl w-full text-center">
          <div class="text-6xl mb-4">⏱️</div>
          <h2 class="text-3xl font-bold text-gray-900 mb-3">시간 종료!</h2>
          <p class="text-gray-600 text-lg mb-6">AI가 당신의 발음을 분석하고 있습니다...</p>
          <div class="flex items-center justify-center gap-2 mb-8">
            <div class="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
            <div class="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
            <div class="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
          </div>
        </div>
      </div>
    `;
  }

  // Analyze Timer Performance
  async analyzeTimerPerformance(audioBlob) {
    try {
      console.log('Timer Mode: Analyzing performance...');
      console.log('Timer Mode: Audio blob size:', audioBlob.size, 'type:', audioBlob.type);
      
      if (audioBlob.size === 0) {
        console.error('Timer Mode: Audio blob is empty');
        this.showTimerResults('(녹음된 오디오가 없습니다)');
        return;
      }
      
      // Convert audio to text using STT
      const formData = new FormData();
      // Determine file extension based on mime type
      const fileExt = audioBlob.type.includes('webm') ? 'webm' : 
                     audioBlob.type.includes('mp4') ? 'm4a' : 
                     audioBlob.type.includes('mpeg') ? 'mp3' : 'webm';
      formData.append('audio', audioBlob, `timer-recording.${fileExt}`);
      
      console.log('Timer Mode: Sending audio to STT API...');
      const sttResponse = await axios.post('/api/stt/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('Timer Mode: STT response:', sttResponse.data);
      const transcription = sttResponse.data.transcription || sttResponse.data.text || '';
      const audioAnalysis = sttResponse.data.analysis || null;
      console.log('Timer Mode: Transcription:', transcription);
      console.log('Timer Mode: Audio analysis:', audioAnalysis);
      
      // Create audio URL for playback
      const audioUrl = URL.createObjectURL(audioBlob);
      this.timerChallenge.audioUrl = audioUrl;
      
      // Show results with analysis data
      this.showTimerResults(transcription, audioAnalysis);
      
    } catch (error) {
      console.error('Timer Mode: Analysis error:', error);
      console.error('Timer Mode: Error response:', error.response?.data);
      
      let errorMsg = '(분석 실패)';
      if (error.response?.data?.error) {
        errorMsg = `(${error.response.data.error})`;
      } else if (error.message) {
        errorMsg = `(${error.message})`;
      }
      
      this.showTimerResults(errorMsg);
    }
  }

  // Show Timer Results
  async showTimerResults(transcription, audioAnalysis = null) {
    const originalSentence = this.timerChallenge.sentence;
    const timeLimit = this.timerChallenge.seconds;
    
    // End timer session if exists
    if (this.timerChallenge.sessionId) {
      try {
        // Save result as messages
        await axios.post('/api/messages/create', {
          sessionId: this.timerChallenge.sessionId,
          role: 'system',
          content: `타이머 모드 ${timeLimit}초: ${originalSentence}`
        });
        
        await axios.post('/api/messages/create', {
          sessionId: this.timerChallenge.sessionId,
          role: 'user',
          content: transcription || '(인식되지 않음)'
        });
        
        // End session
        await axios.post(`/api/sessions/end/${this.timerChallenge.sessionId}`);
        console.log('✅ Timer session ended');
      } catch (error) {
        console.warn('⚠️ Failed to save timer session:', error);
      }
    }
    
    // Save session ID for later report saving
    const sessionId = this.timerChallenge.sessionId;
    
    // Simple similarity check (word count comparison)
    const originalWords = originalSentence.toLowerCase().split(' ').length;
    const spokenWords = transcription.toLowerCase().split(' ').length;
    const completeness = Math.min(100, Math.round((spokenWords / originalWords) * 100));
    
    // 🎯 Initial scores (STT-based, instant)
    let accuracyScore = completeness; // Default based on word count
    let pronunciationScore = audioAnalysis?.pronunciationScore || 75; // From STT analysis
    let fluencyScore = audioAnalysis?.fluencyScore || 70; // From STT analysis
    let feedback = ''
    let isPremiumAnalysis = false;
    
    // Calculate initial average score for rating
    const initialAverageScore = Math.round((accuracyScore + pronunciationScore + fluencyScore) / 3);
    
    // Determine initial rating
    let rating, ratingColor, ratingIcon;
    if (initialAverageScore >= 90) {
      rating = '완벽해요!';
      ratingColor = 'text-green-600';
      ratingIcon = '🌟';
    } else if (initialAverageScore >= 80) {
      rating = '훌륭해요!';
      ratingColor = 'text-blue-600';
      ratingIcon = '🎉';
    } else if (initialAverageScore >= 70) {
      rating = '잘했어요!';
      ratingColor = 'text-purple-600';
      ratingIcon = '👍';
    } else if (initialAverageScore >= 60) {
      rating = '괜찮아요!';
      ratingColor = 'text-yellow-600';
      ratingIcon = '😊';
    } else {
      rating = '연습이 필요해요';
      ratingColor = 'text-orange-600';
      ratingIcon = '💪';
    }
    
    // 🚀 STEP 1: Show results immediately with STT-based scores
    this.renderTimerResults({
      originalSentence,
      transcription,
      timeLimit,
      accuracyScore,
      pronunciationScore,
      fluencyScore,
      averageScore: initialAverageScore,
      rating,
      ratingColor,
      ratingIcon,
      feedback: '', // No feedback yet
      isPremiumAnalysis: false,
      originalWords,
      spokenWords,
      isLoading: this.currentUser?.plan === 'premium' && transcription && transcription !== '(인식되지 않음)'
    });
    
    // 🚀 STEP 2: Two-stage AI analysis (Premium only)
    if (transcription && transcription !== '(인식되지 않음)' && this.currentUser?.plan === 'premium') {
      // Stage 1: Quick scores calculation (~500ms)
      setTimeout(async () => {
        try {
          console.log('⚡ Stage 1: Getting quick scores...');
          const quickStartTime = Date.now();
          
          const quickResponse = await axios.post('/api/pronunciation/analyze-quick', {
            referenceText: originalSentence,
            userTranscription: transcription,
            audioAnalysis: audioAnalysis
          });
          
          console.log(`⚡ Quick scores received in ${Date.now() - quickStartTime}ms`);
          
          if (quickResponse.data.success) {
            // Update with quick scores immediately
            accuracyScore = quickResponse.data.accuracy;
            pronunciationScore = quickResponse.data.pronunciation;
            fluencyScore = quickResponse.data.fluency;
            
            const quickAverageScore = Math.round((accuracyScore + pronunciationScore + fluencyScore) / 3);
            
            // Update rating based on quick scores
            if (quickAverageScore >= 90) {
              rating = '완벽해요!';
              ratingColor = 'text-green-600';
              ratingIcon = '🌟';
            } else if (quickAverageScore >= 80) {
              rating = '훌륭해요!';
              ratingColor = 'text-blue-600';
              ratingIcon = '🎉';
            } else if (quickAverageScore >= 70) {
              rating = '잘했어요!';
              ratingColor = 'text-purple-600';
              ratingIcon = '👍';
            } else if (quickAverageScore >= 60) {
              rating = '괜찮아요!';
              ratingColor = 'text-yellow-600';
              ratingIcon = '😊';
            } else {
              rating = '연습이 필요해요';
              ratingColor = 'text-orange-600';
              ratingIcon = '💪';
            }
            
            console.log('⚡ Quick scores calculated, rendering results...');
            
            // Render with quick scores (no feedback yet)
            this.renderTimerResults({
              originalSentence,
              transcription,
              timeLimit,
              accuracyScore,
              pronunciationScore,
              fluencyScore,
              averageScore: quickAverageScore,
              rating,
              ratingColor,
              ratingIcon,
              feedback: '', // Loading feedback...
              pronunciationIssues: [],
              isPremiumAnalysis: false,
              originalWords,
              spokenWords,
              isLoading: true, // Show loading state for detailed feedback
              loadingMessage: '🤖 발음 피드백 생성 중...'
            });
            
            // Stage 2: Detailed AI feedback in background (~5 seconds)
            console.log('🎯 Stage 2: Loading detailed AI feedback...');
            const detailedStartTime = Date.now();
            
            const analysisResponse = await axios.post('/api/pronunciation/analyze', {
              referenceText: originalSentence,
              userTranscription: transcription,
              audioAnalysis: audioAnalysis
            });
            
            console.log(`⏱️ Detailed analysis completed in ${Date.now() - detailedStartTime}ms`);
            
            if (analysisResponse.data.success) {
              // Update with detailed pronunciation feedback
              feedback = analysisResponse.data.pronunciationFeedback || '';
              const pronunciationIssues = analysisResponse.data.pronunciationIssues || [];
              isPremiumAnalysis = true;
              
              // Optionally refine scores with AI analysis
              const aiAccuracy = analysisResponse.data.accuracy;
              const aiPronunciation = analysisResponse.data.pronunciation;
              const aiFluency = analysisResponse.data.fluency;
              
              // Blend quick scores with AI scores (70% quick, 30% AI for smooth transition)
              accuracyScore = Math.round(accuracyScore * 0.7 + aiAccuracy * 0.3);
              pronunciationScore = Math.round(pronunciationScore * 0.7 + aiPronunciation * 0.3);
              fluencyScore = Math.round(fluencyScore * 0.7 + aiFluency * 0.3);
              
              const finalAverageScore = Math.round((accuracyScore + pronunciationScore + fluencyScore) / 3);
              
              // Update rating if needed
              if (finalAverageScore >= 90) {
                rating = '완벽해요!';
                ratingColor = 'text-green-600';
                ratingIcon = '🌟';
              } else if (finalAverageScore >= 80) {
                rating = '훌륭해요!';
                ratingColor = 'text-blue-600';
                ratingIcon = '🎉';
              } else if (finalAverageScore >= 70) {
                rating = '잘했어요!';
                ratingColor = 'text-purple-600';
                ratingIcon = '👍';
              } else if (finalAverageScore >= 60) {
                rating = '괜찮아요!';
                ratingColor = 'text-yellow-600';
                ratingIcon = '😊';
              } else {
                rating = '연습이 필요해요';
                ratingColor = 'text-orange-600';
                ratingIcon = '💪';
              }
              
              console.log('✅ Detailed feedback loaded, updating results...');
              
              // Re-render with complete AI analysis
              this.renderTimerResults({
                originalSentence,
                transcription,
                timeLimit,
                accuracyScore,
                pronunciationScore,
                fluencyScore,
                averageScore: finalAverageScore,
                rating,
                ratingColor,
                ratingIcon,
                feedback,
                pronunciationIssues,
                isPremiumAnalysis,
                originalWords,
                spokenWords,
                isLoading: false
              });
              
              // Save report with AI analysis
              if (sessionId && this.currentUser) {
                try {
                  const reportData = {
                    originalSentence,
                    transcription,
                    timeLimit,
                    accuracyScore,
                    pronunciationScore,
                    fluencyScore,
                    averageScore: finalAverageScore,
                    rating,
                    feedback,
                    pronunciationIssues,
                    isPremiumAnalysis,
                    completedAt: new Date().toISOString()
                  };
                  
                  await axios.post('/api/mode-reports/save', {
                    sessionId: sessionId,
                    userId: this.currentUser.id,
                    modeType: 'timer',
                    reportData: reportData
                  });
                  console.log('✅ Timer report saved with AI analysis');
                } catch (error) {
                  console.warn('⚠️ Failed to save timer report:', error);
                }
              }
            } // ← End of if (analysisResponse.data.success)
          } // ← End of if (quickResponse.data.success)
        } catch (error) {
          console.warn('⚠️ Failed to get AI analysis:', error);
          // Keep showing STT-based results
        }
      }, 100); // Start after 100ms
    }
  }
  
  // Render timer results (can be called multiple times for streaming updates)
  renderTimerResults(data) {
    const {
      originalSentence,
      transcription,
      timeLimit,
      accuracyScore,
      pronunciationScore,
      fluencyScore,
      averageScore,
      rating,
      ratingColor,
      ratingIcon,
      feedback,
      isPremiumAnalysis,
      originalWords,
      spokenWords,
      isLoading = false
    } = data;
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        ${this.getSidebar('timer-mode')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Header -->
          <div class="bg-white border-b border-purple-200 px-4 md:px-6 py-3">
            <h2 class="text-lg font-semibold text-gray-800">
              <i class="fas fa-chart-bar mr-2 text-purple-600"></i>타이머 챌린지 결과
            </h2>
          </div>
          
          <!-- Content -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-8">
              <div class="max-w-4xl mx-auto">
                <!-- Rating Card -->
                <div class="bg-white rounded-2xl p-8 shadow-lg border-2 border-purple-200 mb-6 text-center">
                  <div class="text-6xl mb-4">${ratingIcon}</div>
                  <h2 class="text-3xl font-bold ${ratingColor} mb-2">${rating}</h2>
                  <div class="text-5xl font-bold text-purple-600 mb-2">${averageScore}점</div>
                  <p class="text-gray-600">평균 점수</p>
                </div>
                
                <!-- Score Breakdown -->
                <div class="bg-white rounded-2xl p-6 shadow-lg mb-6">
                  <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i class="fas fa-chart-line text-purple-600"></i>
                    상세 점수
                  </h3>
                  
                  <div class="grid grid-cols-3 gap-6 mb-6 max-w-2xl mx-auto">
                    <div class="text-center">
                      <div class="text-gray-600 text-sm mb-2">정확성</div>
                      <div class="relative w-24 h-24 mx-auto">
                        <svg class="transform -rotate-90 w-24 h-24">
                          <circle cx="48" cy="48" r="36" stroke="#e5e7eb" stroke-width="8" fill="none" />
                          <circle cx="48" cy="48" r="36" stroke="#3b82f6" stroke-width="8" fill="none"
                            stroke-dasharray="${2 * Math.PI * 36}" 
                            stroke-dashoffset="${2 * Math.PI * 36 * (1 - accuracyScore / 100)}" 
                            stroke-linecap="round" />
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center">
                          <span class="text-xl font-bold text-blue-600">${accuracyScore}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div class="text-center">
                      <div class="text-gray-600 text-sm mb-2">발음</div>
                      <div class="relative w-24 h-24 mx-auto">
                        <svg class="transform -rotate-90 w-24 h-24">
                          <circle cx="48" cy="48" r="36" stroke="#e5e7eb" stroke-width="8" fill="none" />
                          <circle cx="48" cy="48" r="36" stroke="#10b981" stroke-width="8" fill="none"
                            stroke-dasharray="${2 * Math.PI * 36}" 
                            stroke-dashoffset="${2 * Math.PI * 36 * (1 - pronunciationScore / 100)}" 
                            stroke-linecap="round" />
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center">
                          <span class="text-xl font-bold text-green-600">${pronunciationScore}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div class="text-center">
                      <div class="text-gray-600 text-sm mb-2">유창성</div>
                      <div class="relative w-24 h-24 mx-auto">
                        <svg class="transform -rotate-90 w-24 h-24">
                          <circle cx="48" cy="48" r="36" stroke="#e5e7eb" stroke-width="8" fill="none" />
                          <circle cx="48" cy="48" r="36" stroke="#f59e0b" stroke-width="8" fill="none"
                            stroke-dasharray="${2 * Math.PI * 36}" 
                            stroke-dashoffset="${2 * Math.PI * 36 * (1 - fluencyScore / 100)}" 
                            stroke-linecap="round" />
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center">
                          <span class="text-lg font-bold text-purple-600">${grammarScore || 70}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Details -->
                <div class="bg-white rounded-2xl p-6 shadow-lg mb-6">
                  <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i class="fas fa-clipboard-list text-purple-600"></i>
                    상세 결과
                  </h3>
                  
                  <div class="space-y-4">
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <div class="text-sm text-gray-600">원본 문장</div>
                        <button onclick="worvox.playReferenceAudio('${originalSentence.replace(/'/g, "\\'")}', 0)" 
                          class="text-blue-600 hover:text-blue-800 text-xs px-3 py-1 rounded hover:bg-blue-50 transition-all">
                          <i class="fas fa-volume-up mr-1"></i>원문 듣기
                        </button>
                      </div>
                      <div class="bg-gray-50 rounded-lg p-4 text-gray-900 mb-2">${originalSentence}</div>
                      <div class="text-xs text-gray-500 italic px-4">${this.timerChallenge.translation || ''}</div>
                    </div>
                    
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <div class="text-sm text-gray-600">당신이 말한 내용</div>
                        ${this.timerChallenge.audioUrl ? `
                          <button onclick="worvox.playUserRecording('${this.timerChallenge.audioUrl}', 0)" 
                            class="text-purple-600 hover:text-purple-800 text-xs px-3 py-1 rounded hover:bg-purple-50 transition-all">
                            <i class="fas fa-play mr-1"></i>내 발음 듣기
                          </button>
                        ` : ''}
                      </div>
                      <div class="bg-purple-50 rounded-lg p-4 text-gray-900">${transcription || '(인식되지 않음)'}</div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div class="text-center">
                        <div class="text-2xl font-bold text-purple-600">${timeLimit}초</div>
                        <div class="text-sm text-gray-600">시간 제한</div>
                      </div>
                      <div class="text-center">
                        <div class="text-2xl font-bold text-purple-600">${spokenWords}/${originalWords}</div>
                        <div class="text-sm text-gray-600">단어 수</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- AI Feedback -->
                ${isLoading ? `
                <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 shadow-lg mb-6 border-2 border-blue-200">
                  <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i class="fas fa-robot text-blue-600"></i>
                    💎 AI 코치 분석 (Premium)
                  </h3>
                  <div class="bg-white rounded-xl p-6">
                    <!-- Progress indicator -->
                    <div class="flex items-center justify-center mb-4">
                      <div class="relative w-16 h-16">
                        <svg class="transform -rotate-90 w-16 h-16">
                          <circle cx="32" cy="32" r="28" stroke="#e5e7eb" stroke-width="4" fill="none" />
                          <circle cx="32" cy="32" r="28" stroke="#8b5cf6" stroke-width="4" fill="none"
                            stroke-dasharray="${2 * Math.PI * 28}" 
                            stroke-dashoffset="${2 * Math.PI * 28 * 0.3}" 
                            stroke-linecap="round"
                            class="animate-spin" style="animation-duration: 2s;" />
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center">
                          <i class="fas fa-brain text-purple-600 text-xl"></i>
                        </div>
                      </div>
                    </div>
                    <div class="text-center">
                      <p class="text-lg font-semibold text-gray-800 mb-2">
                        ${data.loadingMessage || '🤖 AI가 상세 피드백 생성 중...'}
                      </p>
                      <p class="text-sm text-gray-600">
                        점수는 이미 계산되었습니다! 상세한 피드백을 준비하고 있어요.
                      </p>
                      <div class="mt-4 flex items-center justify-center gap-2 text-xs text-purple-600">
                        <i class="fas fa-check-circle"></i>
                        <span>음성 인식 완료</span>
                        <i class="fas fa-check-circle ml-3"></i>
                        <span>점수 계산 완료</span>
                        <i class="fas fa-spinner fa-spin ml-3"></i>
                        <span>피드백 생성 중...</span>
                      </div>
                    </div>
                  </div>
                </div>
                ` : isPremiumAnalysis && feedback ? `
                <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 shadow-lg mb-6 border-2 border-blue-200">
                  <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i class="fas fa-robot text-blue-600"></i>
                    💎 AI 코치 분석 (Premium)
                  </h3>
                  <div class="space-y-4">
                    <!-- Pronunciation Feedback -->
                    <div class="bg-white rounded-xl p-5">
                      <h4 class="font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <i class="fas fa-microphone text-blue-600"></i>
                        발음 피드백
                      </h4>
                      <div class="text-gray-700 leading-relaxed whitespace-pre-line">
                        ${feedback}
                      </div>
                    </div>
                    
                    ${data.pronunciationIssues && data.pronunciationIssues.length > 0 ? `
                    <!-- Pronunciation Issues -->
                    <div class="bg-white rounded-xl p-5 border-2 border-green-200">
                      <h4 class="font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <i class="fas fa-lightbulb text-green-600"></i>
                        발음 개선 포인트
                      </h4>
                      <div class="space-y-3">
                        ${data.pronunciationIssues.map(issue => `
                          <div class="bg-green-50 rounded-lg p-3">
                            <div class="font-semibold text-gray-800 mb-1">
                              <i class="fas fa-volume-up text-green-600 mr-2"></i>"${issue.word}" 발음
                            </div>
                            <div class="text-sm text-gray-700 mb-2">
                              <span class="text-red-600">문제:</span> ${issue.issue}
                            </div>
                            <div class="text-sm text-green-700">
                              <i class="fas fa-check-circle mr-1"></i>${issue.tip}
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                    ` : ''}
                  </div>
                </div>
                ` : `
                ${this.currentUser?.plan !== 'premium' ? `
                <div class="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 shadow-lg mb-6 border-2 border-blue-200">
                  <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i class="fas fa-robot text-blue-600"></i>
                    AI 코치 분석 (Premium 전용)
                  </h3>
                  <div class="relative bg-white rounded-xl p-5">
                    <!-- Blurred content -->
                    <div class="text-gray-700 leading-relaxed blur-sm select-none pointer-events-none">
                      발음과 유창성이 훌륭했습니다! 특히 문장 전체를 자연스럽게 전달하셨고, 강세와 리듬이 원어민에 가까웠어요. 다만 일부 자음 발음이 살짝 약했는데, 입술을 더 힘있게 사용하면 더 명확해집니다. 전반적으로 매우 좋은 발음이니 자신감을 가지고 계속 연습하세요!
                    </div>
                    <!-- Upgrade overlay -->
                    <div class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
                      <div class="text-center p-6">
                        <i class="fas fa-crown text-yellow-500 text-4xl mb-3"></i>
                        <h4 class="text-lg font-bold text-gray-900 mb-2">상세한 AI 분석을 받아보세요!</h4>
                        <p class="text-sm text-gray-600 mb-4">
                          발음 문제점, 개선 방법, 격려 메시지까지<br>
                          AI 코치의 1:1 맞춤 피드백
                        </p>
                        <button onclick="worvox.showPlan()" class="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl transition-all">
                          <i class="fas fa-crown mr-2"></i>Premium으로 분석 받기
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                ` : ''}
                `}
                
                <!-- Actions -->
                <div class="grid md:grid-cols-2 gap-4">
                  <button onclick="worvox.startTimerChallenge(${timeLimit})" 
                    class="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl p-4 font-bold transition-all">
                    <i class="fas fa-redo mr-2"></i>다시 도전하기
                  </button>
                  <button onclick="worvox.showTimerMode()" 
                    class="bg-white hover:bg-gray-50 border-2 border-purple-200 text-purple-600 rounded-xl p-4 font-bold transition-all">
                    <i class="fas fa-home mr-2"></i>돌아가기
                  </button>
                </div>
              </div>
              
              ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ========================================
  // Scenario Mode (Core/Premium Feature)
  // ========================================
  
  showScenarioMode() {
    // Check if core or premium user
    if (!this.isCoreOrPremiumUser()) {
      alert('🎬 시나리오 모드는 Core/Premium 전용 기능입니다!\n\n실제 상황 기반 30가지 대화를 연습하고 실력을 향상하세요.');
      this.showPlan();
      return;
    }
    
    // Check usage limit
    if (!this.checkUsageLimit('scenarioMode')) {
      return;
    }

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        ${this.getSidebar('scenario-mode')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Mobile Header -->
          <div class="md:hidden bg-white border-b border-blue-200 px-4 py-3">
            <div class="flex items-center justify-between">
              <button onclick="worvox.showTopicSelection()" class="text-gray-600">
                <i class="fas fa-arrow-left text-xl"></i>
              </button>
              <h1 class="text-lg font-semibold text-gray-800">시나리오 모드</h1>
              <div class="w-6"></div>
            </div>
          </div>
          
          <!-- Desktop Top Bar -->
          <div class="hidden md:flex bg-white border-b border-blue-200 px-6 py-3 items-center gap-4">
            <button onclick="worvox.showTopicSelection()" 
              class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
              <i class="fas fa-arrow-left text-xl"></i>
            </button>
            <h2 class="text-lg font-semibold text-gray-800">
              <i class="fas fa-film mr-2 text-blue-600"></i>시나리오 모드
            </h2>
          </div>
          
          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-8">
              <div class="max-w-6xl mx-auto">
                <!-- Intro Card -->
                <div class="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 md:p-8 text-white mb-6 md:mb-8">
                  <div class="flex items-center gap-4 mb-4">
                    <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <span class="text-4xl">🎬</span>
                    </div>
                    <div class="flex-1">
                      <h2 class="text-2xl md:text-3xl font-bold mb-2">실전 상황 대화 연습</h2>
                      <p class="text-blue-100 text-sm md:text-base">30가지 실제 상황에서 영어로 자신있게 대화하세요</p>
                    </div>
                    <div class="hidden md:block bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-bold">
                      CORE+
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
                    <div class="text-center">
                      <div class="text-2xl font-bold">30</div>
                      <div class="text-blue-100 text-sm">시나리오</div>
                    </div>
                    <div class="text-center">
                      <div class="text-2xl font-bold">3</div>
                      <div class="text-blue-100 text-sm">난이도</div>
                    </div>
                    <div class="text-center">
                      <div class="text-2xl font-bold">실전</div>
                      <div class="text-blue-100 text-sm">상황 대화</div>
                    </div>
                  </div>
                </div>
                
                <!-- AI Prompt Status Banner -->
                ${this.currentUser.use_ai_prompts && this.isPremiumUser() ? `
                <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                  <div class="flex items-center gap-3">
                    <div class="text-3xl">🤖</div>
                    <div class="flex-1">
                      <h4 class="font-bold text-green-900 flex items-center gap-2">
                        <i class="fas fa-magic text-green-600"></i>
                        AI 시나리오 생성 활성화
                      </h4>
                      <p class="text-sm text-green-700 mt-1">
                        당신의 ${this.currentUser.level === 'beginner' ? '초급' : this.currentUser.level === 'intermediate' ? '중급' : '고급'} 수준에 맞춘 실전 대화가 자동 생성됩니다
                      </p>
                    </div>
                  </div>
                </div>
                ` : `
                <div class="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 mb-6">
                  <div class="flex items-center gap-3">
                    <div class="text-3xl">📚</div>
                    <div class="flex-1">
                      <h4 class="font-bold text-gray-900">기본 시나리오 사용</h4>
                      <p class="text-sm text-gray-600 mt-1">
                        30개의 실전 상황 시나리오로 연습합니다
                        ${this.isPremiumUser() ? ' • <a href="#" onclick="event.preventDefault(); worvox.showProfile();" class="text-blue-600 hover:underline font-semibold">내 정보에서 AI 생성 활성화하기</a>' : ' • <a href="#" onclick="event.preventDefault(); worvox.showPlan();" class="text-blue-600 hover:underline">Premium으로 AI 생성 이용하기</a>'}
                      </p>
                    </div>
                  </div>
                </div>
                `}
                
                <!-- Filter Buttons -->
                <div class="flex flex-wrap gap-2 mb-6">
                  <button onclick="worvox.filterScenarios('all')" 
                    class="scenario-filter-btn active px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all">
                    전체 (30)
                  </button>
                  <button onclick="worvox.filterScenarios('beginner')" 
                    class="scenario-filter-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all">
                    초급
                  </button>
                  <button onclick="worvox.filterScenarios('intermediate')" 
                    class="scenario-filter-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all">
                    중급
                  </button>
                  <button onclick="worvox.filterScenarios('advanced')" 
                    class="scenario-filter-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all">
                    고급
                  </button>
                  <button onclick="worvox.filterScenarios('여행')" 
                    class="scenario-filter-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all">
                    여행
                  </button>
                  <button onclick="worvox.filterScenarios('일상')" 
                    class="scenario-filter-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all">
                    일상
                  </button>
                  <button onclick="worvox.filterScenarios('비즈니스')" 
                    class="scenario-filter-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all">
                    비즈니스
                  </button>
                </div>
                
                <!-- Scenario Grid -->
                <div id="scenarioGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  ${this.scenarios.map(scenario => `
                    <div class="scenario-card bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer"
                      data-difficulty="${scenario.difficulty}"
                      data-category="${scenario.category}"
                      onclick="worvox.startScenario(${scenario.id})">
                      <div class="flex items-start gap-3 mb-3">
                        <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span class="text-2xl">${scenario.icon}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                          <h3 class="font-bold text-gray-900 mb-1">${scenario.title}</h3>
                          <p class="text-xs text-gray-600">${scenario.description}</p>
                        </div>
                      </div>
                      <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span class="text-xs px-2 py-1 rounded ${
                          scenario.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                          scenario.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }">
                          ${scenario.difficulty === 'beginner' ? '초급' : scenario.difficulty === 'intermediate' ? '중급' : '고급'}
                        </span>
                        <span class="text-xs text-blue-600 font-medium">시작하기 →</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
              
              ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Filter scenarios by difficulty or category
  filterScenarios(filter) {
    const cards = document.querySelectorAll('.scenario-card');
    const buttons = document.querySelectorAll('.scenario-filter-btn');
    
    // Update button styles
    buttons.forEach(btn => {
      btn.classList.remove('active', 'bg-blue-600', 'text-white');
      btn.classList.add('bg-gray-100', 'text-gray-700');
    });
    event.target.classList.remove('bg-gray-100', 'text-gray-700');
    event.target.classList.add('active', 'bg-blue-600', 'text-white');
    
    // Filter cards
    cards.forEach(card => {
      if (filter === 'all') {
        card.style.display = 'block';
      } else {
        const difficulty = card.getAttribute('data-difficulty');
        const category = card.getAttribute('data-category');
        if (difficulty === filter || category === filter) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      }
    });
  }
  
  // Start a scenario practice
  async startScenario(scenarioId) {
    const scenario = this.scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;
    
    // Check usage limit
    if (!this.checkUsageLimit('scenarioMode')) {
      return;
    }
    
    // Increment usage
    this.incrementDailyUsage('scenarioMode');
    
    let finalScenario = scenario;
    
    // AI 생성 시나리오 사용 여부 확인
    if (this.currentUser.use_ai_prompts && this.isPremiumUser()) {
      try {
        console.log('🤖 Generating AI scenario for:', scenario.title, '(', scenario.description, ')');
        
        // Show loading screen
        const app = document.getElementById('app');
        app.innerHTML = `
          <div class="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-50 items-center justify-center">
            <div class="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md text-center">
              <div class="mb-6">
                <div class="inline-block p-4 bg-blue-100 rounded-full mb-4">
                  <i class="fas fa-magic text-4xl text-blue-600 animate-pulse"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-2">${scenario.icon} ${scenario.title}</h3>
                <p class="text-gray-600 mb-4">AI 시나리오 생성 중...</p>
                <p class="text-sm text-gray-500">
                  ${scenario.description}
                </p>
              </div>
              <div class="flex justify-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            </div>
          </div>
        `;
        
        const response = await axios.post('/api/ai-prompts/generate', {
          mode: 'scenario',
          level: this.currentUser.level || 'intermediate',
          userId: this.currentUser.id,
          topic: scenario.title,
          description: scenario.description
        });
        
        console.log('🤖 AI Response:', response.data);
        
        if (response.data.success && response.data.data) {
          // AI returns { sentences: [...], translations: [...] }
          const sentences = response.data.data.sentences || [];
          const translations = response.data.data.translations || [];
          
          if (sentences.length >= 3) {
            console.log('✅ Using AI-generated scenario:', sentences);
            console.log('✅ Korean translations:', translations);
            finalScenario = {
              ...scenario,
              sentences: sentences,
              translations: translations,
              isAiGenerated: true
            };
          } else {
            console.warn('⚠️ AI scenario too short, using default. Got:', sentences.length, 'sentences');
          }
        }
      } catch (error) {
        console.error('❌ AI scenario generation failed:', error.response?.data || error.message);
        alert('AI 시나리오 생성에 실패했습니다. 기본 시나리오를 사용합니다.');
      }
    }
    
    // Shuffle sentences for randomization (only if not AI-generated)
    let shuffledSentences, shuffledTranslations;
    if (finalScenario.isAiGenerated) {
      shuffledSentences = finalScenario.sentences;
      shuffledTranslations = finalScenario.translations || [];
    } else {
      shuffledSentences = [...finalScenario.sentences];
      shuffledTranslations = [...(finalScenario.translations || [])];
      
      // Fisher-Yates shuffle algorithm
      for (let i = shuffledSentences.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledSentences[i], shuffledSentences[j]] = [shuffledSentences[j], shuffledSentences[i]];
        if (shuffledTranslations.length > 0) {
          [shuffledTranslations[i], shuffledTranslations[j]] = [shuffledTranslations[j], shuffledTranslations[i]];
        }
      }
    }
    
    // Create shuffled scenario
    const shuffledScenario = {
      ...finalScenario,
      sentences: shuffledSentences,
      translations: shuffledTranslations
    };
    
    // Create session for scenario mode
    try {
      const sessionResponse = await axios.post('/api/sessions/create', {
        userId: this.currentUser.id,
        topicId: 998, // Special ID for scenario mode
        level: this.currentUser.level || 'intermediate'
      });
      
      // Initialize scenario practice state with shuffled scenario
      this.currentScenarioPractice = {
        scenario: shuffledScenario,
        sessionId: sessionResponse.data.sessionId,
        currentSentenceIndex: 0,
        results: [],
        isPlaying: false,
        isRecording: false,
        mediaRecorder: null,
        audioChunks: []
      };
      
      console.log('✅ Scenario session created:', this.currentScenarioPractice.sessionId);
    } catch (error) {
      console.warn('⚠️ Failed to create scenario session:', error);
      
      // Initialize without session with shuffled scenario
      this.currentScenarioPractice = {
        scenario: shuffledScenario,
        currentSentenceIndex: 0,
        results: [],
        isPlaying: false,
        isRecording: false,
        mediaRecorder: null,
        audioChunks: []
      };
    }
    
    // Show scenario practice screen
    this.showScenarioPractice();
  }
  
  // Show scenario practice screen
  showScenarioPractice() {
    const { scenario, currentSentenceIndex, results } = this.currentScenarioPractice;
    const currentSentence = scenario.sentences[currentSentenceIndex];
    const progress = Math.round(((currentSentenceIndex) / scenario.sentences.length) * 100);
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        ${this.getSidebar('scenario-mode')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Mobile Header -->
          <div class="md:hidden bg-white border-b border-blue-200 px-4 py-3">
            <div class="flex items-center justify-between">
              <button onclick="worvox.showScenarioMode()" class="text-gray-600">
                <i class="fas fa-arrow-left text-xl"></i>
              </button>
              <h1 class="text-lg font-semibold text-gray-800">${scenario.icon} ${scenario.title}</h1>
              <div class="w-6"></div>
            </div>
          </div>
          
          <!-- Desktop Top Bar -->
          <div class="hidden md:flex bg-white border-b border-blue-200 px-6 py-3 items-center gap-4">
            <button onclick="worvox.showScenarioMode()" 
              class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
              <i class="fas fa-arrow-left text-xl"></i>
            </button>
            <h2 class="text-lg font-semibold text-gray-800">
              <i class="fas fa-film mr-2 text-blue-600"></i>${scenario.icon} ${scenario.title}
            </h2>
          </div>
          
          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-8">
              <div class="max-w-4xl mx-auto">
                <!-- Progress Bar -->
                <div class="mb-6">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-700">진행률</span>
                    <span class="text-sm font-medium text-blue-600">${currentSentenceIndex}/${scenario.sentences.length}</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full transition-all" style="width: ${progress}%"></div>
                  </div>
                </div>
                
                <!-- Current Sentence Card -->
                <div class="bg-white rounded-2xl p-8 shadow-lg border-2 border-blue-200 mb-6">
                  <div class="text-center mb-6">
                    <div class="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                      문장 ${currentSentenceIndex + 1}
                    </div>
                    <div class="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-relaxed" id="currentSentence">
                      ${currentSentence}
                    </div>
                    <div class="text-base text-gray-600 mb-6 italic" id="currentTranslation">
                      ${scenario.translations ? scenario.translations[currentSentenceIndex] : ''}
                    </div>
                    
                    <!-- Play Audio Button -->
                    <button id="playAudioBtn" onclick="worvox.playScenarioAudio('${currentSentence.replace(/'/g, "\\'")}')" 
                      class="mb-4 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg">
                      <i class="fas fa-volume-up mr-2"></i>듣기
                    </button>
                    
                    <p class="text-gray-600 text-sm mb-6">
                      <i class="fas fa-info-circle mr-1"></i>먼저 문장을 듣고 발음을 익히세요
                    </p>
                  </div>
                  
                  <!-- Record Section -->
                  <div class="border-t pt-6">
                    <div class="text-center">
                      <p class="text-gray-700 font-medium mb-4">이제 따라 말해보세요</p>
                      
                      <!-- Record Button -->
                      <button id="recordBtn" onclick="worvox.toggleScenarioRecording()" 
                        class="w-20 h-20 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-microphone text-3xl"></i>
                      </button>
                      
                      <p id="recordStatus" class="text-gray-600 text-sm">
                        <i class="fas fa-hand-point-up mr-1"></i>버튼을 눌러 녹음 시작
                      </p>
                    </div>
                  </div>
                </div>
                
                <!-- Instructions -->
                <div class="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-4 mb-6">
                  <h4 class="font-semibold text-gray-900 mb-2">
                    <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>학습 방법
                  </h4>
                  <ol class="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                    <li><strong>듣기 버튼</strong>을 눌러 원어민 발음을 들어보세요</li>
                    <li><strong>녹음 버튼</strong>을 눌러 문장을 따라 말해보세요</li>
                    <li>AI가 자동으로 발음을 분석하고 다음 문장으로 넘어갑니다</li>
                    <li>모든 문장을 완료하면 전체 결과를 확인할 수 있습니다</li>
                  </ol>
                </div>
                
                <!-- Exit Button -->
                <button onclick="worvox.showScenarioMode()" 
                  class="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all">
                  <i class="fas fa-times mr-2"></i>종료하기
                </button>
              </div>
              
              ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Play scenario audio using TTS
  async playScenarioAudio(text) {
    const playBtn = document.getElementById('playAudioBtn');
    if (this.currentScenarioPractice.isPlaying) return;
    
    try {
      this.currentScenarioPractice.isPlaying = true;
      playBtn.disabled = true;
      playBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>재생 중...';
      
      console.log('TTS: Requesting audio for:', text);
      
      // Call TTS API with correct endpoint
      const response = await axios.post('/api/tts/speak', { text }, { 
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('TTS: Received audio response, size:', response.data.byteLength);
      
      // Create audio element and play (simpler approach)
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        this.currentScenarioPractice.isPlaying = false;
        playBtn.disabled = false;
        playBtn.innerHTML = '<i class="fas fa-volume-up mr-2"></i>듣기';
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        this.currentScenarioPractice.isPlaying = false;
        playBtn.disabled = false;
        playBtn.innerHTML = '<i class="fas fa-volume-up mr-2"></i>듣기';
        URL.revokeObjectURL(audioUrl);
        alert('오디오 재생 중 오류가 발생했습니다.');
      };
      
      await audio.play();
      console.log('TTS: Audio playback started');
      
    } catch (error) {
      console.error('TTS error:', error);
      console.error('TTS error response:', error.response?.data);
      this.currentScenarioPractice.isPlaying = false;
      playBtn.disabled = false;
      playBtn.innerHTML = '<i class="fas fa-volume-up mr-2"></i>듣기';
      
      let errorMsg = '오디오 재생 중 오류가 발생했습니다.';
      if (error.response?.status === 500) {
        errorMsg += '\nTTS API 설정을 확인해주세요.';
      }
      alert(errorMsg);
    }
  }
  
  // Play reference audio (원문 듣기)
  async playReferenceAudio(text, index) {
    try {
      console.log('Playing reference audio:', text);
      
      // Call TTS API
      const response = await axios.post('/api/tts/speak', { text }, { 
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Create and play audio
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        URL.revokeObjectURL(audioUrl);
        alert('오디오 재생 중 오류가 발생했습니다.');
      };
      
      await audio.play();
      console.log('Reference audio playback started');
      
    } catch (error) {
      console.error('TTS error:', error);
      alert('오디오 재생 중 오류가 발생했습니다.');
    }
  }
  
  // Play user recording (내 발음 듣기)
  async playUserRecording(audioUrl, index) {
    try {
      console.log('Playing user recording:', audioUrl);
      
      const audio = new Audio(audioUrl);
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        alert('녹음 재생 중 오류가 발생했습니다.');
      };
      
      await audio.play();
      console.log('User recording playback started');
      
    } catch (error) {
      console.error('Recording playback error:', error);
      alert('녹음 재생 중 오류가 발생했습니다.');
    }
  }
  
  // Toggle recording for scenario practice
  async toggleScenarioRecording() {
    if (this.currentScenarioPractice.isRecording) {
      // Stop recording
      this.stopScenarioRecording();
    } else {
      // Start recording
      this.startScenarioRecording();
    }
  }
  
  // Start recording
  async startScenarioRecording() {
    const recordBtn = document.getElementById('recordBtn');
    const recordStatus = document.getElementById('recordStatus');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try different MIME types
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/mpeg';
          }
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.currentScenarioPractice.mediaRecorder = mediaRecorder;
      this.currentScenarioPractice.audioChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.currentScenarioPractice.audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.currentScenarioPractice.audioChunks, { type: mimeType });
        await this.analyzeScenarioRecording(audioBlob);
      };
      
      mediaRecorder.start();
      this.currentScenarioPractice.isRecording = true;
      
      // Update UI
      recordBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
      recordBtn.classList.add('bg-green-500', 'hover:bg-green-600', 'animate-pulse');
      recordBtn.innerHTML = '<i class="fas fa-stop text-3xl"></i>';
      recordStatus.innerHTML = '<i class="fas fa-circle text-red-500 mr-1 animate-pulse"></i>녹음 중... 버튼을 눌러 중지';
      
    } catch (error) {
      console.error('Recording error:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  }
  
  // Stop recording
  stopScenarioRecording() {
    if (this.currentScenarioPractice.mediaRecorder && this.currentScenarioPractice.mediaRecorder.state !== 'inactive') {
      this.currentScenarioPractice.mediaRecorder.stop();
      this.currentScenarioPractice.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    
    this.currentScenarioPractice.isRecording = false;
    
    // Update UI
    const recordBtn = document.getElementById('recordBtn');
    const recordStatus = document.getElementById('recordStatus');
    
    if (recordBtn) {
      recordBtn.classList.remove('bg-green-500', 'hover:bg-green-600', 'animate-pulse');
      recordBtn.classList.add('bg-gray-400');
      recordBtn.disabled = true;
      recordBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-3xl"></i>';
    }
    
    if (recordStatus) {
      recordStatus.innerHTML = '<i class="fas fa-brain mr-1"></i>AI가 발음을 분석 중...';
    }
  }
  
  // Analyze recorded audio
  async analyzeScenarioRecording(audioBlob) {
    try {
      // Convert audio to text using STT
      const formData = new FormData();
      const fileExt = audioBlob.type.includes('webm') ? 'webm' : 
                     audioBlob.type.includes('mp4') ? 'm4a' : 
                     audioBlob.type.includes('mpeg') ? 'mp3' : 'webm';
      formData.append('audio', audioBlob, `scenario-recording.${fileExt}`);
      
      const sttResponse = await axios.post('/api/stt/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const transcription = sttResponse.data.transcription || sttResponse.data.text || '';
      const audioAnalysis = sttResponse.data.analysis || null;
      const originalSentence = this.currentScenarioPractice.scenario.sentences[this.currentScenarioPractice.currentSentenceIndex];
      
      // Get detailed pronunciation analysis
      let scores = this.calculateDetailedScores(originalSentence, transcription, audioBlob);
      
      // Try to get AI-based detailed analysis
      if (transcription) {
        try {
          const analysisResponse = await axios.post('/api/pronunciation/analyze', {
            referenceText: originalSentence,
            userTranscription: transcription,
            audioAnalysis: audioAnalysis
          });
          
          if (analysisResponse.data.success) {
            scores = {
              accuracy: analysisResponse.data.accuracy,
              pronunciation: analysisResponse.data.pronunciation,
              fluency: analysisResponse.data.fluency
            };
            console.log('✅ Scenario detailed analysis:', scores);
          }
        } catch (error) {
          console.warn('⚠️ Failed to get detailed analysis, using basic scores:', error);
        }
      }
      
      // Create audio URL for playback
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Get translation
      const translations = this.currentScenarioPractice.scenario.translations || [];
      const translation = translations[this.currentScenarioPractice.currentSentenceIndex] || '';
      
      // Save result
      this.currentScenarioPractice.results.push({
        original: originalSentence,
        translation: translation,
        transcription: transcription,
        accuracy: scores.accuracy,
        pronunciation: scores.pronunciation,
        fluency: scores.fluency,
        audioUrl: audioUrl
      });
      
      // Show instant result for this sentence
      this.showInstantSentenceResult(scores, originalSentence, transcription);
      
    } catch (error) {
      console.error('Analysis error:', error);
      alert('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      this.showScenarioPractice();
    }
  }
  
  // Calculate sentence accuracy (simple word matching)
  calculateSentenceAccuracy(original, transcription) {
    const originalWords = original.toLowerCase().replace(/[.,!?]/g, '').split(' ').filter(w => w.length > 0);
    const transcribedWords = transcription.toLowerCase().replace(/[.,!?]/g, '').split(' ').filter(w => w.length > 0);
    
    let matches = 0;
    originalWords.forEach(word => {
      if (transcribedWords.includes(word)) {
        matches++;
      }
    });
    
    return Math.round((matches / originalWords.length) * 100);
  }
  
  // Calculate detailed scores: Accuracy, Pronunciation, Fluency
  calculateDetailedScores(original, transcription, audioBlob) {
    const originalWords = original.toLowerCase().replace(/[.,!?]/g, '').split(' ').filter(w => w.length > 0);
    const transcribedWords = transcription.toLowerCase().replace(/[.,!?]/g, '').split(' ').filter(w => w.length > 0);
    
    // 1. Accuracy: Word matching rate
    let matches = 0;
    originalWords.forEach(word => {
      if (transcribedWords.includes(word)) {
        matches++;
      }
    });
    const accuracy = Math.round((matches / originalWords.length) * 100);
    
    // 2. Pronunciation: Character-level similarity (Levenshtein distance)
    const pronunciation = this.calculatePronunciationScore(original, transcription);
    
    // 3. Fluency: Based on transcription length and word count
    const fluency = this.calculateFluencyScore(original, transcription);
    
    return { accuracy, pronunciation, fluency };
  }
  
  // Calculate pronunciation score based on character similarity
  calculatePronunciationScore(original, transcription) {
    const orig = original.toLowerCase().replace(/[.,!?]/g, '');
    const trans = transcription.toLowerCase().replace(/[.,!?]/g, '');
    
    // Levenshtein distance
    const distance = this.levenshteinDistance(orig, trans);
    const maxLength = Math.max(orig.length, trans.length);
    const similarity = maxLength === 0 ? 100 : Math.round((1 - distance / maxLength) * 100);
    
    return Math.max(0, Math.min(100, similarity));
  }
  
  // Calculate fluency score based on length and completeness
  calculateFluencyScore(original, transcription) {
    const originalWords = original.toLowerCase().replace(/[.,!?]/g, '').split(' ').filter(w => w.length > 0);
    const transcribedWords = transcription.toLowerCase().replace(/[.,!?]/g, '').split(' ').filter(w => w.length > 0);
    
    // Check if transcription is complete
    const lengthRatio = transcribedWords.length / originalWords.length;
    const lengthScore = Math.min(100, lengthRatio * 100);
    
    // Penalize if too short or too long
    let fluency = lengthScore;
    if (lengthRatio < 0.5) {
      fluency = lengthScore * 0.6; // Too short
    } else if (lengthRatio > 1.5) {
      fluency = lengthScore * 0.8; // Too long
    }
    
    return Math.round(Math.max(0, Math.min(100, fluency)));
  }
  
  // Levenshtein distance algorithm
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  // Show instant result after each sentence
  showInstantSentenceResult(scores, originalSentence, transcription) {
    const { accuracy, pronunciation, fluency } = scores;
    const averageScore = Math.round((accuracy + pronunciation + fluency) / 3);
    
    let rating, ratingColor, ratingIcon;
    if (averageScore >= 80) {
      rating = '훌륭해요!';
      ratingColor = 'text-green-600';
      ratingIcon = '🌟';
    } else if (averageScore >= 60) {
      rating = '좋아요!';
      ratingColor = 'text-blue-600';
      ratingIcon = '👍';
    } else if (averageScore >= 40) {
      rating = '괜찮아요';
      ratingColor = 'text-yellow-600';
      ratingIcon = '😊';
    } else {
      rating = '다시 도전!';
      ratingColor = 'text-red-600';
      ratingIcon = '💪';
    }
    
    const sentenceNumber = this.currentScenarioPractice.currentSentenceIndex + 1;
    const totalSentences = this.currentScenarioPractice.scenario.sentences.length;
    const hasMore = sentenceNumber < totalSentences;
    
    // Get audio URL from the latest result
    const latestResult = this.currentScenarioPractice.results[this.currentScenarioPractice.results.length - 1];
    const audioUrl = latestResult?.audioUrl || null;
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        ${this.getSidebar('scenario-mode')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Header -->
          <div class="bg-white border-b border-blue-200 px-4 md:px-6 py-3">
            <h2 class="text-lg font-semibold text-gray-800">
              <i class="fas fa-chart-bar mr-2 text-blue-600"></i>문장 ${sentenceNumber} 결과
            </h2>
          </div>
          
          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-4 md:p-8">
            <div class="max-w-4xl mx-auto">
              <!-- Result Card -->
              <div class="bg-white rounded-2xl p-6 md:p-8 shadow-xl border-2 border-blue-200 mb-6">
                <!-- Rating -->
                <div class="text-center mb-6">
                  <div class="text-6xl mb-4">${ratingIcon}</div>
                  <h3 class="text-3xl font-bold ${ratingColor} mb-2">${rating}</h3>
                  <p class="text-gray-600">전체 점수: <span class="text-2xl font-bold text-blue-600">${averageScore}점</span></p>
                </div>
                
                <!-- Score Breakdown -->
                <div class="grid grid-cols-3 gap-4 mb-6">
                  <div class="text-center">
                    <div class="text-gray-600 text-sm mb-2">정확성</div>
                    <div class="relative w-20 h-20 mx-auto">
                      <svg class="transform -rotate-90 w-20 h-20">
                        <circle cx="40" cy="40" r="30" stroke="#e5e7eb" stroke-width="8" fill="none" />
                        <circle cx="40" cy="40" r="30" stroke="#3b82f6" stroke-width="8" fill="none"
                          stroke-dasharray="${2 * Math.PI * 30}" 
                          stroke-dashoffset="${2 * Math.PI * 30 * (1 - accuracy / 100)}" 
                          stroke-linecap="round" />
                      </svg>
                      <div class="absolute inset-0 flex items-center justify-center">
                        <span class="text-lg font-bold text-blue-600">${accuracy}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="text-center">
                    <div class="text-gray-600 text-sm mb-2">발음</div>
                    <div class="relative w-20 h-20 mx-auto">
                      <svg class="transform -rotate-90 w-20 h-20">
                        <circle cx="40" cy="40" r="30" stroke="#e5e7eb" stroke-width="8" fill="none" />
                        <circle cx="40" cy="40" r="30" stroke="#10b981" stroke-width="8" fill="none"
                          stroke-dasharray="${2 * Math.PI * 30}" 
                          stroke-dashoffset="${2 * Math.PI * 30 * (1 - pronunciation / 100)}" 
                          stroke-linecap="round" />
                      </svg>
                      <div class="absolute inset-0 flex items-center justify-center">
                        <span class="text-lg font-bold text-green-600">${pronunciation}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="text-center">
                    <div class="text-gray-600 text-sm mb-2">유창성</div>
                    <div class="relative w-20 h-20 mx-auto">
                      <svg class="transform -rotate-90 w-20 h-20">
                        <circle cx="40" cy="40" r="30" stroke="#e5e7eb" stroke-width="8" fill="none" />
                        <circle cx="40" cy="40" r="30" stroke="#f59e0b" stroke-width="8" fill="none"
                          stroke-dasharray="${2 * Math.PI * 30}" 
                          stroke-dashoffset="${2 * Math.PI * 30 * (1 - fluency / 100)}" 
                          stroke-linecap="round" />
                      </svg>
                      <div class="absolute inset-0 flex items-center justify-center">
                        <span class="text-lg font-bold text-yellow-600">${fluency}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Sentence Comparison -->
                <div class="border-t pt-6">
                  <div class="mb-4">
                    <div class="flex items-center justify-between mb-2">
                      <div class="text-sm font-semibold text-gray-700">
                        <i class="fas fa-check-circle text-green-600 mr-1"></i>원문
                      </div>
                      <button onclick="worvox.playReferenceAudio('${originalSentence.replace(/'/g, "\\'")}', ${sentenceNumber})" 
                        class="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 rounded hover:bg-blue-50 transition-all">
                        <i class="fas fa-volume-up mr-1"></i>원문 듣기
                      </button>
                    </div>
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-gray-800">
                      ${originalSentence}
                    </div>
                  </div>
                  
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <div class="text-sm font-semibold text-gray-700">
                        <i class="fas fa-microphone text-blue-600 mr-1"></i>내 발음
                      </div>
                      ${audioUrl ? `
                        <button onclick="worvox.playUserRecording('${audioUrl}', ${sentenceNumber})" 
                          class="text-purple-600 hover:text-purple-800 text-sm px-3 py-1 rounded hover:bg-purple-50 transition-all">
                          <i class="fas fa-play mr-1"></i>내 발음 듣기
                        </button>
                      ` : ''}
                    </div>
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-gray-800">
                      ${transcription || '(인식되지 않음)'}
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Action Buttons -->
              <div class="flex gap-4">
                ${hasMore ? `
                  <button onclick="worvox.moveToNextSentence()" 
                    class="flex-1 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg">
                    <i class="fas fa-arrow-right mr-2"></i>다음 문장
                  </button>
                ` : `
                  <button onclick="worvox.showScenarioMode()" 
                    class="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg">
                    <i class="fas fa-check-circle mr-2"></i>완료
                  </button>
                `}
                
                <button onclick="worvox.showScenarioMode()" 
                  class="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all">
                  <i class="fas fa-times mr-2"></i>종료
                </button>
              </div>
              
              <!-- Progress Info -->
              <div class="mt-6 text-center text-gray-600">
                <i class="fas fa-info-circle mr-1"></i>
                진행 상황: ${sentenceNumber} / ${totalSentences}
              </div>
            </div>
            
            ${this.getFooter()}
          </div>
        </div>
      </div>
    `;
  }
  
  // Move to next sentence
  moveToNextSentence() {
    this.currentScenarioPractice.currentSentenceIndex++;
    this.showScenarioPractice();
  }
  
  // Show scenario results
  async showScenarioResults() {
    const { scenario, results, sessionId } = this.currentScenarioPractice;
    
    // End scenario session if exists
    if (sessionId) {
      try {
        // Save all results as messages
        for (const result of results) {
          await axios.post('/api/messages/create', {
            sessionId: sessionId,
            role: 'system',
            content: `시나리오: ${scenario.title} - ${result.original}`
          });
          
          await axios.post('/api/messages/create', {
            sessionId: sessionId,
            role: 'user',
            content: result.transcription || '(인식되지 않음)'
          });
        }
        
        // End session
        await axios.post(`/api/sessions/end/${sessionId}`);
        console.log('✅ Scenario session ended');
      } catch (error) {
        console.warn('⚠️ Failed to save scenario session:', error);
      }
    }
    
    // 🤖 Generate AI feedback for each sentence (Premium feature)
    let resultsWithFeedback = [...results];
    if (this.currentUser?.plan === 'premium') {
      try {
        console.log('🤖 Generating AI feedback for scenario results...');
        
        // Batch generate AI feedback for all sentences
        const feedbackPromises = results.map(async (result, index) => {
          try {
            const response = await axios.post('/api/ai-prompts/generate-pronunciation-feedback', {
              originalSentence: result.original,
              userTranscription: result.transcription,
              pronunciation: result.pronunciation,
              fluency: result.fluency,
              accuracy: result.accuracy,
              context: `시나리오 실습: ${scenario.title}. 발음과 억양을 중심으로 분석해주세요.`
            });
            
            if (response.data.success && response.data.feedback) {
              console.log(`✅ Generated AI feedback for sentence ${index + 1}`);
              return {
                ...result,
                aiFeedback: response.data.feedback
              };
            }
            return result;
          } catch (error) {
            console.warn(`⚠️ Failed to generate AI feedback for sentence ${index + 1}:`, error);
            return result;
          }
        });
        
        resultsWithFeedback = await Promise.all(feedbackPromises);
        console.log('✅ All AI feedbacks generated:', resultsWithFeedback);
      } catch (error) {
        console.warn('⚠️ Failed to generate AI feedbacks:', error);
      }
    } else {
      console.log('ℹ️ AI feedback is a Premium feature');
    }
    
    const averageAccuracy = Math.round(resultsWithFeedback.reduce((sum, r) => sum + r.accuracy, 0) / resultsWithFeedback.length);
    
    let rating, ratingColor, ratingIcon;
    if (averageAccuracy >= 80) {
      rating = '훌륭해요!';
      ratingColor = 'text-green-600';
      ratingIcon = '🌟';
    } else if (averageAccuracy >= 60) {
      rating = '좋아요!';
      ratingColor = 'text-blue-600';
      ratingIcon = '👍';
    } else if (averageAccuracy >= 40) {
      rating = '괜찮아요';
      ratingColor = 'text-yellow-600';
      ratingIcon = '😊';
    } else {
      rating = '다시 도전!';
      ratingColor = 'text-red-600';
      ratingIcon = '💪';
    }
    
    // 💾 Save scenario report to database
    if (sessionId && this.currentUser) {
      try {
        const avgPronunciation = Math.round(resultsWithFeedback.reduce((sum, r) => sum + (r.pronunciation || 0), 0) / resultsWithFeedback.length);
        const avgFluency = Math.round(resultsWithFeedback.reduce((sum, r) => sum + (r.fluency || 0), 0) / resultsWithFeedback.length);
        
        const reportData = {
          scenario: {
            title: scenario.title,
            icon: scenario.icon
          },
          results: resultsWithFeedback,  // Save with AI feedback
          averageAccuracy,
          averagePronunciation: avgPronunciation,
          averageFluency: avgFluency,
          rating,
          totalSentences: resultsWithFeedback.length,
          completedAt: new Date().toISOString()
        };
        
        await axios.post('/api/mode-reports/save', {
          sessionId: sessionId,
          userId: this.currentUser.id,
          modeType: 'scenario',
          reportData: reportData
        });
        console.log('✅ Scenario report saved successfully');
      } catch (error) {
        console.warn('⚠️ Failed to save scenario report:', error);
      }
    }
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        ${this.getSidebar('scenario-mode')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Header -->
          <div class="bg-white border-b border-blue-200 px-4 md:px-6 py-3">
            <h2 class="text-lg font-semibold text-gray-800">
              <i class="fas fa-chart-bar mr-2 text-blue-600"></i>${scenario.icon} ${scenario.title} - 결과
            </h2>
          </div>
          
          <!-- Content -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-8">
              <div class="max-w-4xl mx-auto">
                <!-- Rating Card -->
                <div class="bg-white rounded-2xl p-8 shadow-lg border-2 border-blue-200 mb-6 text-center">
                  <div class="text-6xl mb-4">${ratingIcon}</div>
                  <h2 class="text-3xl font-bold ${ratingColor} mb-2">${rating}</h2>
                  <div class="text-5xl font-bold text-blue-600 mb-2">${averageAccuracy}%</div>
                  <p class="text-gray-600">평균 정확도</p>
                </div>
                
                <!-- Detailed Results -->
                <div class="bg-white rounded-2xl p-6 shadow-lg mb-6">
                  <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i class="fas fa-list-check text-blue-600"></i>
                    상세 결과
                  </h3>
                  
                  <div class="space-y-4">
                    ${resultsWithFeedback.map((result, index) => `
                      <div class="border border-gray-200 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                          <span class="text-sm font-semibold text-gray-700">문장 ${index + 1}</span>
                          <div class="flex gap-2">
                            <span class="text-xs font-medium px-2 py-1 rounded ${
                              result.accuracy >= 80 ? 'bg-green-100 text-green-700' :
                              result.accuracy >= 60 ? 'bg-blue-100 text-blue-700' :
                              result.accuracy >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }">정확도 ${result.accuracy}%</span>
                            <span class="text-xs font-medium px-2 py-1 rounded ${
                              result.pronunciation >= 80 ? 'bg-green-100 text-green-700' :
                              result.pronunciation >= 60 ? 'bg-blue-100 text-blue-700' :
                              result.pronunciation >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }">발음 ${result.pronunciation}%</span>
                            <span class="text-xs font-medium px-2 py-1 rounded ${
                              result.fluency >= 80 ? 'bg-green-100 text-green-700' :
                              result.fluency >= 60 ? 'bg-blue-100 text-blue-700' :
                              result.fluency >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }">유창성 ${result.fluency}%</span>
                          </div>
                        </div>
                        <div class="mb-3">
                          <div class="flex items-center justify-between mb-1">
                            <div class="text-xs text-gray-600">원본 문장</div>
                            <button onclick="worvox.playReferenceAudio('${result.original.replace(/'/g, "\\'")}', ${index})" 
                              class="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50 transition-all">
                              <i class="fas fa-volume-up mr-1"></i>원문 듣기
                            </button>
                          </div>
                          <div class="bg-gray-50 rounded p-2 text-sm text-gray-900 mb-1">${result.original}</div>
                          <div class="text-xs text-gray-500 italic">${result.translation || ''}</div>
                        </div>
                        <div class="mb-3">
                          <div class="flex items-center justify-between mb-1">
                            <div class="text-xs text-gray-600">당신이 말한 내용</div>
                            ${result.audioUrl ? `
                              <button onclick="worvox.playUserRecording('${result.audioUrl}', ${index})" 
                                class="text-purple-600 hover:text-purple-800 text-xs px-2 py-1 rounded hover:bg-purple-50 transition-all">
                                <i class="fas fa-play mr-1"></i>내 발음 듣기
                              </button>
                            ` : ''}
                          </div>
                          <div class="bg-blue-50 rounded p-2 text-sm text-gray-900 mb-3">${result.transcription || '(인식되지 않음)'}</div>
                        </div>
                        
                        <!-- AI Feedback (Premium) -->
                        ${result.aiFeedback ? `
                          <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
                            <div class="flex items-center gap-2 mb-2">
                              <i class="fas fa-robot text-blue-600"></i>
                              <span class="text-sm font-bold text-gray-900">💎 AI 발음 코칭</span>
                            </div>
                            <div class="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              ${result.aiFeedback}
                            </div>
                          </div>
                        ` : this.currentUser?.plan === 'premium' ? `
                          <div class="bg-gray-100 rounded-lg p-3 text-center">
                            <span class="text-xs text-gray-600">AI 피드백 생성 중...</span>
                          </div>
                        ` : `
                          <div class="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
                            <div class="blur-sm select-none pointer-events-none">
                              <div class="text-sm font-bold text-gray-900 mb-2">💎 AI 발음 코칭</div>
                              <div class="text-sm text-gray-700">발음과 억양에 대한 상세한 분석과 개선 방법을 AI가 알려드립니다. 자연스러운 원어민 발음에 가까워지는 팁을 받아보세요!</div>
                            </div>
                            <div class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
                              <div class="text-center px-4">
                                <i class="fas fa-crown text-yellow-500 text-2xl mb-2"></i>
                                <div class="text-sm font-bold text-gray-900 mb-1">Premium 전용</div>
                                <p class="text-xs text-gray-600 mb-2">발음/억양 중심 AI 분석</p>
                                <button onclick="worvox.showPlan()" class="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg font-semibold transition-all">
                                  업그레이드
                                </button>
                              </div>
                            </div>
                          </div>
                        `}
                      </div>
                    `).join('')}
                  </div>
                </div>
                
                <!-- Actions -->
                <div class="grid md:grid-cols-2 gap-4">
                  <button onclick="worvox.startScenario(${scenario.id})" 
                    class="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl p-4 font-bold transition-all">
                    <i class="fas fa-redo mr-2"></i>다시 연습하기
                  </button>
                  <button onclick="worvox.showScenarioMode()" 
                    class="bg-white hover:bg-gray-50 border-2 border-blue-200 text-blue-600 rounded-xl p-4 font-bold transition-all">
                    <i class="fas fa-home mr-2"></i>시나리오 선택
                  </button>
                </div>
              </div>
              
              ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
  }


  // ==================== EXAM MODE ====================
  
  showExamMode() {
    // Check if core or premium user
    if (!this.isCoreOrPremiumUser()) {
      alert('📝 시험 모드는 Core/Premium 전용 기능입니다!\n\n지금 업그레이드하고 실전 스피킹 테스트를 경험하세요.');
      this.showPlan();
      return;
    }

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gradient-to-br from-orange-50 to-red-50">
        ${this.getSidebar('exam-mode')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Mobile & Desktop Header with Back Button -->
          <div class="bg-white border-b border-orange-200 px-4 md:px-6 py-3">
            <div class="flex items-center gap-2 md:gap-4">
              <button onclick="worvox.showTopicSelection()" 
                class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
                <i class="fas fa-arrow-left text-xl"></i>
              </button>
              <div class="flex-1">
                <h1 class="text-lg md:text-2xl font-bold text-gray-800">
                  <i class="fas fa-clipboard-check mr-2 text-orange-600"></i>시험 모드
                </h1>
                <p class="hidden md:block text-gray-600 text-sm mt-1">OPIC 스타일 실전 스피킹 테스트</p>
              </div>
              <span class="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs md:text-sm px-3 md:px-4 py-1 rounded-full font-bold">
                PREMIUM
              </span>
            </div>
          </div>
          
          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-8">
              <div class="max-w-4xl mx-auto">
                <!-- Intro Card -->
                <div class="bg-white rounded-2xl p-6 md:p-8 shadow-lg border-2 border-orange-200 mb-6">
                  <div class="text-center mb-6">
                    <div class="text-6xl mb-4">📝</div>
                    <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-3">시험 모드</h2>
                    <p class="text-gray-600 text-lg">OPIC 스타일 5문항 스피킹 테스트</p>
                  </div>
                  
                  <div class="bg-orange-50 rounded-xl p-6 mb-6">
                    <h3 class="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <i class="fas fa-info-circle text-orange-600"></i>
                      시험 구성
                    </h3>
                    <ul class="space-y-2 text-gray-700">
                      <li class="flex items-start gap-2">
                        <i class="fas fa-check text-orange-600 mt-1"></i>
                        <span><strong>총 5문항</strong> - 난이도가 점진적으로 증가</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <i class="fas fa-check text-orange-600 mt-1"></i>
                        <span><strong>문제 1-2:</strong> 간단한 질문 (자기소개, 일상)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <i class="fas fa-check text-orange-600 mt-1"></i>
                        <span><strong>문제 3-4:</strong> 중급 난이도 (경험, 의견)</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <i class="fas fa-check text-orange-600 mt-1"></i>
                        <span><strong>문제 5:</strong> 고급 롤플레잉 상황 연습</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <i class="fas fa-check text-orange-600 mt-1"></i>
                        <span>각 문제별 <strong>정확도, 발음, 유창성</strong> 평가</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <i class="fas fa-check text-orange-600 mt-1"></i>
                        <span>시험 종료 후 <strong>OPIC 등급</strong> 예상 결과 제공</span>
                      </li>
                    </ul>
                  </div>
                  
                  <!-- AI Prompt Status Banner -->
                  ${this.currentUser.use_ai_prompts && this.isPremiumUser() ? `
                  <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                    <div class="flex items-center gap-3">
                      <div class="text-3xl">🤖</div>
                      <div class="flex-1">
                        <h4 class="font-bold text-green-900 flex items-center gap-2">
                          <i class="fas fa-magic text-green-600"></i>
                          AI 시험 문제 생성 활성화
                        </h4>
                        <p class="text-sm text-green-700 mt-1">
                          당신의 ${this.currentUser.level === 'beginner' ? '초급' : this.currentUser.level === 'intermediate' ? '중급' : '고급'} 수준에 맞춘 OPIC 스타일 질문이 자동 생성됩니다
                        </p>
                      </div>
                    </div>
                  </div>
                  ` : `
                  <div class="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 mb-6">
                    <div class="flex items-center gap-3">
                      <div class="text-3xl">📚</div>
                      <div class="flex-1">
                        <h4 class="font-bold text-gray-900">기본 시험 문제 사용</h4>
                        <p class="text-sm text-gray-600 mt-1">
                          검증된 OPIC 스타일 시험 문제로 평가합니다
                          ${this.isPremiumUser() ? ' • <a href="#" onclick="event.preventDefault(); worvox.showProfile();" class="text-blue-600 hover:underline font-semibold">내 정보에서 AI 생성 활성화하기</a>' : ' • <a href="#" onclick="event.preventDefault(); worvox.showPlan();" class="text-blue-600 hover:underline">Premium으로 AI 생성 이용하기</a>'}
                        </p>
                      </div>
                    </div>
                  </div>
                  `}
                  
                  <div class="bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-6">
                    <h3 class="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <i class="fas fa-clock text-orange-600"></i>
                      답변 시간 선택
                    </h3>
                    <p class="text-gray-700 mb-4">각 문제당 답변 시간을 선택하세요</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button onclick="worvox.startExamTest(5)" 
                        class="bg-white hover:bg-orange-50 border-2 border-orange-300 hover:border-orange-500 rounded-xl p-6 transition-all text-center group">
                        <div class="text-4xl mb-2 group-hover:scale-110 transition-transform">⚡</div>
                        <div class="text-2xl font-bold text-orange-600 mb-1">5초</div>
                        <div class="text-sm text-gray-600">빠른 반응</div>
                      </button>
                      
                      <button onclick="worvox.startExamTest(10)" 
                        class="bg-white hover:bg-orange-50 border-2 border-orange-300 hover:border-orange-500 rounded-xl p-6 transition-all text-center group">
                        <div class="text-4xl mb-2 group-hover:scale-110 transition-transform">🎯</div>
                        <div class="text-2xl font-bold text-orange-600 mb-1">10초</div>
                        <div class="text-sm text-gray-600">권장</div>
                      </button>
                      
                      <button onclick="worvox.startExamTest(30)" 
                        class="bg-white hover:bg-orange-50 border-2 border-orange-300 hover:border-orange-500 rounded-xl p-6 transition-all text-center group">
                        <div class="text-4xl mb-2 group-hover:scale-110 transition-transform">💭</div>
                        <div class="text-2xl font-bold text-orange-600 mb-1">30초</div>
                        <div class="text-sm text-gray-600">충분한 시간</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async startExamTest(seconds) {
    let examQuestions = [];
    
    // AI 생성 시험 문제 사용 여부 확인
    if (this.currentUser.use_ai_prompts && this.isPremiumUser()) {
      try {
        console.log('🤖 Generating AI exam questions for level:', this.currentUser.level);
        
        // Show loading screen
        const app = document.getElementById('app');
        app.innerHTML = `
          <div class="flex h-screen bg-gradient-to-br from-orange-50 to-red-50 items-center justify-center">
            <div class="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md text-center">
              <div class="mb-6">
                <div class="inline-block p-4 bg-orange-100 rounded-full mb-4">
                  <i class="fas fa-magic text-4xl text-orange-600 animate-pulse"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-2">AI 시험 문제 생성 중...</h3>
                <p class="text-gray-600">
                  ${this.currentUser.level === 'beginner' ? '초급 수준의 간단한 질문을 준비하고 있습니다' :
                    this.currentUser.level === 'intermediate' ? '중급 수준의 실전 질문을 생성하고 있습니다' :
                    '고급 수준의 심화 질문을 만들고 있습니다'}
                </p>
              </div>
              <div class="flex justify-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              </div>
            </div>
          </div>
        `;
        
        const response = await axios.post('/api/ai-prompts/generate', {
          mode: 'exam',
          level: this.currentUser.level || 'intermediate',
          userId: this.currentUser.id
        });
        
        console.log('🤖 AI Response:', response.data);
        
        if (response.data.success && response.data.data) {
          // AI returns { questions: [...], translations: [...] }
          const questions = response.data.data.questions || [];
          const translations = response.data.data.translations || [];
          
          if (questions.length >= 5) {
            console.log('✅ Using AI-generated exam questions:', questions);
            console.log('✅ Korean translations:', translations);
            examQuestions = questions.map((q, idx) => ({
              id: idx + 1,
              difficulty: idx < 2 ? 'easy' : idx < 4 ? 'medium' : 'hard',
              question: q,
              questionKR: translations[idx] || '', // Use AI-generated Korean translation
              timeLimit: idx === 4 ? seconds * 3 : seconds, // Last question gets 3x time
              isAiGenerated: true
            }));
          } else {
            console.warn('⚠️ AI exam questions too short, using default. Got:', questions.length, 'questions');
          }
        }
      } catch (error) {
        console.error('❌ AI exam generation failed:', error.response?.data || error.message);
        alert('AI 시험 문제 생성에 실패했습니다. 기본 문제를 사용합니다.');
      }
    }
    
    // Use default questions if AI generation failed or not enabled
    if (examQuestions.length === 0) {
      // Question pool (50 questions total)
      const allQuestions = {
      easy: [
        { question: "Let's start with some background information about yourself. Please tell me about your name, where you're from, and what you do.", questionKR: "당신의 배경에 대해 말해주세요. 이름, 출신, 그리고 하는 일에 대해 이야기해주세요." },
        { question: "Tell me about your typical day. What time do you usually wake up and what do you do during the day?", questionKR: "평소 하루 일과에 대해 말해주세요. 보통 몇 시에 일어나고 하루 동안 무엇을 하나요?" },
        { question: "What are your hobbies? How often do you do them and why do you enjoy them?", questionKR: "취미가 무엇인가요? 얼마나 자주 하며 왜 즐기시나요?" },
        { question: "Describe your family. How many people are in your family and what do they do?", questionKR: "가족에 대해 설명해주세요. 가족은 몇 명이며 무엇을 하나요?" },
        { question: "What kind of music do you like? Who is your favorite artist or band?", questionKR: "어떤 음악을 좋아하나요? 가장 좋아하는 아티스트나 밴드는 누구인가요?" },
        { question: "Tell me about your favorite food. What is it and why do you like it?", questionKR: "가장 좋아하는 음식에 대해 말해주세요. 무엇이며 왜 좋아하나요?" },
        { question: "What do you usually do on weekends? Do you prefer staying at home or going out?", questionKR: "주말에 보통 무엇을 하나요? 집에 있는 것과 외출하는 것 중 어느 것을 선호하나요?" },
        { question: "Describe your bedroom or living space. What does it look like?", questionKR: "당신의 침실이나 생활 공간을 설명해주세요. 어떻게 생겼나요?" },
        { question: "What is your favorite season and why do you like it?", questionKR: "가장 좋아하는 계절은 무엇이며 왜 좋아하나요?" },
        { question: "Tell me about your best friend. How did you meet and what do you like about them?", questionKR: "가장 친한 친구에 대해 말해주세요. 어떻게 만났고 무엇이 좋나요?" },
        { question: "What kind of movies or TV shows do you enjoy watching?", questionKR: "어떤 종류의 영화나 TV 프로그램을 즐겨보나요?" },
        { question: "Describe your neighborhood. What is it like and what facilities are nearby?", questionKR: "당신의 동네를 설명해주세요. 어떤 곳이며 근처에 어떤 시설이 있나요?" },
        { question: "What do you usually eat for breakfast? Do you cook it yourself or buy it?", questionKR: "아침으로 보통 무엇을 먹나요? 직접 요리하나요 아니면 사나요?" },
        { question: "Tell me about your favorite color and why you like it.", questionKR: "가장 좋아하는 색깔과 그 이유를 말해주세요." },
        { question: "What kind of weather do you prefer? Do you like hot or cold weather?", questionKR: "어떤 날씨를 선호하나요? 더운 날씨와 추운 날씨 중 어느 것을 좋아하나요?" },
        { question: "Describe your daily commute. How do you get to work or school?", questionKR: "일상적인 통근에 대해 설명해주세요. 직장이나 학교에 어떻게 가나요?" },
        { question: "What sports or physical activities do you enjoy? How often do you exercise?", questionKR: "어떤 스포츠나 신체 활동을 즐기나요? 얼마나 자주 운동하나요?" },
        { question: "Tell me about your favorite place in your city. What makes it special?", questionKR: "도시에서 가장 좋아하는 장소에 대해 말해주세요. 무엇이 특별한가요?" },
        { question: "What do you like to do when you have free time during the week?", questionKR: "주중에 여가 시간이 있을 때 무엇을 하고 싶으신가요?" },
        { question: "Describe your morning routine. What do you do first after waking up?", questionKR: "아침 루틴을 설명해주세요. 일어나서 가장 먼저 무엇을 하나요?" }
      ],
      medium: [
        { question: "Can you describe a memorable experience or event that happened in your life? What made it special and how did it affect you?", questionKR: "인생에서 기억에 남는 경험이나 사건을 설명해주세요. 무엇이 특별했고 당신에게 어떤 영향을 주었나요?" },
        { question: "What is your opinion about working from home versus working in an office? What are the advantages and disadvantages of each?", questionKR: "재택근무와 사무실 근무에 대한 의견은 무엇인가요? 각각의 장단점은 무엇인가요?" },
        { question: "Tell me about a time when you faced a difficult challenge. How did you overcome it and what did you learn?", questionKR: "어려운 도전에 직면했던 때를 말해주세요. 어떻게 극복했고 무엇을 배웠나요?" },
        { question: "Do you think social media has a positive or negative impact on society? Explain your reasoning.", questionKR: "소셜 미디어가 사회에 긍정적 또는 부정적 영향을 미친다고 생각하나요? 이유를 설명해주세요." },
        { question: "Describe your ideal vacation. Where would you go and what would you do there?", questionKR: "이상적인 휴가를 설명해주세요. 어디로 가고 싶으며 그곳에서 무엇을 하고 싶나요?" },
        { question: "What are the most important qualities in a good friend? Give examples from your own experience.", questionKR: "좋은 친구의 가장 중요한 자질은 무엇인가요? 자신의 경험에서 예를 들어주세요." },
        { question: "How has technology changed the way people communicate? Is this change positive or negative?", questionKR: "기술이 사람들의 의사소통 방식을 어떻게 변화시켰나요? 이 변화는 긍정적인가요 부정적인가요?" },
        { question: "Tell me about a goal you set for yourself. Did you achieve it? Why or why not?", questionKR: "스스로 세운 목표에 대해 말해주세요. 달성했나요? 왜 그랬거나 그렇지 않았나요?" },
        { question: "What do you think is the biggest problem facing young people today? How can it be solved?", questionKR: "오늘날 젊은이들이 직면한 가장 큰 문제는 무엇이라고 생각하나요? 어떻게 해결할 수 있을까요?" },
        { question: "Describe a book or movie that had a strong impact on you. Why was it so meaningful?", questionKR: "강한 영향을 준 책이나 영화를 설명해주세요. 왜 그렇게 의미가 있었나요?" },
        { question: "What are the benefits and drawbacks of living in a big city compared to a small town?", questionKR: "작은 마을에 비해 대도시에 사는 것의 장단점은 무엇인가요?" },
        { question: "How do you usually make important decisions? What factors do you consider?", questionKR: "중요한 결정을 내릴 때 보통 어떻게 하나요? 어떤 요소를 고려하나요?" },
        { question: "Tell me about a skill you would like to learn. Why is it important to you?", questionKR: "배우고 싶은 기술에 대해 말해주세요. 왜 그것이 중요한가요?" },
        { question: "What role does family play in your culture? How has this changed over generations?", questionKR: "당신의 문화에서 가족은 어떤 역할을 하나요? 세대를 거치며 어떻게 변화했나요?" },
        { question: "Describe a time when you had to adapt to a new situation. How did you handle it?", questionKR: "새로운 상황에 적응해야 했던 때를 설명해주세요. 어떻게 처리했나요?" },
        { question: "What do you think makes a person successful? Is it talent, hard work, or luck?", questionKR: "사람을 성공하게 만드는 것은 무엇이라고 생각하나요? 재능, 노력, 아니면 운인가요?" },
        { question: "How has your education influenced your career choices? Would you change anything if you could?", questionKR: "교육이 경력 선택에 어떤 영향을 주었나요? 할 수 있다면 무엇을 바꾸고 싶나요?" },
        { question: "What are the advantages and disadvantages of studying abroad?", questionKR: "해외 유학의 장단점은 무엇인가요?" },
        { question: "Tell me about a tradition or custom from your culture that you value. Why is it important?", questionKR: "당신이 소중히 여기는 문화의 전통이나 관습에 대해 말해주세요. 왜 중요한가요?" },
        { question: "How do you balance work and personal life? What strategies do you use?", questionKR: "일과 개인 생활의 균형을 어떻게 맞추나요? 어떤 전략을 사용하나요?" }
      ],
      hard: [
        { question: "I'm calling to make a reservation at your restaurant for this Saturday evening. I need a table for four people at 7 PM. Also, one of my guests has a food allergy to seafood. Could you accommodate this? And could you recommend some popular dishes from your menu?", questionKR: "레스토랑에 이번 주 토요일 저녁 예약을 하려고 전화했습니다. 오후 7시에 4명을 위한 테이블이 필요합니다. 또한 손님 중 한 명이 해산물 알레르기가 있습니다. 수용 가능한가요? 그리고 메뉴에서 인기 있는 요리를 추천해 주시겠어요?" },
        { question: "You're at a hotel and there's a problem with your room - the air conditioning doesn't work and it's very hot. Call the front desk to explain the situation and ask for a solution. Be polite but firm about needing this resolved quickly.", questionKR: "호텔에 있는데 방에 문제가 있습니다. 에어컨이 작동하지 않고 매우 덥습니다. 프론트 데스크에 전화하여 상황을 설명하고 해결책을 요청하세요. 예의바르되 빨리 해결해야 한다는 점을 단호하게 말하세요." },
        { question: "Imagine you're interviewing for your dream job. The interviewer asks: 'Why should we hire you over other qualified candidates? What unique value do you bring to our company?' Answer this question convincingly.", questionKR: "꿈의 직장 면접을 본다고 상상해보세요. 면접관이 묻습니다: '다른 자격을 갖춘 후보자들보다 왜 당신을 채용해야 하나요? 우리 회사에 어떤 독특한 가치를 가져다줄 수 있나요?' 이 질문에 설득력 있게 답하세요." },
        { question: "You purchased an expensive electronic device online, but it arrived damaged. Call customer service to explain the problem, express your frustration, and negotiate a solution - either a full refund or a replacement with expedited shipping.", questionKR: "온라인에서 비싼 전자기기를 구매했는데 파손된 상태로 도착했습니다. 고객 서비스에 전화하여 문제를 설명하고, 불만을 표현하며, 해결책을 협상하세요. 전액 환불이나 빠른 배송으로 교체를 요청하세요." },
        { question: "You're organizing a surprise birthday party for your friend. Call several people to invite them and coordinate: What should everyone bring? When should they arrive? How can you keep it a secret? Make sure everyone understands the plan.", questionKR: "친구를 위한 깜짝 생일 파티를 준비하고 있습니다. 여러 사람에게 전화하여 초대하고 조율하세요: 각자 무엇을 가져와야 하나요? 언제 도착해야 하나요? 어떻게 비밀을 유지할 수 있나요? 모두가 계획을 이해하도록 하세요." },
        { question: "Your flight has been cancelled due to weather, and you need to catch an important business meeting tomorrow in another city. Talk to the airline representative to find alternative solutions - different flights, other airlines, or compensation for the inconvenience.", questionKR: "날씨로 인해 항공편이 취소되었고, 내일 다른 도시에서 중요한 비즈니스 미팅에 참석해야 합니다. 항공사 직원과 이야기하여 대안을 찾으세요. 다른 항공편, 다른 항공사 또는 불편에 대한 보상 등을 논의하세요." },
        { question: "You're a doctor explaining a medical diagnosis to a patient. The patient has high blood pressure and needs to make lifestyle changes. Explain the condition, why it's serious, what changes they need to make, and answer their concerns about medication side effects.", questionKR: "의사로서 환자에게 의학적 진단을 설명하고 있습니다. 환자는 고혈압이 있으며 생활 습관을 바꿔야 합니다. 병의 상태, 왜 심각한지, 어떤 변화가 필요한지 설명하고 약물 부작용에 대한 우려에 답하세요." },
        { question: "You're mediating a conflict between two coworkers who disagree about how to complete a project. Listen to both sides, understand their perspectives, and propose a compromise that addresses everyone's concerns while ensuring the project succeeds.", questionKR: "프로젝트 완성 방법에 대해 의견이 다른 두 동료 사이의 갈등을 중재하고 있습니다. 양측의 이야기를 듣고, 그들의 관점을 이해하며, 프로젝트가 성공하도록 하면서 모든 사람의 우려를 해결하는 타협안을 제시하세요." },
        { question: "You're giving a presentation to convince investors to fund your business idea. Explain what your business does, why it's innovative, what problem it solves, who your target customers are, and why investors should believe in your success.", questionKR: "투자자들에게 비즈니스 아이디어에 자금을 지원하도록 설득하는 프레젠테이션을 하고 있습니다. 비즈니스가 무엇을 하는지, 왜 혁신적인지, 어떤 문제를 해결하는지, 목표 고객이 누구인지, 투자자들이 왜 성공을 믿어야 하는지 설명하세요." },
        { question: "You're a teacher calling a parent about their child's behavior problems in class. The child is disruptive and not completing homework. Explain the situation diplomatically, discuss possible causes, and work with the parent to create an action plan for improvement.", questionKR: "교사로서 수업 중 아이의 행동 문제에 대해 학부모에게 전화하고 있습니다. 아이가 수업을 방해하고 숙제를 완성하지 않습니다. 상황을 외교적으로 설명하고, 가능한 원인을 논의하며, 개선을 위한 행동 계획을 학부모와 함께 만드세요." }
      ]
    };

      // Randomly select questions: 2 easy, 2 medium, 1 hard
      const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const selectedEasy = shuffleArray(allQuestions.easy).slice(0, 2);
      const selectedMedium = shuffleArray(allQuestions.medium).slice(0, 2);
      const selectedHard = shuffleArray(allQuestions.hard).slice(0, 1);

      // Create final exam questions with proper structure
      examQuestions = [
        ...selectedEasy.map((q, idx) => ({
          id: idx + 1,
          difficulty: 'easy',
          question: q.question,
          questionKR: q.questionKR,
          timeLimit: seconds
        })),
        ...selectedMedium.map((q, idx) => ({
          id: idx + 3,
          difficulty: 'medium',
          question: q.question,
          questionKR: q.questionKR,
          timeLimit: seconds
        })),
        ...selectedHard.map((q, idx) => ({
          id: 5,
          difficulty: 'hard',
          question: q.question,
          questionKR: q.questionKR,
          timeLimit: seconds * 3  // Roleplay gets 3x time
        }))
      ];
    }

    // Initialize exam state
    this.currentExam = {
      questions: examQuestions,
      currentQuestionIndex: 0,
      answers: [],
      responseTimeLimit: seconds,
      sessionId: null,
      isQuestionRevealed: false
    };

    // Track exam mode usage
    try {
      this.incrementDailyUsage('exam_mode');
    } catch (error) {
      console.warn('⚠️ Failed to track usage:', error);
    }

    // Create session for exam mode
    try {
      const sessionResponse = await axios.post('/api/sessions/create', {
        userId: this.currentUser.id,
        topicId: 997, // Special ID for exam mode
        level: this.currentUser.level || 'intermediate'
      });
      this.currentExam.sessionId = sessionResponse.data.sessionId;
      console.log('✅ Exam session created:', this.currentExam.sessionId);
    } catch (error) {
      console.warn('⚠️ Failed to create exam session:', error);
    }

    // Show first question
    this.showExamQuestion();
  }

  showExamQuestion() {
    const { questions, currentQuestionIndex } = this.currentExam;
    const question = questions[currentQuestionIndex];
    const progress = Math.round(((currentQuestionIndex) / questions.length) * 100);

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900">
        <div class="flex-1 flex flex-col items-center justify-center p-4">
          <!-- Back Button -->
          <button onclick="if(confirm('시험을 중단하시겠습니까?')) worvox.showExamMode()" 
            class="absolute top-4 left-4 md:top-6 md:left-6 text-white/70 hover:text-white transition-all p-2 hover:bg-white/10 rounded-lg">
            <i class="fas fa-arrow-left text-xl mr-2"></i><span class="hidden md:inline">나가기</span>
          </button>
          
          <!-- Progress -->
          <div class="absolute top-4 right-4 md:top-6 md:right-6 text-white">
            <div class="text-sm opacity-70 mb-1">문제</div>
            <div class="text-2xl font-bold">${currentQuestionIndex + 1}/5</div>
          </div>
          
          <!-- Question Card -->
          <div class="bg-white rounded-2xl p-8 md:p-12 shadow-2xl max-w-4xl w-full mb-8 relative">
            <!-- Blur Overlay (removed when start button is clicked) -->
            <div id="questionBlur" class="absolute inset-0 backdrop-blur-md bg-white/50 rounded-2xl flex items-center justify-center z-10">
              <button id="startQuestionBtn" onclick="worvox.revealExamQuestion()" 
                class="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-12 py-6 rounded-xl text-2xl font-bold shadow-2xl transform hover:scale-105 transition-all">
                <i class="fas fa-play mr-3"></i>시작하기
              </button>
            </div>
            
            <div class="text-center mb-6">
              <div class="inline-block bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-bold mb-4">
                ${question.difficulty === 'easy' ? '⭐ 쉬움' : question.difficulty === 'medium' ? '⭐⭐ 보통' : '⭐⭐⭐ 어려움'}
              </div>
              <div class="text-lg text-gray-600 mb-4">Question ${question.id}</div>
            </div>
            
            <div id="questionContent">
              <p class="text-2xl md:text-3xl text-gray-900 leading-relaxed text-center font-medium mb-4">
                ${question.question}
              </p>
              <p class="text-base text-gray-600 text-center italic">
                ${question.questionKR}
              </p>
            </div>
            
            <!-- Timer (hidden initially) -->
            <div id="examTimer" class="hidden mt-8">
              <div class="text-center">
                <div class="text-6xl font-bold text-orange-600 mb-2" id="examCountdown">${question.timeLimit}</div>
                <div class="text-gray-600">남은 시간</div>
              </div>
            </div>
            
            <!-- Recording Status (hidden initially) -->
            <div id="examRecordingStatus" class="hidden mt-6 text-center">
              <div class="inline-flex items-center gap-3 bg-red-500 text-white px-6 py-3 rounded-full animate-pulse">
                <div class="w-3 h-3 bg-white rounded-full animate-ping"></div>
                <span class="font-bold">녹음 중...</span>
              </div>
            </div>
          </div>
          
          <!-- Instruction Text (hidden initially) -->
          <div id="instructionText" class="hidden text-white text-center">
            <p class="text-lg font-medium">답변을 말해주세요</p>
            <p class="text-sm text-white/70 mt-2">타이머가 끝나면 자동으로 다음 문제로 넘어갑니다</p>
          </div>
        </div>
      </div>
    `;
  }

  async revealExamQuestion() {
    const { questions, currentQuestionIndex } = this.currentExam;
    const question = questions[currentQuestionIndex];

    // Remove blur
    const blurEl = document.getElementById('questionBlur');
    if (blurEl) {
      blurEl.remove();
    }

    this.currentExam.isQuestionRevealed = true;

    // Show "listening" status immediately
    const instructionEl = document.getElementById('instructionText');
    if (instructionEl) {
      instructionEl.classList.remove('hidden');
      instructionEl.innerHTML = `
        <p class="text-lg font-medium">🔊 문제를 듣고 있습니다...</p>
        <p class="text-sm text-white/70 mt-2">잠시만 기다려주세요</p>
      `;
    }

    // Read question with TTS
    try {
      console.log('🎤 Requesting TTS for question:', question.question);
      
      const response = await axios.post('/api/tts/speak', {
        text: question.question
      }, {
        responseType: 'blob'
      });

      console.log('✅ TTS response received');

      if (response.data) {
        // Create audio URL from blob
        const audioBlob = response.data;
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Add error handler
        audio.onerror = (error) => {
          console.error('❌ Audio playback error:', error);
          if (instructionEl) {
            instructionEl.innerHTML = `
              <p class="text-lg font-medium text-yellow-300">⚠️ 음성 재생 실패</p>
              <p class="text-sm text-white/70 mt-2">3초 후 타이머가 시작됩니다</p>
            `;
          }
          setTimeout(() => {
            this.startExamCountdown();
          }, 3000);
        };
        
        // Start countdown after audio finishes
        audio.onended = () => {
          console.log('✅ TTS playback finished');
          URL.revokeObjectURL(audioUrl); // Clean up
          this.startExamCountdown();
        };
        
        // Start playing
        try {
          await audio.play();
          console.log('🔊 TTS audio is playing...');
        } catch (playError) {
          console.error('❌ Failed to play audio:', playError);
          URL.revokeObjectURL(audioUrl); // Clean up
          if (instructionEl) {
            instructionEl.innerHTML = `
              <p class="text-lg font-medium text-yellow-300">⚠️ 음성 재생 실패</p>
              <p class="text-sm text-white/70 mt-2">3초 후 타이머가 시작됩니다</p>
            `;
          }
          setTimeout(() => {
            this.startExamCountdown();
          }, 3000);
        }
      } else {
        console.warn('⚠️ No audio data in TTS response');
        if (instructionEl) {
          instructionEl.innerHTML = `
            <p class="text-lg font-medium text-yellow-300">⚠️ TTS 응답 없음</p>
            <p class="text-sm text-white/70 mt-2">3초 후 타이머가 시작됩니다</p>
          `;
        }
        setTimeout(() => {
          this.startExamCountdown();
        }, 3000);
      }
    } catch (error) {
      console.error('❌ TTS request error:', error);
      if (instructionEl) {
        instructionEl.innerHTML = `
          <p class="text-lg font-medium text-yellow-300">⚠️ TTS 요청 실패</p>
          <p class="text-sm text-white/70 mt-2">3초 후 타이머가 시작됩니다</p>
        `;
      }
      setTimeout(() => {
        this.startExamCountdown();
      }, 3000);
    }
  }

  async startExamCountdown() {
    const { questions, currentQuestionIndex } = this.currentExam;
    const question = questions[currentQuestionIndex];

    // Show timer
    const timerEl = document.getElementById('examTimer');
    const instructionEl = document.getElementById('instructionText');
    const recordingStatusEl = document.getElementById('examRecordingStatus');
    
    if (timerEl) timerEl.classList.remove('hidden');
    if (recordingStatusEl) recordingStatusEl.classList.remove('hidden');
    if (instructionEl) {
      instructionEl.classList.remove('hidden');
      instructionEl.innerHTML = `
        <p class="text-lg font-medium">답변을 말해주세요</p>
        <p class="text-sm text-white/70 mt-2">타이머가 끝나면 자동으로 다음 문제로 넘어갑니다</p>
      `;
    }

    // Start recording
    await this.startExamRecording();

    // Countdown
    let timeLeft = question.timeLimit;
    const countdownEl = document.getElementById('examCountdown');

    const interval = setInterval(() => {
      timeLeft--;
      if (countdownEl) {
        countdownEl.textContent = timeLeft;
        
        // Change color when time is running out
        if (timeLeft <= 3) {
          countdownEl.classList.add('text-red-600');
        }
      }

      if (timeLeft <= 0) {
        clearInterval(interval);
        this.stopExamRecording();
      }
    }, 1000);
  }

  async startExamRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.examMediaRecorder = new MediaRecorder(stream);
      this.examAudioChunks = [];

      this.examMediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.examAudioChunks.push(event.data);
        }
      };

      this.examMediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.examAudioChunks, { type: 'audio/webm' });
        await this.processExamAnswer(audioBlob);
      };

      this.examMediaRecorder.start();
      console.log('✅ Exam recording started');
    } catch (error) {
      console.error('Failed to start exam recording:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  }

  stopExamRecording() {
    if (this.examMediaRecorder && this.examMediaRecorder.state === 'recording') {
      this.examMediaRecorder.stop();
      this.examMediaRecorder.stream.getTracks().forEach(track => track.stop());
      console.log('✅ Exam recording stopped');
    }
  }

  async processExamAnswer(audioBlob) {
    const { questions, currentQuestionIndex } = this.currentExam;
    const question = questions[currentQuestionIndex];

    // Show enhanced processing message with stages
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gradient-to-br from-orange-50 to-red-50 items-center justify-center">
        <div class="text-center max-w-md">
          <div class="relative w-24 h-24 mx-auto mb-6">
            <svg class="transform -rotate-90 w-24 h-24">
              <circle cx="48" cy="48" r="40" stroke="#e5e7eb" stroke-width="6" fill="none" />
              <circle cx="48" cy="48" r="40" stroke="#f97316" stroke-width="6" fill="none"
                stroke-dasharray="${2 * Math.PI * 40}" 
                stroke-dashoffset="${2 * Math.PI * 40 * 0.7}" 
                stroke-linecap="round"
                class="animate-spin" style="animation-duration: 2s;" />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <i class="fas fa-brain text-orange-600 text-3xl"></i>
            </div>
          </div>
          <p class="text-2xl font-bold text-gray-800 mb-2">답변 분석 중...</p>
          <div class="space-y-2 text-sm text-gray-600">
            <div class="flex items-center justify-center gap-2">
              <i class="fas fa-spinner fa-spin text-orange-600"></i>
              <span>🎤 음성 인식 중...</span>
            </div>
            <p class="text-xs text-gray-500 mt-4">문제 ${currentQuestionIndex + 1} / ${questions.length}</p>
          </div>
        </div>
      </div>
    `;

    try {
      // Transcribe audio using STT API
      const formData = new FormData();
      formData.append('audio', audioBlob, 'answer.webm');

      const sttResponse = await axios.post('/api/stt/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const transcription = sttResponse.data.transcription || '';
      const audioAnalysis = sttResponse.data.analysis || null;
      console.log('✅ Exam transcription:', transcription);
      console.log('✅ Exam audio analysis:', audioAnalysis);

      // Update progress: STT completed, now calculating scores
      app.innerHTML = `
        <div class="flex h-screen bg-gradient-to-br from-orange-50 to-red-50 items-center justify-center">
          <div class="text-center max-w-md">
            <div class="relative w-24 h-24 mx-auto mb-6">
              <svg class="transform -rotate-90 w-24 h-24">
                <circle cx="48" cy="48" r="40" stroke="#e5e7eb" stroke-width="6" fill="none" />
                <circle cx="48" cy="48" r="40" stroke="#f97316" stroke-width="6" fill="none"
                  stroke-dasharray="${2 * Math.PI * 40}" 
                  stroke-dashoffset="${2 * Math.PI * 40 * 0.4}" 
                  stroke-linecap="round"
                  class="animate-spin" style="animation-duration: 2s;" />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <i class="fas fa-calculator text-orange-600 text-3xl"></i>
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-800 mb-2">점수 계산 중...</p>
            <div class="space-y-2 text-sm text-gray-600">
              <div class="flex items-center justify-center gap-2">
                <i class="fas fa-check-circle text-green-600"></i>
                <span>🎤 음성 인식 완료</span>
              </div>
              <div class="flex items-center justify-center gap-2">
                <i class="fas fa-spinner fa-spin text-orange-600"></i>
                <span>⚡ 점수 계산 중...</span>
              </div>
              <p class="text-xs text-gray-500 mt-4">문제 ${currentQuestionIndex + 1} / ${questions.length}</p>
            </div>
          </div>
        </div>
      `;

      // 🚀 Two-stage analysis for faster UX
      let accuracy = 70, pronunciation = 70, fluency = 70, grammar = 70;
      let grammarFeedback = '', grammarIssues = [];
      
      if (transcription) {
        try {
          // Stage 1: Quick scores (~500ms)
          const quickStartTime = Date.now();
          console.log('⚡ Stage 1: Getting quick exam scores...');
          const quickResponse = await axios.post('/api/pronunciation/analyze-quick', {
            referenceText: question.question,
            userTranscription: transcription,
            audioAnalysis: audioAnalysis
          });
          
          console.log(`⚡ Quick exam scores received in ${Date.now() - quickStartTime}ms`);
          
          if (quickResponse.data.success) {
            accuracy = quickResponse.data.accuracy;
            pronunciation = quickResponse.data.pronunciation;
            fluency = quickResponse.data.fluency;
            grammar = quickResponse.data.grammar || 70;
            console.log('⚡ Quick exam scores:', {accuracy, pronunciation, fluency, grammar});
            
            // Update progress: Quick scores calculated
            app.innerHTML = `
              <div class="flex h-screen bg-gradient-to-br from-orange-50 to-red-50 items-center justify-center">
                <div class="text-center max-w-md">
                  <div class="relative w-24 h-24 mx-auto mb-6">
                    <svg class="transform -rotate-90 w-24 h-24">
                      <circle cx="48" cy="48" r="40" stroke="#e5e7eb" stroke-width="6" fill="none" />
                      <circle cx="48" cy="48" r="40" stroke="#f97316" stroke-width="6" fill="none"
                        stroke-dasharray="${2 * Math.PI * 40}" 
                        stroke-dashoffset="${2 * Math.PI * 40 * 0.3}" 
                        stroke-linecap="round"
                        class="animate-spin" style="animation-duration: 2s;" />
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <i class="fas fa-brain text-orange-600 text-3xl"></i>
                    </div>
                  </div>
                  <p class="text-2xl font-bold text-gray-800 mb-2">AI 피드백 생성 중...</p>
                  <div class="space-y-2 text-sm text-gray-600">
                    <div class="flex items-center justify-center gap-2">
                      <i class="fas fa-check-circle text-green-600"></i>
                      <span>🎤 음성 인식 완료</span>
                    </div>
                    <div class="flex items-center justify-center gap-2">
                      <i class="fas fa-check-circle text-green-600"></i>
                      <span>⚡ 점수 계산 완료</span>
                    </div>
                    <div class="flex items-center justify-center gap-2">
                      <i class="fas fa-spinner fa-spin text-orange-600"></i>
                      <span>🤖 상세 피드백 생성 중...</span>
                    </div>
                    <p class="text-xs text-gray-500 mt-4">문제 ${currentQuestionIndex + 1} / ${questions.length}</p>
                  </div>
                </div>
              </div>
            `;
          }
          
          // Stage 2: Detailed AI analysis (background, ~5 seconds)
          console.log('🎯 Stage 2: Loading detailed exam AI feedback...');
          const detailedStartTime = Date.now();
          const analysisResponse = await axios.post('/api/pronunciation/analyze', {
            referenceText: question.question,
            userTranscription: transcription,
            audioAnalysis: audioAnalysis
          });

          console.log(`⏱️ Detailed exam analysis completed in ${Date.now() - detailedStartTime}ms (Cached: ${analysisResponse.data.cached ? 'YES' : 'NO'})`);

          if (analysisResponse.data.success) {
            // Blend quick scores with AI scores for smooth transition
            const aiAccuracy = analysisResponse.data.accuracy;
            const aiPronunciation = analysisResponse.data.pronunciation;
            const aiFluency = analysisResponse.data.fluency;
            const aiGrammar = analysisResponse.data.grammar || 70;
            
            accuracy = Math.round(accuracy * 0.7 + aiAccuracy * 0.3);
            pronunciation = Math.round(pronunciation * 0.7 + aiPronunciation * 0.3);
            fluency = Math.round(fluency * 0.7 + aiFluency * 0.3);
            grammar = Math.round(grammar * 0.7 + aiGrammar * 0.3);
            
            grammarFeedback = analysisResponse.data.grammarFeedback || '';
            grammarIssues = analysisResponse.data.grammarIssues || [];
            console.log('✅ Exam detailed analysis:', {accuracy, pronunciation, fluency, grammar});
          }
        } catch (error) {
          console.warn('⚠️ Failed to get exam analysis, using default scores:', error);
        }
      }

      // Create audio URL for playback
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Save answer
      this.currentExam.answers.push({
        questionId: question.id,
        question: question.question,
        questionKR: question.questionKR,
        transcription: transcription,
        audioUrl: audioUrl, // Store audio URL for playback
        accuracy: accuracy,
        pronunciation: pronunciation,
        fluency: fluency,
        grammar: grammar,
        grammarFeedback: grammarFeedback,
        grammarIssues: grammarIssues,
        averageScore: Math.round((accuracy + pronunciation + fluency + grammar) / 4)
      });

      // Save to session messages
      if (this.currentExam.sessionId) {
        try {
          await axios.post('/api/messages/create', {
            sessionId: this.currentExam.sessionId,
            role: 'system',
            content: `Exam Q${question.id}: ${question.question}`
          });

          await axios.post('/api/messages/create', {
            sessionId: this.currentExam.sessionId,
            role: 'user',
            content: transcription || '(인식되지 않음)'
          });
        } catch (error) {
          console.warn('⚠️ Failed to save messages:', error);
        }
      }

      // Move to next question or show results
      this.currentExam.currentQuestionIndex++;

      if (this.currentExam.currentQuestionIndex < questions.length) {
        // Show next question
        this.currentExam.isQuestionRevealed = false;
        this.showExamQuestion();
      } else {
        // End session and show results
        if (this.currentExam.sessionId) {
          try {
            await axios.post(`/api/sessions/end/${this.currentExam.sessionId}`);
            console.log('✅ Exam session ended');
          } catch (error) {
            console.warn('⚠️ Failed to end session:', error);
          }
        }
        this.showExamResults();
      }
    } catch (error) {
      console.error('Failed to process exam answer:', error);
      alert('답변 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      this.showExamMode();
    }
  }

  async playExamAudio(audioUrl, buttonElement) {
    // Stop any currently playing audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    // Visual feedback: find the button that was clicked
    const button = buttonElement ? buttonElement : event?.target?.closest('button');
    const originalHTML = button?.innerHTML || '';

    try {
      if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>재생 중...';
      }

      this.currentAudio = new Audio(audioUrl);
      
      // Reset button when audio ends
      this.currentAudio.onended = () => {
        if (button) {
          button.disabled = false;
          button.innerHTML = originalHTML;
        }
        this.currentAudio = null;
      };

      // Reset button on error
      this.currentAudio.onerror = () => {
        if (button) {
          button.disabled = false;
          button.innerHTML = originalHTML;
        }
        console.error('Failed to play audio');
        alert('오디오 재생에 실패했습니다.');
        this.currentAudio = null;
      };

      await this.currentAudio.play();
      console.log('✅ Playing exam answer audio');
    } catch (error) {
      console.error('Failed to play audio:', error);
      if (button) {
        button.disabled = false;
        button.innerHTML = originalHTML;
      }
      alert('오디오 재생에 실패했습니다.');
    }
  }

  async showExamResults() {
    // Show loading screen
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gradient-to-br from-orange-50 to-red-50">
        ${this.getSidebar('exam-mode')}
        <div class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="text-6xl mb-4">🎓</div>
            <h2 class="text-2xl font-bold text-gray-800 mb-4">시험 결과 분석 중...</h2>
            <div class="flex items-center justify-center gap-2 text-gray-600">
              <i class="fas fa-spinner fa-spin"></i>
              <span>AI가 더 나은 답변 예시를 생성하고 있습니다</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const { answers } = this.currentExam;

    // Generate improved answers (Premium feature only)
    let answersWithImprovement = [...answers];
    
    if (this.currentUser?.plan === 'premium') {
      const batchStartTime = Date.now();
      console.log('🎯 Generating improved answer examples (Premium feature)...');
      try {
        const response = await axios.post('/api/pronunciation/generate-improved-answers-batch', {
          questions: answers.map(answer => ({
            question: answer.question,
            questionKR: answer.questionKR,
            userAnswer: answer.transcription
          })),
          userLevel: this.currentUser?.level || 'intermediate'
        });
        
        const batchEndTime = Date.now();
        console.log(`⏱️ Batch improved answers generated in ${batchEndTime - batchStartTime}ms`);
        
        if (response.data.success && response.data.answers) {
          // Merge improved answers with original answers
          answersWithImprovement = answers.map((answer, index) => {
            const improvedData = response.data.answers[index];
            if (improvedData) {
              console.log('✅ Generated improved answer for question:', answer.questionId);
              return {
                ...answer,
                improvedAnswer: improvedData.improvedAnswer,
                improvedAnswerKR: improvedData.improvedAnswerKR,
                keyPoints: improvedData.keyPoints || []
              };
            }
            return answer;
          });
          console.log('✅ All improved answers generated:', answersWithImprovement);
        } else {
          console.warn('⚠️ Batch generation failed, continuing without improved answers');
        }
      } catch (error) {
        console.warn('⚠️ Failed to generate improved answers in batch:', error);
        // Continue with original answers if batch fails
      }
    } else {
      console.log('ℹ️ Improved answer generation is a Premium feature');
    }

    // Calculate average scores (use answersWithImprovement instead of answers)
    const totalAccuracy = answersWithImprovement.reduce((sum, a) => sum + a.accuracy, 0);
    const totalPronunciation = answersWithImprovement.reduce((sum, a) => sum + a.pronunciation, 0);
    const totalFluency = answersWithImprovement.reduce((sum, a) => sum + a.fluency, 0);
    const totalGrammar = answersWithImprovement.reduce((sum, a) => sum + (a.grammar || 70), 0);

    const avgAccuracy = Math.round(totalAccuracy / answersWithImprovement.length);
    const avgPronunciation = Math.round(totalPronunciation / answersWithImprovement.length);
    const avgFluency = Math.round(totalFluency / answersWithImprovement.length);
    const avgGrammar = Math.round(totalGrammar / answersWithImprovement.length);
    const overallAverage = Math.round((avgAccuracy + avgPronunciation + avgFluency + avgGrammar) / 4);

    // Determine OPIC level
    let opicLevel = 'Novice Low';
    let opicColor = 'text-gray-600';
    let opicBg = 'bg-gray-100';
    let opicDescription = '기초적인 표현이 가능한 수준';

    if (overallAverage >= 90) {
      opicLevel = 'Advanced Low';
      opicColor = 'text-purple-600';
      opicBg = 'bg-purple-100';
      opicDescription = '복잡한 상황에서도 효과적으로 의사소통 가능';
    } else if (overallAverage >= 80) {
      opicLevel = 'Intermediate High';
      opicColor = 'text-blue-600';
      opicBg = 'bg-blue-100';
      opicDescription = '다양한 주제에 대해 유창하게 대화 가능';
    } else if (overallAverage >= 70) {
      opicLevel = 'Intermediate Mid';
      opicColor = 'text-green-600';
      opicBg = 'bg-green-100';
      opicDescription = '일상적인 주제에 대해 자신있게 대화 가능';
    } else if (overallAverage >= 60) {
      opicLevel = 'Intermediate Low';
      opicColor = 'text-yellow-600';
      opicBg = 'bg-yellow-100';
      opicDescription = '익숙한 주제에 대해 간단한 대화 가능';
    } else if (overallAverage >= 50) {
      opicLevel = 'Novice High';
      opicColor = 'text-orange-600';
      opicBg = 'bg-orange-100';
      opicDescription = '기본적인 정보 교환 가능';
    }

    // 💾 Save exam report to database
    if (this.currentExam.sessionId && this.currentUser) {
      try {
        const reportData = {
          answers: answersWithImprovement,
          avgAccuracy,
          avgPronunciation,
          avgFluency,
          avgGrammar,
          overallAverage,
          opicLevel,
          opicDescription,
          totalQuestions: answersWithImprovement.length,
          completedAt: new Date().toISOString()
        };
        
        await axios.post('/api/mode-reports/save', {
          sessionId: this.currentExam.sessionId,
          userId: this.currentUser.id,
          modeType: 'exam',
          reportData: reportData
        });
        console.log('✅ Exam report saved successfully');
      } catch (error) {
        console.warn('⚠️ Failed to save exam report:', error);
      }
    }

    // Render final results (reuse app variable from above)
    app.innerHTML = `
      <div class="flex h-screen bg-gradient-to-br from-orange-50 to-red-50">
        ${this.getSidebar('exam-mode')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Header -->
          <div class="bg-white border-b border-orange-200 px-4 md:px-6 py-3">
            <h2 class="text-lg font-semibold text-gray-800">
              <i class="fas fa-chart-bar mr-2 text-orange-600"></i>시험 결과
            </h2>
          </div>
          
          <!-- Content -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-8">
              <div class="max-w-4xl mx-auto">
                <!-- Overall Result Card -->
                <div class="bg-white rounded-2xl p-8 shadow-lg border-2 border-orange-200 mb-6">
                  <div class="text-center mb-6">
                    <div class="text-6xl mb-4">🎓</div>
                    <h2 class="text-3xl font-bold text-gray-900 mb-3">시험 완료!</h2>
                    <div class="text-5xl font-bold text-orange-600 mb-2">${overallAverage}점</div>
                    <p class="text-gray-600 mb-4">평균 점수</p>
                    
                    <!-- OPIC Level -->
                    <div class="inline-block ${opicBg} ${opicColor} px-6 py-3 rounded-xl font-bold text-xl mb-2">
                      ${opicLevel}
                    </div>
                    <p class="text-gray-600">${opicDescription}</p>
                  </div>
                  
                  <!-- Average Scores -->
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="text-center">
                      <div class="text-gray-600 text-sm mb-2">평균 정확도</div>
                      <div class="relative w-20 h-20 mx-auto">
                        <svg class="transform -rotate-90 w-20 h-20">
                          <circle cx="40" cy="40" r="30" stroke="#e5e7eb" stroke-width="8" fill="none" />
                          <circle cx="40" cy="40" r="30" stroke="#3b82f6" stroke-width="8" fill="none"
                            stroke-dasharray="${2 * Math.PI * 30}" 
                            stroke-dashoffset="${2 * Math.PI * 30 * (1 - avgAccuracy / 100)}" 
                            stroke-linecap="round" />
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center">
                          <span class="text-lg font-bold text-blue-600">${avgAccuracy}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div class="text-center">
                      <div class="text-gray-600 text-sm mb-2">평균 발음</div>
                      <div class="relative w-20 h-20 mx-auto">
                        <svg class="transform -rotate-90 w-20 h-20">
                          <circle cx="40" cy="40" r="30" stroke="#e5e7eb" stroke-width="8" fill="none" />
                          <circle cx="40" cy="40" r="30" stroke="#10b981" stroke-width="8" fill="none"
                            stroke-dasharray="${2 * Math.PI * 30}" 
                            stroke-dashoffset="${2 * Math.PI * 30 * (1 - avgPronunciation / 100)}" 
                            stroke-linecap="round" />
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center">
                          <span class="text-lg font-bold text-green-600">${avgPronunciation}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div class="text-center">
                      <div class="text-gray-600 text-sm mb-2">평균 유창성</div>
                      <div class="relative w-20 h-20 mx-auto">
                        <svg class="transform -rotate-90 w-20 h-20">
                          <circle cx="40" cy="40" r="30" stroke="#e5e7eb" stroke-width="8" fill="none" />
                          <circle cx="40" cy="40" r="30" stroke="#f59e0b" stroke-width="8" fill="none"
                            stroke-dasharray="${2 * Math.PI * 30}" 
                            stroke-dashoffset="${2 * Math.PI * 30 * (1 - avgFluency / 100)}" 
                            stroke-linecap="round" />
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center">
                          <span class="text-lg font-bold text-orange-600">${avgFluency}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div class="text-center">
                      <div class="text-gray-600 text-sm mb-2">평균 문법</div>
                      <div class="relative w-20 h-20 mx-auto">
                        <svg class="transform -rotate-90 w-20 h-20">
                          <circle cx="40" cy="40" r="30" stroke="#e5e7eb" stroke-width="8" fill="none" />
                          <circle cx="40" cy="40" r="30" stroke="#8b5cf6" stroke-width="8" fill="none"
                            stroke-dasharray="${2 * Math.PI * 30}" 
                            stroke-dashoffset="${2 * Math.PI * 30 * (1 - avgGrammar / 100)}" 
                            stroke-linecap="round" />
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center">
                          <span class="text-lg font-bold text-purple-600">${avgGrammar}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Detailed Results by Question -->
                <div class="bg-white rounded-2xl p-6 shadow-lg mb-6">
                  <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i class="fas fa-list-check text-orange-600"></i>
                    문제별 결과
                  </h3>
                  
                  <div class="space-y-4">
                    ${answersWithImprovement.map((answer, index) => `
                      <div class="border border-gray-200 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                          <span class="text-sm font-semibold text-gray-700">문제 ${answer.questionId}</span>
                          <div class="flex flex-wrap gap-2">
                            <span class="text-xs font-medium px-2 py-1 rounded ${
                              answer.accuracy >= 80 ? 'bg-green-100 text-green-700' :
                              answer.accuracy >= 60 ? 'bg-blue-100 text-blue-700' :
                              answer.accuracy >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }">정확도 ${answer.accuracy}</span>
                            <span class="text-xs font-medium px-2 py-1 rounded ${
                              answer.pronunciation >= 80 ? 'bg-green-100 text-green-700' :
                              answer.pronunciation >= 60 ? 'bg-blue-100 text-blue-700' :
                              answer.pronunciation >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }">발음 ${answer.pronunciation}</span>
                            <span class="text-xs font-medium px-2 py-1 rounded ${
                              answer.fluency >= 80 ? 'bg-green-100 text-green-700' :
                              answer.fluency >= 60 ? 'bg-blue-100 text-blue-700' :
                              answer.fluency >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }">유창성 ${answer.fluency}</span>
                            <span class="text-xs font-medium px-2 py-1 rounded ${
                              (answer.grammar || 70) >= 80 ? 'bg-green-100 text-green-700' :
                              (answer.grammar || 70) >= 60 ? 'bg-blue-100 text-blue-700' :
                              (answer.grammar || 70) >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }">문법 ${answer.grammar || 70}</span>
                          </div>
                        </div>
                        
                        <div class="mb-3">
                          <div class="flex items-center justify-between mb-1">
                            <div class="text-xs text-gray-600">질문</div>
                          </div>
                          <div class="bg-gray-50 rounded p-2 text-sm text-gray-900 mb-1">${answer.question}</div>
                          <div class="text-xs text-gray-500 italic">${answer.questionKR}</div>
                        </div>
                        
                        <div class="mb-3">
                          <div class="flex items-center justify-between mb-1">
                            <div class="text-xs text-gray-600">당신의 답변</div>
                            ${answer.audioUrl ? `
                              <button onclick="worvox.playExamAudio('${answer.audioUrl}')" 
                                class="text-purple-600 hover:text-purple-800 text-xs px-2 py-1 rounded hover:bg-purple-50 transition-all">
                                <i class="fas fa-play mr-1"></i>다시 듣기
                              </button>
                            ` : ''}
                          </div>
                          <div class="bg-blue-50 rounded p-2 text-sm text-gray-900">${answer.transcription || '(인식되지 않음)'}</div>
                        </div>
                        
                        ${answer.improvedAnswer ? `
                        <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                          <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-lightbulb text-yellow-500"></i>
                            <div class="text-xs font-semibold text-green-700">💎 더 나은 답변 예시 (Premium)</div>
                          </div>
                          <div class="bg-white rounded p-3 mb-2">
                            <div class="text-sm text-gray-900 mb-2">${answer.improvedAnswer}</div>
                            <div class="text-xs text-gray-500 italic border-t pt-2">${answer.improvedAnswerKR || ''}</div>
                          </div>
                          ${answer.keyPoints && answer.keyPoints.length > 0 ? `
                            <div class="text-xs text-green-700 space-y-1">
                              <div class="font-semibold mb-1">💡 개선 포인트:</div>
                              ${answer.keyPoints.map(point => `<div class="flex items-start gap-1"><span>•</span><span>${point}</span></div>`).join('')}
                            </div>
                          ` : ''}
                        </div>
                        ` : `
                        ${this.currentUser?.plan !== 'premium' ? `
                        <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                          <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-crown text-yellow-500"></i>
                            <div class="text-xs font-semibold text-purple-700">더 나은 답변 예시 (Premium 전용)</div>
                          </div>
                          <div class="bg-white rounded p-3 text-sm text-gray-600">
                            <p class="mb-2">🎓 AI가 분석한 <strong>개선된 답변 예시</strong>를 받아보세요!</p>
                            <ul class="text-xs space-y-1 mb-3">
                              <li>✓ 더 나은 답변 구조와 표현</li>
                              <li>✓ 한글 번역 제공</li>
                              <li>✓ 구체적인 개선 포인트 3가지</li>
                            </ul>
                            <button onclick="worvox.showPlan()" class="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs font-semibold py-2 px-4 rounded transition-all">
                              <i class="fas fa-crown mr-1"></i>Premium 구독하기
                            </button>
                          </div>
                        </div>
                        ` : ''}
                        `}
                      </div>
                    `).join('')}
                  </div>
                </div>
                
                <!-- Actions -->
                <div class="grid md:grid-cols-2 gap-4">
                  <button onclick="worvox.showExamMode()" 
                    class="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl p-4 font-bold transition-all">
                    <i class="fas fa-redo mr-2"></i>다시 시험보기
                  </button>
                  <button onclick="worvox.showTopicSelection()" 
                    class="bg-white hover:bg-gray-50 border-2 border-orange-200 text-orange-600 rounded-xl p-4 font-bold transition-all">
                    <i class="fas fa-home mr-2"></i>홈으로
                  </button>
                </div>
              </div>
              
              ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
  }


  showRealConversation() {
    // Load user from localStorage if not in memory
    if (!this.currentUser) {
      const storedUser = localStorage.getItem('worvox_user');
      if (storedUser) {
        try {
          this.currentUser = JSON.parse(storedUser);
          this.userPlan = this.currentUser.plan || 'free';
          console.log('🔍 Loaded user from localStorage:', this.currentUser);
        } catch (e) {
          console.error('Failed to parse stored user:', e);
        }
      }
    }
    
    // Ensure user is logged in (only check essential fields)
    if (!this.currentUser || !this.currentUser.id) {
      console.error('❌ User not logged in for Live Speaking');
      this.showLogin();
      return;
    }
    
    console.log('✅ User logged in for Live Speaking:', this.currentUser.email || this.currentUser.id);
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
        ${this.getSidebar('live-speaking')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Mobile Header -->
          <div class="md:hidden bg-white border-b border-gray-200 px-4 py-3">
            <div class="flex items-center justify-between">
              <button onclick="worvox.showTopicSelection()" class="text-gray-600">
                <i class="fas fa-arrow-left text-xl"></i>
              </button>
              <h1 class="text-lg font-semibold text-gray-800">1:1 Live Speaking Session</h1>
              <div class="w-6"></div>
            </div>
          </div>
          
          <!-- Desktop Top Bar -->
          <div class="hidden md:flex bg-white border-b border-gray-200 px-6 py-3 items-center gap-4">
            <button onclick="worvox.showTopicSelection()" 
              class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
              <i class="fas fa-arrow-left text-xl"></i>
            </button>
            <h2 class="text-lg font-semibold text-gray-800">
              <i class="fas fa-phone-volume mr-2"></i>1:1 Live Speaking Sessions
            </h2>
          </div>
          
          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-8">
              <div class="max-w-4xl mx-auto">
                <!-- My Lesson Credits -->
                <div id="liveSpeakingCredits" class="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 md:p-8 text-white mb-6 md:mb-8">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <h2 class="text-xl md:text-2xl font-bold mb-2">내 수업권</h2>
                      <p class="text-emerald-100 mb-4">1:1 프리미엄 전화영어</p>
                      <div class="flex items-center gap-4 mb-4">
                        <div>
                          <div id="remainingLessons" class="text-3xl md:text-4xl font-bold">
                            <i class="fas fa-spinner fa-spin"></i>
                          </div>
                          <div class="text-emerald-100 text-sm">잔여 수업</div>
                        </div>
                        <div class="h-12 w-px bg-emerald-300"></div>
                        <div>
                          <div id="completedLessons" class="text-3xl md:text-4xl font-bold">
                            <i class="fas fa-spinner fa-spin"></i>
                          </div>
                          <div class="text-emerald-100 text-sm">완료한 수업</div>
                        </div>
                      </div>
                      <!-- Book Lesson Button (shown when credits > 0) -->
                      <div id="bookLessonButton" style="display: none;">
                        <button onclick="worvox.showTeacherSelection()" 
                          class="bg-white text-emerald-600 px-6 py-3 rounded-lg font-bold hover:bg-emerald-50 transition-all shadow-lg inline-flex items-center gap-2">
                          <i class="fas fa-user-tie"></i>
                          <span>강사 선택하고 수업 예약하기</span>
                        </button>
                      </div>
                    </div>
                    <div class="hidden md:block">
                      <i class="fas fa-graduation-cap text-6xl text-white/20"></i>
                    </div>
                  </div>
                </div>
                
                <!-- Lesson Packages -->
                <h3 class="text-2xl font-bold text-gray-900 mb-4">수업권 구매</h3>
                <p class="text-gray-600 mb-6">월정기 구독으로 꾸준히 학습하세요 (Core 플랜 10% 할인, Premium 플랜 20% 할인)</p>
                
                <div class="grid md:grid-cols-3 gap-6 mb-8">
                  <!-- 1회 체험권 (무료) -->
                  <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-emerald-500 hover:border-emerald-600 transition-all">
                    <div class="text-center mb-4">
                      <div class="text-4xl mb-3">🎁</div>
                      <h4 class="text-xl font-bold text-gray-800 mb-2">1회 체험권</h4>
                      <div class="text-3xl font-bold text-emerald-600 mb-1">무료</div>
                      <p class="text-sm text-gray-600">첫 수업 체험</p>
                    </div>
                    
                    <ul class="space-y-2 mb-6">
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-check text-emerald-600 mt-1"></i>
                        <span class="text-gray-700">25분 수업 1회</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-check text-emerald-600 mt-1"></i>
                        <span class="text-gray-700">1:1 라이브 전화영어</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-check text-emerald-600 mt-1"></i>
                        <span class="text-gray-700">자유로운 예약</span>
                      </li>
                    </ul>
                    
                    <button onclick="worvox.purchaseLessons(1, 0, 'free')" 
                      class="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all">
                      무료 체험하기
                    </button>
                  </div>
                  
                  <!-- 월정기 10회권 -->
                  <div class="bg-white rounded-2xl shadow-2xl p-6 border-4 border-blue-500 relative transform md:scale-105">
                    <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-6 py-1 rounded-full text-sm font-bold">
                      인기
                    </div>
                    
                    <div class="text-center mb-4">
                      <div class="text-4xl mb-3">🎯</div>
                      <h4 class="text-xl font-bold text-gray-800 mb-2">월정기 10회</h4>
                      <div class="text-3xl font-bold text-blue-600 mb-1">₩165,000</div>
                      <p class="text-sm text-gray-600 mb-1">회당 ₩16,500</p>
                      <div class="flex items-center justify-center gap-2 mt-2">
                        <span class="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                          25분 기준
                        </span>
                        <span class="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                          매월 자동결제
                        </span>
                      </div>
                    </div>
                    
                    <ul class="space-y-2 mb-6">
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-check text-blue-600 mt-1"></i>
                        <span class="text-gray-700">매월 10회 수업</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-check text-blue-600 mt-1"></i>
                        <span class="text-gray-700">1:1 라이브 전화영어</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-check text-blue-600 mt-1"></i>
                        <span class="text-gray-700">자유로운 예약</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-star text-blue-600 mt-1"></i>
                        <span class="text-gray-700 font-semibold">해외 10년 거주 한국인 강사</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-gift text-blue-600 mt-1"></i>
                        <span class="text-gray-700"><strong>Core:</strong> 10% 할인 (₩148,500)</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-crown text-blue-600 mt-1"></i>
                        <span class="text-gray-700"><strong>Premium:</strong> 20% 할인 (₩132,000)</span>
                      </li>
                    </ul>
                    
                    <button onclick="worvox.purchaseLessons(10, 165000, 'monthly')" 
                      class="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg">
                      월정기 구독하기
                    </button>
                  </div>
                  
                  <!-- 월정기 20회권 -->
                  <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200 hover:border-purple-500 transition-all">
                    <div class="text-center mb-4">
                      <div class="text-4xl mb-3">🏆</div>
                      <h4 class="text-xl font-bold text-gray-800 mb-2">월정기 20회</h4>
                      <div class="text-3xl font-bold text-purple-600 mb-1">₩330,000</div>
                      <p class="text-sm text-gray-600 mb-1">회당 ₩16,500</p>
                      <div class="flex items-center justify-center gap-2 mt-2">
                        <span class="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                          25분 기준
                        </span>
                        <span class="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
                          매월 자동결제
                        </span>
                      </div>
                    </div>
                    
                    <ul class="space-y-2 mb-6">
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-check text-purple-600 mt-1"></i>
                        <span class="text-gray-700">매월 20회 수업</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-check text-purple-600 mt-1"></i>
                        <span class="text-gray-700">1:1 라이브 전화영어</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-check text-purple-600 mt-1"></i>
                        <span class="text-gray-700">자유로운 예약</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-star text-purple-600 mt-1"></i>
                        <span class="text-gray-700 font-semibold">해외 10년 거주 한국인 강사</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-gift text-purple-600 mt-1"></i>
                        <span class="text-gray-700"><strong>Core:</strong> 10% 할인 (₩297,000)</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-crown text-purple-600 mt-1"></i>
                        <span class="text-gray-700"><strong>Premium:</strong> 20% 할인 (₩264,000)</span>
                      </li>
                    </ul>
                    
                    <button onclick="worvox.purchaseLessons(20, 330000, 'monthly')" 
                      class="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all">
                      월정기 구독하기
                    </button>
                  </div>
                </div>
                
                <!-- Features -->
                <div class="grid md:grid-cols-3 gap-6 mb-6">
                  <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div class="flex items-start gap-4">
                      <div class="bg-emerald-100 p-3 rounded-lg">
                        <i class="fas fa-globe text-emerald-600 text-2xl"></i>
                      </div>
                      <div>
                        <h4 class="font-bold text-gray-800 mb-1">경험 많은 강사진</h4>
                        <p class="text-sm text-gray-600">해외 10년 거주 한국인 강사</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div class="flex items-start gap-4">
                      <div class="bg-emerald-100 p-3 rounded-lg">
                        <i class="fas fa-calendar-check text-emerald-600 text-2xl"></i>
                      </div>
                      <div>
                        <h4 class="font-bold text-gray-800 mb-1">유연한 스케줄</h4>
                        <p class="text-sm text-gray-600">원하는 시간에 자유롭게 예약</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div class="flex items-start gap-4">
                      <div class="bg-emerald-100 p-3 rounded-lg">
                        <i class="fas fa-phone text-emerald-600 text-2xl"></i>
                      </div>
                      <div>
                        <h4 class="font-bold text-gray-800 mb-1">1:1 프리미엄 전화영어</h4>
                        <p class="text-sm text-gray-600">개인 맞춤형 학습으로 빠른 성장</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Premium Member Benefits -->
                ${!this.isPremiumUser() ? `
                <div class="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6">
                  <div class="flex items-center gap-4">
                    <div class="bg-amber-100 p-4 rounded-full">
                      <i class="fas fa-crown text-amber-600 text-3xl"></i>
                    </div>
                    <div class="flex-1">
                      <h4 class="text-xl font-bold text-gray-900 mb-2">플랜 가입자 혜택</h4>
                      <p class="text-gray-700 mb-3">Core 또는 Premium 플랜 가입 시 추가 할인!</p>
                      <ul class="space-y-1 text-sm text-gray-600 mb-4">
                        <li><i class="fas fa-check text-amber-600 mr-2"></i>Core: 모든 수업권 <strong>10% 추가 할인</strong></li>
                        <li><i class="fas fa-check text-amber-600 mr-2"></i>Premium: 모든 수업권 <strong>20% 추가 할인</strong></li>
                        <li><i class="fas fa-check text-amber-600 mr-2"></i>우선 예약 가능</li>
                      </ul>
                      <button onclick="worvox.showPlan()" 
                        class="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-semibold transition-all">
                        플랜 보기
                      </button>
                    </div>
                  </div>
                </div>
                ` : ''}
              </div>
              
              <!-- Footer -->
              ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Load Live Speaking credits and sessions
    this.loadLiveSpeakingCredits();
    
    // Load gamification stats
    setTimeout(() => this.loadGamificationStats(), 100);
  }

  async loadLiveSpeakingCredits() {
    if (!this.currentUser) return;

    try {
      // Load user's credits
      const creditsResponse = await axios.get(`/api/hiing/credits/${this.currentUser.id}`);
      if (creditsResponse.data.success) {
        const remaining = creditsResponse.data.remaining_credits || 0;
        document.getElementById('remainingLessons').textContent = remaining;
        
        // Show/hide book lesson button based on remaining credits
        const bookButton = document.getElementById('bookLessonButton');
        if (bookButton) {
          bookButton.style.display = remaining > 0 ? 'block' : 'none';
        }
      }

      // Load user's completed sessions
      const sessionsResponse = await axios.get(`/api/hiing/sessions/${this.currentUser.id}`);
      if (sessionsResponse.data.success) {
        const completed = sessionsResponse.data.sessions.filter(s => s.status === 'completed').length;
        document.getElementById('completedLessons').textContent = completed;
      }
    } catch (error) {
      console.error('Load Live Speaking credits error:', error);
      document.getElementById('remainingLessons').textContent = '0';
      document.getElementById('completedLessons').textContent = '0';
    }
  }

  // Purchase lesson packages (일반결제)
  async purchaseLessons(lessonCount, amount, packageType = 'one-time') {
    if (!this.currentUser) {
      alert('Please login to purchase lesson credits.');
      return;
    }

    // Free trial - no payment needed, go directly to teacher selection
    if (packageType === 'free') {
      try {
        // Create free credit first
        const response = await axios.post('/api/hiing/purchase', {
          userId: this.currentUser.id,
          lessonCount: 1,
          amount: 0,
          packageType: 'free'
        });

        if (response.data.success) {
          alert(`🎁 Free trial registered!\n\nYou received ${lessonCount} lesson credit.\n\nPlease select a teacher and schedule your lesson! 🚀`);
          // Show teacher selection page
          this.showTeacherSelection();
        } else {
          // Handle error from response (duplicate free trial)
          const errorMsg = response.data.error || 'Failed to register free trial';
          if (errorMsg.includes('already used')) {
            alert('❌ 무료 체험은 1회만 가능합니다.\n\n이미 무료 체험을 사용하셨습니다.\n수업권을 구매해주세요! 💰');
          } else {
            alert('❌ ' + errorMsg);
          }
        }
      } catch (error) {
        console.error('Free trial error:', error);
        console.error('Error details:', {
          hasResponse: !!error.response,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        // Check if it's a duplicate free trial error (400 status)
        if (error.response && error.response.status === 400) {
          const errorMsg = error.response.data?.error || '';
          console.log('Error message from API:', errorMsg);
          if (errorMsg.includes('already used')) {
            alert('❌ 무료 체험은 1회만 가능합니다.\n\n이미 무료 체험을 사용하셨습니다.\n수업권을 구매해주세요! 💰');
          } else {
            alert('❌ ' + errorMsg);
          }
        } else {
          // Show generic error with details in console
          console.error('Non-400 error or missing response');
          alert('❌ Failed to register free trial. Please try again.\n\nCheck browser console for details.');
        }
      }
      return;
    }

    // Apply discount for Core/Premium users
    let finalAmount = amount;
    let discountPercent = 0;
    
    if (this.userPlan === 'core') {
      discountPercent = 10;
      finalAmount = Math.floor(amount * 0.90);
    } else if (this.userPlan === 'premium') {
      discountPercent = 20;
      finalAmount = Math.floor(amount * 0.80);
    }
    
    const packageName = `${lessonCount}회 수업권`;
    const pricePerLesson = Math.floor(finalAmount / lessonCount);
    
    // Show purchase confirmation
    const planName = this.userPlan === 'core' ? 'Core' : this.userPlan === 'premium' ? 'Premium' : '';
    const discountText = discountPercent > 0 
      ? `\n${planName} 회원 할인: -${discountPercent}% (₩${(amount - finalAmount).toLocaleString()} 할인)\n` 
      : '';
    
    const packageTypeText = packageType === 'monthly' ? '월정기 구독' : '일반결제';
    
    const confirmed = confirm(`
🎓 1:1 Live Speaking Session 수업권 구매
━━━━━━━━━━━━━━━━━━━━━━━━━━
패키지: ${packageName}
구매 방식: ${packageTypeText}
정가: ₩${amount.toLocaleString()}${discountText}최종 금액: ₩${finalAmount.toLocaleString()}
회당 가격: ₩${pricePerLesson.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━

결제를 진행하시겠습니까?
    `);
    
    if (!confirmed) return;
    
    try {
      // 1. Prepare order
      const prepareResponse = await axios.post('/api/payments/prepare', {
        planName: `Live Speaking ${lessonCount}회`,
        price: finalAmount,
        period: packageType,
        userId: this.currentUser.id
      });

      if (!prepareResponse.data.success) {
        throw new Error('결제 준비 실패');
      }

      const { orderId, orderName } = prepareResponse.data;

      // 2. Initialize Toss Payments
      const clientKey = 'test_ck_d26DlbXAaV0eR7QxP00rqY50Q9RB';
      const tossPayments = TossPayments(clientKey);
      
      // customerKey must include letters/special chars, not just numbers
      const customerKey = `customer_${this.currentUser.id}`;
      const payment = tossPayments.payment({ customerKey });

      // 3. Request payment
      await payment.requestPayment({
        method: 'CARD',
        amount: { 
          value: finalAmount,
          currency: 'KRW'
        },
        orderId: orderId,
        orderName: orderName,
        successUrl: window.location.origin + '/payment/success',
        failUrl: window.location.origin + '/payment/fail',
        customerEmail: this.currentUser.email,
        customerName: this.currentUser.username,
      });
      
    } catch (error) {
      console.error('Lesson purchase error:', error)
      alert('❌ 결제 시작 중 오류가 발생했습니다.\n' + (error.message || ''));
    }
  }

  // Teacher selection and booking
  async showTeacherSelection() {
    if (!this.currentUser) {
      alert('Please login first.');
      return;
    }

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <!-- Mobile Header -->
        <div class="md:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
          <div class="flex items-center justify-between">
            <button onclick="worvox.showRealConversation()" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <i class="fas fa-arrow-left text-gray-700"></i>
            </button>
            <h1 class="text-lg font-bold text-gray-800">Select Teacher</h1>
            <div class="w-10"></div>
          </div>
        </div>

        <!-- Desktop Header -->
        <div class="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
          <button onclick="worvox.showRealConversation()" 
            class="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <i class="fas fa-arrow-left"></i>
            <span>Back to Live Speaking</span>
          </button>
          <h1 class="text-2xl font-bold text-gray-800">Select Your Teacher</h1>
          <div class="w-32"></div>
        </div>

        <div class="max-w-7xl mx-auto px-4 py-8">
          <!-- Credits Card -->
          <div id="creditsCard" class="mb-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-emerald-100 text-sm mb-1">Available Lesson Credits</p>
                <p class="text-4xl font-bold">Loading...</p>
              </div>
              <div class="text-6xl opacity-20">
                <i class="fas fa-graduation-cap"></i>
              </div>
            </div>
          </div>

          <!-- Teachers Grid -->
          <h2 class="text-2xl font-bold text-gray-800 mb-6">Choose Your Teacher</h2>
          <div id="teachersGrid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="col-span-full text-center py-12">
              <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
              <p class="text-gray-600">Loading teachers...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load credits and teachers
    this.loadUserCredits();
    this.loadTeachers();
  }

  async loadUserCredits() {
    try {
      const response = await axios.get(`/api/hiing/credits/${this.currentUser.id}`);
      if (response.data.success) {
        const credits = response.data.remaining_credits;
        document.getElementById('creditsCard').innerHTML = `
          <div class="flex items-center justify-between">
            <div>
              <p class="text-emerald-100 text-sm mb-1">Available Lesson Credits</p>
              <p class="text-4xl font-bold">${credits} ${credits === 1 ? 'lesson' : 'lessons'}</p>
              ${credits === 0 ? '<p class="text-emerald-100 text-sm mt-2">Please purchase credits to book a lesson</p>' : ''}
            </div>
            <div class="text-6xl opacity-20">
              <i class="fas fa-graduation-cap"></i>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Load credits error:', error);
    }
  }

  async loadTeachers() {
    try {
      const response = await axios.get('/api/hiing/teachers');
      if (response.data.success && response.data.teachers) {
        const teachers = response.data.teachers;
        const grid = document.getElementById('teachersGrid');
        
        if (teachers.length === 0) {
          grid.innerHTML = `
            <div class="col-span-full text-center py-12">
              <i class="fas fa-user-slash text-4xl text-gray-400 mb-4"></i>
              <p class="text-gray-600">No teachers available at the moment</p>
            </div>
          `;
          return;
        }

        grid.innerHTML = teachers.map(teacher => `
          <div class="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden border border-gray-100">
            <!-- Smaller circular photo (96px) -->
            <div class="flex justify-center pt-6 pb-2">
              <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 shadow-lg">
                <img src="${teacher.photo_url}" alt="${teacher.name}" 
                  class="w-full h-full object-cover"
                  onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><circle fill=%22%2393c5fd%22 cx=%22100%22 cy=%22100%22 r=%22100%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2280%22 font-family=%22Arial%22>${teacher.name.charAt(0)}</text></svg>';">
              </div>
            </div>
            
            <!-- Nationality flags -->
            <div class="flex justify-center gap-2 mb-2">
              <span class="text-2xl">${teacher.nationality || '🇰🇷🇺🇸'}</span>
            </div>
            
            <!-- Name badge (yellow background like screenshot) -->
            <div class="mx-4 mb-3">
              <div class="bg-yellow-300 rounded-full py-2 px-4 text-center">
                <h3 class="text-lg font-bold text-gray-900">${teacher.name}</h3>
              </div>
            </div>
            
            <div class="px-6 pb-6">
              <!-- Title/Subtitle -->
              <div class="text-center mb-3">
                <p class="text-sm text-gray-700 font-semibold" style="white-space: pre-line;">${(teacher.title || teacher.specialty.substring(0, 50)).replace(/\\\\n/g, '\n')}</p>
              </div>
              
              <!-- Main specialty/experience (scrollable if long) -->
              <div class="mb-4 max-h-24 overflow-y-auto">
                <p class="text-xs text-gray-600 leading-relaxed" style="white-space: pre-line;">${teacher.specialty.replace(/\\\\n/g, '\n')}</p>
              </div>
              
              <!-- Bio/Message box (black background like screenshot) -->
              ${teacher.bio ? `
                <div class="bg-black rounded-lg p-3 mb-4">
                  <p class="text-xs text-yellow-300 leading-relaxed" style="white-space: pre-line;">${teacher.bio.replace(/\\\\n/g, '\n')}</p>
                </div>
              ` : ''}
              
              <!-- Rating -->
              <div class="flex items-center justify-center gap-1 text-yellow-500 mb-4">
                ${Array(Math.floor(teacher.rating)).fill('<i class="fas fa-star"></i>').join('')}
                ${teacher.rating % 1 !== 0 ? '<i class="fas fa-star-half-alt"></i>' : ''}
                <span class="text-gray-600 text-sm ml-1">${teacher.rating}</span>
              </div>
              
              <button onclick="worvox.selectTeacher(${teacher.id}, '${teacher.name}')" 
                class="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md">
                Select Teacher
              </button>
            </div>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Load teachers error:', error);
      document.getElementById('teachersGrid').innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <p class="text-gray-600">Failed to load teachers</p>
        </div>
      `;
    }
  }

  async selectTeacher(teacherId, teacherName) {
    if (!this.currentUser) {
      alert('Please login first.');
      return;
    }

    // Check if user has credits
    const creditsResponse = await axios.get(`/api/hiing/credits/${this.currentUser.id}`);
    if (!creditsResponse.data.success || creditsResponse.data.remaining_credits <= 0) {
      alert('You need to purchase lesson credits first!');
      this.showLiveSpeaking();
      return;
    }

    // Show booking form
    this.showBookingForm(teacherId, teacherName);
  }

  async showBookingForm(teacherId, teacherName) {
    const app = document.getElementById('app');
    
    // Generate next 7 days for date selector
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }

    // Generate time slots (09:00 - 21:00)
    const times = [];
    for (let hour = 9; hour <= 21; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 21) {
        times.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }

    app.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <!-- Mobile Header -->
        <div class="md:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
          <div class="flex items-center justify-between">
            <button onclick="worvox.showTeacherSelection()" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <i class="fas fa-arrow-left text-gray-700"></i>
            </button>
            <h1 class="text-lg font-bold text-gray-800">Book Lesson</h1>
            <div class="w-10"></div>
          </div>
        </div>

        <!-- Desktop Header -->
        <div class="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
          <button onclick="worvox.showTeacherSelection()" 
            class="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <i class="fas fa-arrow-left"></i>
            <span>Back to Teachers</span>
          </button>
          <h1 class="text-2xl font-bold text-gray-800">Book Your Lesson</h1>
          <div class="w-32"></div>
        </div>

        <div class="max-w-3xl mx-auto px-4 py-8">
          <!-- Teacher Info Card -->
          <div class="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <i class="fas fa-user text-2xl text-blue-600"></i>
              </div>
              <div>
                <h2 class="text-2xl font-bold text-gray-800">${teacherName}</h2>
                <p class="text-gray-600">Your selected teacher</p>
              </div>
            </div>
          </div>

          <!-- Booking Form -->
          <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
            <h3 class="text-xl font-bold text-gray-800 mb-6">Schedule Your Lesson</h3>
            
            <div class="space-y-6">
              <!-- Date Selection -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  <i class="fas fa-calendar text-blue-600 mr-2"></i>Select Date
                </label>
                <select id="lessonDate" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Choose a date...</option>
                  ${dates.map(d => `<option value="${d.value}">${d.label}</option>`).join('')}
                </select>
              </div>

              <!-- Time Selection -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  <i class="fas fa-clock text-purple-600 mr-2"></i>Select Time
                </label>
                <select id="lessonTime" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="">Choose a time...</option>
                  ${times.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
              </div>

              <!-- Phone Number Input -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  <i class="fas fa-phone text-green-600 mr-2"></i>전화번호 (강사가 연락할 번호)
                </label>
                <input type="tel" id="studentPhone" placeholder="010-1234-5678" 
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value="${this.currentUser?.phone || ''}">
                <p class="text-xs text-gray-500 mt-1">강사님이 수업 시간에 이 번호로 전화드립니다</p>
              </div>

              <!-- Duration Selection -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  <i class="fas fa-hourglass-half text-emerald-600 mr-2"></i>Lesson Duration
                </label>
                <div class="grid grid-cols-2 gap-4">
                  <button onclick="worvox.selectDurationOption(25)" id="duration-25" 
                    class="py-3 border-2 border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all">
                    <div class="font-semibold text-gray-800">25 Minutes</div>
                    <div class="text-sm text-gray-600">Standard</div>
                  </button>
                  <button onclick="worvox.selectDurationOption(50)" id="duration-50" 
                    class="py-3 border-2 border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all">
                    <div class="font-semibold text-gray-800">50 Minutes</div>
                    <div class="text-sm text-gray-600">Extended</div>
                  </button>
                </div>
              </div>

              <!-- Confirm Button -->
              <button onclick="worvox.confirmSchedule(${teacherId}, '${teacherName}')" 
                class="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                <i class="fas fa-check-circle mr-2"></i>Confirm Booking
              </button>

              <p class="text-sm text-gray-600 text-center">
                <i class="fas fa-info-circle text-blue-500 mr-1"></i>
                Your teacher will call you at the scheduled time
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Store selected teacher info
    this.selectedTeacher = { id: teacherId, name: teacherName };
    this.selectedDuration = 25; // default
  }

  selectDurationOption(minutes) {
    // Remove previous selection
    document.querySelectorAll('[id^="duration-"]').forEach(btn => {
      btn.classList.remove('border-emerald-500', 'bg-emerald-50');
      btn.classList.add('border-gray-300');
    });
    
    // Add new selection
    const btn = document.getElementById(`duration-${minutes}`);
    btn.classList.remove('border-gray-300');
    btn.classList.add('border-emerald-500', 'bg-emerald-50');
    
    this.selectedDuration = minutes;
  }

  async confirmSchedule(teacherId, teacherName) {
    const date = document.getElementById('lessonDate').value;
    const time = document.getElementById('lessonTime').value;
    const studentPhone = document.getElementById('studentPhone').value;
    const duration = this.selectedDuration || 25;

    if (!date || !time) {
      alert('날짜와 시간을 선택해주세요');
      return;
    }

    if (!studentPhone || studentPhone.trim() === '') {
      alert('전화번호를 입력해주세요');
      return;
    }

    // Combine date and time into ISO string
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

    const confirmed = confirm(`
📚 Confirm Your Lesson Booking
━━━━━━━━━━━━━━━━━━━━━━━━━━
Teacher: ${teacherName}
Date: ${new Date(scheduledAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Time: ${time}
Duration: ${duration} minutes
━━━━━━━━━━━━━━━━━━━━━━━━━━

Your teacher will call you at the scheduled time.
Proceed with booking?
    `);

    if (!confirmed) return;

    try {
      const response = await axios.post('/api/hiing/schedule', {
        userId: this.currentUser.id,
        teacherId: teacherId,
        teacherName: teacherName,
        scheduledAt: scheduledAt,
        duration: duration,
        studentPhone: studentPhone
      });

      if (response.data.success) {
        alert(`✅ 예약 완료!

강사: ${teacherName}
날짜: ${new Date(scheduledAt).toLocaleDateString('ko-KR')}
시간: ${time}
학생 전화번호: ${studentPhone}
수업 시간: ${duration}분

강사님이 예약 시간에 ${studentPhone}로 전화드립니다.
전화를 받을 수 있도록 준비해주세요!`);
        
        // Go back to Live Speaking page
        this.showRealConversation();
      } else {
        throw new Error(response.data.error || 'Booking failed');
      }
    } catch (error) {
      console.error('Schedule error:', error);
      alert('❌ Failed to book lesson. Please try again.\n' + (error.response?.data?.error || error.message));
    }
  }

  // Legacy functions (will be removed after migration)
  selectSessions(num) {
    // Deprecated - kept for backward compatibility
    console.warn('selectSessions is deprecated');
  }

  selectDuration(minutes) {
    // Deprecated - kept for backward compatibility
    console.warn('selectDuration is deprecated');
  }

  calculateBookingPrice() {
    // Deprecated - kept for backward compatibility
    console.warn('calculateBookingPrice is deprecated');
  }

  async proceedToCheckout() {
    // Deprecated - kept for backward compatibility
    console.warn('proceedToCheckout is deprecated');
    const data = this.bookingData;
    
    if (!data || !data.sessionsPerWeek || !data.sessionDuration) {
      alert('Please select both sessions per week and session duration.');
      return;
    }
    
    // Show confirmation
    const confirmed = confirm(`
Booking Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━
Sessions: ${data.sessionsPerWeek} per week
Duration: ${data.sessionDuration} minutes
Weekly Price: ₩${data.weeklyPrice.toLocaleString()}
Monthly Price: ₩${data.monthlyPrice.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━

Proceed to payment?
    `);
    
    if (confirmed) {
      // TODO: Implement actual payment integration
      alert('Payment feature coming soon! Your booking details have been saved.');
      
      // For now, just log the booking
      console.log('Booking Data:', data);
      
      // Could send to backend to save booking
      // await axios.post('/api/bookings', {
      //   userId: this.currentUser.id,
      //   ...data
      // });
    }
  }

  // Logout and clear all authentication data
  logout() {
    // Clear all user data
    this.currentUser = null;
    this.currentSession = null;
    this.currentTopic = null;
    this.messages = [];
    this.userPlan = 'free';
    
    // Clear localStorage
    localStorage.removeItem('worvox_user');
    localStorage.removeItem('worvox_usage');
    localStorage.removeItem('worvox_gamification');
    localStorage.removeItem('worvox_sessions');
    localStorage.removeItem('worvox_topics');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Reset Google Sign-In if available
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.disableAutoSelect();
    }
    
    // Show login screen
    this.showLogin();
    
    console.log('✅ All login data cleared');
  }

  showLogin() {
    this.onboardingStep = 1;
    this.showOnboardingStep();
  }

  showOnboardingStep() {
    const app = document.getElementById('app');
    
    const steps = [
      this.getStep1HTML(),
      this.getStep2HTML(),
      this.getStep3HTML()
    ];

    const progress = Math.round((this.onboardingStep / 3) * 100);

    app.innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col lg:flex-row overflow-hidden">
          <!-- Mobile: Introduction at Top -->
          <div class="lg:hidden w-full bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white">
            <div class="space-y-4">
              <div class="text-center">
                <h2 class="text-xl font-bold mb-2 leading-snug">Speak Confidently, Master English Fluently</h2>
                <p class="text-indigo-100 text-sm mb-3">Created by global educators for maximum speaking practice</p>
                <div class="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <p class="text-white font-semibold text-sm mb-1">One Platform. Complete Mastery.</p>
                  <p class="text-indigo-100 text-xs">Everything you need to speak English fluently</p>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <div class="flex items-center gap-2">
                  <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg">
                    💬
                  </div>
                  <div>
                    <h3 class="font-semibold text-xs">AI Conversations</h3>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg">
                    🎬
                  </div>
                  <div>
                    <h3 class="font-semibold text-xs">30+ Scenarios</h3>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg">
                    ⚡
                  </div>
                  <div>
                    <h3 class="font-semibold text-xs">Instant Feedback</h3>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg">
                    📈
                  </div>
                  <div>
                    <h3 class="font-semibold text-xs">Progress Tracking</h3>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg">
                    🎯
                  </div>
                  <div>
                    <h3 class="font-semibold text-xs">Built for Fluency</h3>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg">
                    🌏
                  </div>
                  <div>
                    <h3 class="font-semibold text-xs">Global Team</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Login Form -->
          <div class="w-full lg:w-1/2 p-6 lg:p-8 bg-gradient-to-br from-indigo-600 to-purple-700">
            <!-- Header -->
            <div class="text-center mb-4 lg:mb-6">
              <h1 class="text-2xl lg:text-3xl font-bold text-white mb-2">WorVox</h1>
              <p class="text-indigo-100 text-sm">Step ${this.onboardingStep} of 3</p>
            </div>

            <!-- Progress Bar -->
            <div class="w-full bg-white/20 rounded-full h-2 mb-6 lg:mb-8">
              <div class="bg-white h-2 rounded-full transition-all duration-300" 
                   style="width: ${progress}%"></div>
            </div>

            <!-- Current Step Content -->
            ${steps[this.onboardingStep - 1]}
          </div>
          
          <!-- Desktop: Introduction on Right -->
          <div class="hidden lg:flex w-full lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-12 flex-col justify-center text-white">
            <div class="space-y-8">
              <div>
                <h2 class="text-4xl font-bold mb-4 leading-snug">Speak Confidently,<br/>Master English Fluently</h2>
                <p class="text-indigo-100 text-lg leading-relaxed mb-4">Created by global educators who understand the power of conversation</p>
                <p class="text-indigo-200 text-base leading-relaxed">WorVox isn't just another learning app—it's your complete English speaking solution. Master vocabulary and grammar while building real confidence through diverse scenarios and AI-powered feedback.</p>
                <div class="mt-6 pt-6 border-t border-white/20">
                  <p class="text-white font-semibold text-xl">One Platform. Complete Mastery.</p>
                  <p class="text-indigo-100 text-sm mt-2">Everything you need to speak English fluently, all in one place.</p>
                </div>
              </div>
              
              <div class="space-y-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                    💬
                  </div>
                  <div>
                    <h3 class="font-semibold text-lg mb-1">Speak More, Fear Less</h3>
                    <p class="text-indigo-100 text-sm">Practice real conversations with AI—no judgment, just progress</p>
                  </div>
                </div>
                
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                    🎬
                  </div>
                  <div>
                    <h3 class="font-semibold text-lg mb-1">30+ Real-Life Scenarios</h3>
                    <p class="text-indigo-100 text-sm">Airport, restaurant, business—practice every situation you'll face</p>
                  </div>
                </div>
                
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                    ⚡
                  </div>
                  <div>
                    <h3 class="font-semibold text-lg mb-1">Instant AI Feedback</h3>
                    <p class="text-indigo-100 text-sm">Get pronunciation and fluency scores in seconds, not days</p>
                  </div>
                </div>
                
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                    📈
                  </div>
                  <div>
                    <h3 class="font-semibold text-lg mb-1">Track Your Growth</h3>
                    <p class="text-indigo-100 text-sm">Watch your confidence soar with detailed progress analytics</p>
                  </div>
                </div>
                
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                    🎯
                  </div>
                  <div>
                    <h3 class="font-semibold text-lg mb-1">Built for Fluency</h3>
                    <p class="text-indigo-100 text-sm">Vocabulary and grammar matter, but speaking builds confidence</p>
                  </div>
                </div>
              </div>
              
              <div class="pt-6 border-t border-white/20">
                <div class="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <p class="text-white font-semibold mb-3">🌏 Created by Global Educators</p>
                  <p class="text-indigo-100 text-sm leading-relaxed">
                    Designed by international team members who know exactly what it takes to speak English confidently. We built WorVox to maximize speaking practice—because fluency comes from conversation, not textbooks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachOnboardingListeners();
  }

  getStep1HTML() {
    return `
      <div class="space-y-6">
        <div class="text-center">
          <div class="text-5xl mb-4">👋</div>
          <h2 class="text-2xl font-bold text-white mb-2">Welcome to WorVox!</h2>
          <p class="text-indigo-100">로그인하거나 회원가입하여 시작하세요</p>
        </div>
        
        <!-- Google Sign-In Button -->
        <div id="googleSignInButton" class="flex justify-center"></div>
        
        <!-- Divider -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-white/30"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-indigo-600 text-indigo-100">또는</span>
          </div>
        </div>
        
        <!-- Email/Password Login Form -->
        <div id="loginForm">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-white mb-2">이메일</label>
              <input type="email" id="loginEmail" 
                class="w-full px-4 py-3 border border-white/30 bg-white/10 text-white placeholder-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="example@email.com">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-white mb-2">비밀번호</label>
              <input type="password" id="loginPassword" 
                class="w-full px-4 py-3 border border-white/30 bg-white/10 text-white placeholder-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="••••••••">
            </div>
            
            <button onclick="worvox.handleEmailLogin()" 
              class="w-full py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-all">
              로그인
            </button>
            
            <div class="text-center">
              <button onclick="worvox.showSignupForm()" class="text-white hover:text-indigo-100 text-sm font-medium">
                계정이 없으신가요? <span class="underline">회원가입</span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Signup Form (Hidden by default) -->
        <div id="signupForm" class="hidden">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-white mb-2">이름</label>
              <input type="text" id="signupName" 
                class="w-full px-4 py-3 border border-white/30 bg-white/10 text-white placeholder-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="홍길동">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-white mb-2">이메일</label>
              <input type="email" id="signupEmail" 
                class="w-full px-4 py-3 border border-white/30 bg-white/10 text-white placeholder-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="example@email.com">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-white mb-2">비밀번호</label>
              <input type="password" id="signupPassword" 
                class="w-full px-4 py-3 border border-white/30 bg-white/10 text-white placeholder-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="8자 이상">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-white mb-2">비밀번호 확인</label>
              <input type="password" id="signupPasswordConfirm" 
                class="w-full px-4 py-3 border border-white/30 bg-white/10 text-white placeholder-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="비밀번호 재입력">
            </div>
            
            <button onclick="worvox.handleEmailSignup()" 
              class="w-full py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-all">
              회원가입
            </button>
            
            <div class="text-center">
              <button onclick="worvox.showLoginForm()" class="text-white hover:text-indigo-100 text-sm font-medium">
                이미 계정이 있으신가요? <span class="underline">로그인</span>
              </button>
            </div>
          </div>
        </div>
        
        <div class="mt-6 text-center text-xs text-indigo-100">
          <p>가입하면 <a href="#" onclick="worvox.showTerms(); return false;" class="text-white hover:underline font-medium">이용약관</a> 및 <a href="#" onclick="worvox.showPrivacy(); return false;" class="text-white hover:underline font-medium">개인정보처리방침</a>에 동의하는 것으로 간주됩니다</p>
        </div>
      </div>
    `;
  }

  // Toggle between login and signup forms
  showSignupForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
  }

  showLoginForm() {
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
  }

  // Handle email login
  async handleEmailLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      alert('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post('/api/users/login', {
        email,
        password
      });

      console.log('Login successful:', response.data);

      // Store user data
      localStorage.setItem('worvox_user', JSON.stringify(response.data.user));
      this.currentUser = response.data.user;
      
      // Update user plan from database
      this.userPlan = response.data.user.plan || 'free';
      console.log('User plan updated to:', this.userPlan);

      // Load usage data and gamification stats
      await this.loadUsageFromServer();
      await this.loadGamificationStats();
      
      // Go to dashboard
      this.showTopicSelection();

    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.status === 401) {
        alert('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        alert('로그인에 실패했습니다. 다시 시도해주세요.');
      }
    }
  }

  // Handle email signup
  async handleEmailSignup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;

    // Validation
    if (!name || !email || !password || !passwordConfirm) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    if (password.length < 8) {
      alert('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    if (password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('올바른 이메일 형식이 아닙니다.');
      return;
    }

    try {
      const response = await axios.post('/api/users/signup', {
        name,
        email,
        password
      });

      console.log('Signup successful:', response.data);

      // Store user data
      localStorage.setItem('worvox_user', JSON.stringify(response.data.user));
      this.currentUser = response.data.user;
      
      // Update user plan from database
      this.userPlan = response.data.user.plan || 'free';
      console.log('User plan updated to:', this.userPlan);

      // If new user, show onboarding steps
      if (response.data.isNew) {
        console.log('🆕 New user - showing onboarding');
        alert(`환영합니다, ${name}님! 이제 영어 레벨을 선택해주세요.`);
        this.onboardingStep = 2; // Start from step 2 (level selection)
        this.showOnboardingStep();
      } else {
        console.log('👤 Existing user - loading data...');
        // Load user data and show home
        await this.loadUsageFromServer();
        await this.loadGamificationStats();
        this.showTopicSelection();
      }

    } catch (error) {
      console.error('Signup error:', error);
      if (error.response?.status === 409) {
        alert('이미 등록된 이메일입니다. 로그인해주세요.');
      } else {
        alert('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    }
  }

  getStep2HTML() {
    const levels = [
      { value: 'beginner', icon: '🌱', label: 'Beginner', desc: 'Just starting out' },
      { value: 'intermediate', icon: '🌿', label: 'Intermediate', desc: 'Some experience' },
      { value: 'advanced', icon: '🌳', label: 'Advanced', desc: 'Confident speaker' }
    ];

    return `
      <div class="space-y-6">
        <div class="text-center">
          <div class="text-5xl mb-4">📚</div>
          <h2 class="text-2xl font-bold text-white mb-2">English Level</h2>
          <p class="text-indigo-100">What's your current level?</p>
        </div>
        
        <div class="space-y-3">
          ${levels.map(level => `
            <button onclick="worvox.selectOption('level', '${level.value}')" 
              class="w-full p-4 border-2 rounded-xl transition-all text-left ${this.onboardingData.level === level.value ? 'border-white bg-white/20' : 'border-white/30 hover:border-white hover:bg-white/10'}">
              <div class="flex items-center">
                <span class="text-3xl mr-4">${level.icon}</span>
                <div class="flex-1">
                  <div class="font-semibold text-white">${level.label}</div>
                  <div class="text-sm text-indigo-100">${level.desc}</div>
                </div>
                ${this.onboardingData.level === level.value ? '<span class="text-white">✓</span>' : ''}
              </div>
            </button>
          `).join('')}
        </div>

        <button onclick="worvox.prevStep()" 
          class="w-full border-2 border-white/30 text-white py-3 rounded-lg font-semibold hover:bg-white/10 transition-all">
          Back
        </button>
      </div>
    `;
  }

  getStep3HTML() {
    const occupations = [
      { value: 'entrepreneur', icon: '🚀', label: 'Entrepreneur', desc: 'Business owner' },
      { value: 'employee', icon: '💼', label: 'Employee', desc: 'Office worker' },
      { value: 'freelancer', icon: '💻', label: 'Freelancer', desc: 'Independent contractor' },
      { value: 'student', icon: '📚', label: 'Student', desc: 'Currently studying' }
    ];

    return `
      <div class="space-y-6">
        <div class="text-center">
          <div class="text-5xl mb-4">💼</div>
          <h2 class="text-2xl font-bold text-white mb-2">Occupation</h2>
          <p class="text-indigo-100">What do you do?</p>
        </div>
        
        <div class="space-y-3 max-h-96 overflow-y-auto">
          ${occupations.map(occ => `
            <button onclick="worvox.selectOption('occupation', '${occ.value}')" 
              class="w-full p-4 border-2 rounded-xl transition-all text-left ${this.onboardingData.occupation === occ.value ? 'border-white bg-white/20' : 'border-white/30 hover:border-white hover:bg-white/10'}">
              <div class="flex items-center">
                <span class="text-3xl mr-4">${occ.icon}</span>
                <div class="flex-1">
                  <div class="font-semibold text-white">${occ.label}</div>
                  <div class="text-sm text-indigo-100">${occ.desc}</div>
                </div>
                ${this.onboardingData.occupation === occ.value ? '<span class="text-white">✓</span>' : ''}
              </div>
            </button>
          `).join('')}
        </div>

        <button onclick="worvox.prevStep()" 
          class="w-full border-2 border-white/30 text-white py-3 rounded-lg font-semibold hover:bg-white/10 transition-all">
          Back
        </button>
      </div>
    `;
  }

  getStep4HTML() {
    const ageGroups = [
      { value: '10s', icon: '🎮', label: '10대', desc: 'Teenager' },
      { value: '20s', icon: '🎓', label: '20대', desc: 'Twenty-something' },
      { value: '30s', icon: '💼', label: '30대', desc: 'Thirty-something' },
      { value: '40s', icon: '👔', label: '40대', desc: 'Forty-something' },
      { value: '50+', icon: '🌟', label: '50대+', desc: 'Fifty and beyond' }
    ];

    return `
      <div class="space-y-6">
        <div class="text-center">
          <div class="text-5xl mb-4">🎂</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Age Group</h2>
          <p class="text-gray-600">What's your age range?</p>
        </div>
        
        <div class="space-y-3">
          ${ageGroups.map(age => `
            <button onclick="worvox.selectOption('ageGroup', '${age.value}')" 
              class="w-full p-4 border-2 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left ${this.onboardingData.ageGroup === age.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}">
              <div class="flex items-center">
                <span class="text-3xl mr-4">${age.icon}</span>
                <div class="flex-1">
                  <div class="font-semibold text-gray-800">${age.label}</div>
                  <div class="text-sm text-gray-600">${age.desc}</div>
                </div>
                ${this.onboardingData.ageGroup === age.value ? '<span class="text-indigo-600">✓</span>' : ''}
              </div>
            </button>
          `).join('')}
        </div>

        <button onclick="worvox.prevStep()" 
          class="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all">
          Back
        </button>
      </div>
    `;
  }

  getStep5HTML() {
    const genders = [
      { value: 'male', icon: '👨', label: 'Male', desc: '남성' },
      { value: 'female', icon: '👩', label: 'Female', desc: '여성' },
      { value: 'other', icon: '🧑', label: 'Other/Prefer not to say', desc: '기타/선택 안함' }
    ];

    return `
      <div class="space-y-6">
        <div class="text-center">
          <div class="text-5xl mb-4">🙋</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Gender</h2>
          <p class="text-gray-600">How do you identify?</p>
        </div>
        
        <div class="space-y-3">
          ${genders.map(gender => `
            <button onclick="worvox.selectOption('gender', '${gender.value}')" 
              class="w-full p-4 border-2 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left ${this.onboardingData.gender === gender.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}">
              <div class="flex items-center">
                <span class="text-3xl mr-4">${gender.icon}</span>
                <div class="flex-1">
                  <div class="font-semibold text-gray-800">${gender.label}</div>
                  <div class="text-sm text-gray-600">${gender.desc}</div>
                </div>
                ${this.onboardingData.gender === gender.value ? '<span class="text-indigo-600">✓</span>' : ''}
              </div>
            </button>
          `).join('')}
        </div>

        <button onclick="worvox.prevStep()" 
          class="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all">
          Back
        </button>
      </div>
    `;
  }

  getStep4HTML() {
    const occupations = [
      { value: 'entrepreneur', icon: '🚀', label: 'Entrepreneur', desc: 'Business owner' },
      { value: 'employee', icon: '💼', label: 'Employee', desc: 'Office worker' },
      { value: 'freelancer', icon: '💻', label: 'Freelancer', desc: 'Independent contractor' },
      { value: 'student', icon: '📚', label: 'Student', desc: 'Currently studying' }
    ];

    return `
      <div class="space-y-6">
        <div class="text-center">
          <div class="text-5xl mb-4">💼</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Occupation</h2>
          <p class="text-gray-600">What do you do?</p>
        </div>
        
        <div class="space-y-3">
          ${occupations.map(occ => `
            <button onclick="worvox.selectOption('occupation', '${occ.value}')" 
              class="w-full p-4 border-2 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left ${this.onboardingData.occupation === occ.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}">
              <div class="flex items-center">
                <span class="text-3xl mr-4">${occ.icon}</span>
                <div class="flex-1">
                  <div class="font-semibold text-gray-800">${occ.label}</div>
                  <div class="text-sm text-gray-600">${occ.desc}</div>
                </div>
                ${this.onboardingData.occupation === occ.value ? '<span class="text-indigo-600">✓</span>' : ''}
              </div>
            </button>
          `).join('')}
        </div>

        <button onclick="worvox.prevStep()" 
          class="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all">
          Back
        </button>
      </div>
    `;
  }

  attachOnboardingListeners() {
    if (this.onboardingStep === 1) {
      const input = document.getElementById('username');
      if (input) {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.nextStep();
          }
        });
      }
      
      // Render Google Sign-In button
      setTimeout(() => {
        const googleButtonDiv = document.getElementById('googleSignInButton');
        if (googleButtonDiv && typeof google !== 'undefined' && google.accounts) {
          // Calculate responsive width
          const containerWidth = googleButtonDiv.offsetWidth;
          const buttonWidth = Math.min(400, containerWidth - 40); // 40px for padding
          
          google.accounts.id.renderButton(
            googleButtonDiv,
            { 
              theme: 'outline', 
              size: 'large',
              width: buttonWidth,
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left'
            }
          );
        }
      }, 100);
    }
  }

  async nextStep() {
    // Validate current step
    if (this.onboardingStep === 1) {
      const username = document.getElementById('username').value.trim();
      if (!username) {
        alert('Please enter your name');
        return;
      }
      
      // Check for duplicate username
      try {
        const checkResponse = await axios.post('/api/users/check-username', { username });
        
        if (checkResponse.data.exists) {
          alert('❌ Username already exists!\n\nThis name is already taken. Please choose a different name.');
          return;
        }
        
        this.onboardingData.username = username;
      } catch (error) {
        console.error('Username check error:', error);
        if (error.response && error.response.status === 409) {
          alert('❌ Username already exists!\n\nThis name is already taken. Please choose a different name.');
          return;
        }
        // If check fails for other reasons, proceed anyway
        this.onboardingData.username = username;
      }
    }

    this.onboardingStep++;
    this.showOnboardingStep();
  }

  prevStep() {
    if (this.onboardingStep > 1) {
      this.onboardingStep--;
      this.showOnboardingStep();
    }
  }

  selectOption(field, value) {
    this.onboardingData[field] = value;
    
    // Auto-advance to next step after selection
    setTimeout(() => {
      if (this.onboardingStep < 3) {
        this.nextStep();
      } else {
        // Last step - show headphone recommendation
        this.showHeadphoneRecommendation();
      }
    }, 300);
  }

  showHeadphoneRecommendation() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg text-center">
          <!-- Headphone Icon -->
          <div class="mb-6">
            <div class="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
              <i class="fas fa-headphones text-5xl text-indigo-600"></i>
            </div>
          </div>
          
          <!-- Title -->
          <h2 class="text-2xl font-bold text-gray-800 mb-4">🎧 Headphones Recommended</h2>
          
          <!-- Message -->
          <p class="text-gray-600 mb-2">
            For the best learning experience, we recommend using headphones or earphones.
          </p>
          <p class="text-gray-500 text-sm mb-8">
            This will help you hear pronunciations clearly and practice speaking without disturbing others.
          </p>
          
          <!-- Benefits -->
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-8 text-left">
            <div class="flex items-start gap-3 mb-3">
              <i class="fas fa-check-circle text-green-500 text-lg mt-0.5"></i>
              <div>
                <div class="font-semibold text-gray-800">Better Audio Quality</div>
                <div class="text-sm text-gray-600">Hear pronunciations more clearly</div>
              </div>
            </div>
            <div class="flex items-start gap-3 mb-3">
              <i class="fas fa-check-circle text-green-500 text-lg mt-0.5"></i>
              <div>
                <div class="font-semibold text-gray-800">Focused Learning</div>
                <div class="text-sm text-gray-600">Minimize distractions around you</div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <i class="fas fa-check-circle text-green-500 text-lg mt-0.5"></i>
              <div>
                <div class="font-semibold text-gray-800">Privacy</div>
                <div class="text-sm text-gray-600">Practice speaking freely</div>
              </div>
            </div>
          </div>
          
          <!-- Continue Button -->
          <button onclick="worvox.completeOnboarding()" 
            class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg">
            Got it! Let's Start Learning
          </button>
        </div>
      </div>
    `;
  }

  async completeOnboarding() {
    try {
      // Update user level after onboarding
      const response = await axios.patch(`/api/users/${this.currentUser.id}/level`, {
        level: this.onboardingData.level
      });

      if (response.data.success) {
        // Update current user data
        this.currentUser.level = this.onboardingData.level;
        localStorage.setItem('worvox_user', JSON.stringify(this.currentUser));
        
        // Load gamification stats and show home
        await this.loadUsageFromServer();
        await this.loadGamificationStats();
        this.showTopicSelection();
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Failed to complete registration. Please try again.');
    }
  }

  // Navigate to AI Conversation (Start directly)
  showAIConversation() {
    this.startConversation();
  }

  async showTopicSelection() {
    try {
      // Ensure user is logged in (load from localStorage if needed)
      if (!this.currentUser) {
        const storedUser = localStorage.getItem('worvox_user');
        if (storedUser) {
          try {
            this.currentUser = JSON.parse(storedUser);
            this.userPlan = this.currentUser.plan || 'free';
          } catch (e) {
            console.error('Failed to parse stored user:', e);
            this.showLogin();
            return;
          }
        } else {
          // No user found, redirect to login
          this.showLogin();
          return;
        }
      }
      
      // Fetch topics
      const topicsResponse = await axios.get('/api/topics');
      this.topics = topicsResponse.data.topics; // Store for later use

      // Fetch user statistics
      const statsResponse = await axios.get(`/api/users/${this.currentUser.id}/stats`);
      const stats = statsResponse.data.stats;

      // Calculate total words spoken (approximate)
      const totalWords = Math.floor(stats.totalMessages / 2) * 10;

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen bg-gray-50 dark:bg-gray-900 dark:bg-gray-900">
          <!-- Sidebar -->
          ${this.getSidebar('home')}
          
          <!-- Main Content -->
          <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Mobile Header with Dark Mode & Upgrade -->
            <div class="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
              <div class="flex items-center justify-between">
                <button onclick="worvox.toggleMobileSidebar()" class="text-gray-600 dark:text-gray-300">
                  <i class="fas fa-bars text-xl"></i>
                </button>
                <h1 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Home</h1>
                <div class="flex items-center gap-2">
                  <!-- Dark Mode Toggle (Mobile) -->
                  <button onclick="worvox.toggleDarkMode()" 
                    class="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all" 
                    title="다크모드 전환">
                    <i class="fas fa-moon text-gray-600 dark:text-gray-300" id="darkModeIconMobile"></i>
                  </button>
                  <button onclick="worvox.showPlan()" class="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all">
                    <i class="fas fa-crown"></i>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Desktop Top Bar -->
            <div class="hidden md:flex bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Choose Your Learning Path</h2>
              <div class="flex items-center gap-3">
                <!-- Dark Mode Toggle -->
                <button onclick="worvox.toggleDarkMode()" 
                  class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all" 
                  title="다크모드 전환">
                  <i class="fas fa-moon text-gray-600 dark:text-gray-300" id="darkModeIcon"></i>
                </button>
                
                <button onclick="worvox.showPlan()" class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-all">
                  <i class="fas fa-crown mr-2"></i>Upgrade
                </button>
              </div>
            </div>
            
            <!-- Content Area with Scrolling -->
            <div class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
              <div class="p-4 md:p-8">
                <div class="max-w-4xl mx-auto">
                <!-- Welcome Message - ChatGPT Style -->
                <div class="mb-6">
                  <h1 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    Welcome back <span class="text-amber-500">👋</span>
                  </h1>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Harper</p>
                </div>
                
                <!-- Today's Goal Card -->
                <div class="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-5 md:p-6 mb-5 text-white shadow-lg border-2 border-emerald-400">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <div class="text-2xl">🎯</div>
                      <div>
                        <div class="flex items-center gap-2">
                          <h3 class="font-bold text-base md:text-lg">Start Here!</h3>
                          <span class="bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-bold">추천</span>
                        </div>
                        <p class="text-xs md:text-sm text-emerald-100">AI와 자유 대화 (초급~고급)</p>
                      </div>
                    </div>
                    <div class="text-xs text-emerald-100">~5분</div>
                  </div>
                  <button onclick="worvox.showAIConversation()" class="w-full bg-white text-emerald-700 font-bold py-3 rounded-lg hover:bg-emerald-50 transition-all text-sm md:text-base shadow-lg">
                    <i class="fas fa-play mr-2"></i>지금 시작하기
                  </button>
                </div>
                
                <!-- Divider -->
                <div class="border-t border-gray-200 dark:border-gray-700 my-5"></div>
                
                <!-- Quick Guide -->
                <div class="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-5">
                  <div class="flex items-start gap-3">
                    <div class="text-2xl">💡</div>
                    <div>
                      <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-1">학습 가이드</h3>
                      <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        처음이신가요? <strong class="text-blue-600 dark:text-blue-400">1단계: AI 자유 대화</strong>부터 시작하세요!<br>
                        편한 주제로 부담없이 말하다 보면 실력이 늘어요 🚀
                      </p>
                    </div>
                  </div>
                </div>
                
                <!-- Divider -->
                <div class="border-t border-gray-200 dark:border-gray-700 my-5"></div>
                
                <!-- Stats Section -->
                <div class="mb-5">
                  <h2 class="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    🔥 Streak | XP | Words
                  </h2>
                  <div class="grid grid-cols-3 gap-3">
                    <div class="text-center">
                      <div class="text-xl md:text-2xl font-bold text-orange-500">${stats.todayMessages || 0}</div>
                      <div class="text-xs text-gray-500">Streak</div>
                    </div>
                    <div class="text-center">
                      <div class="text-xl md:text-2xl font-bold text-purple-500">${stats.totalXp || 0}</div>
                      <div class="text-xs text-gray-500">XP</div>
                    </div>
                    <div class="text-center">
                      <div class="text-xl md:text-2xl font-bold text-blue-500">${stats.wordsLearned || 0}</div>
                      <div class="text-xs text-gray-500">Words</div>
                    </div>
                  </div>
                </div>
                
                <!-- Divider -->
                <div class="border-t border-gray-200 dark:border-gray-700 my-5"></div>
                
                <!-- Practice Modes Section -->
                <div class="mb-5">
                  <h2 class="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-3">
                    📚 학습 모드 선택
                  </h2>
                  <p class="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-3">
                    레벨과 목표에 맞는 학습 방법을 선택하세요
                  </p>
                  <div class="space-y-3">
                    <!-- AI Conversation -->
                    <button onclick="worvox.showAIConversation()" class="w-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 text-gray-900 dark:text-white font-medium py-4 px-4 rounded-xl transition-all text-left border-2 border-blue-200 dark:border-blue-800">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-1">
                            <span class="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">1단계</span>
                            <span class="text-sm md:text-base font-bold">🎤 AI 자유 대화</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">초급~고급</span>
                          </div>
                          <p class="text-xs text-gray-600 dark:text-gray-400">AI와 원하는 주제로 자유롭게 대화하세요</p>
                        </div>
                        <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">~5분</span>
                      </div>
                    </button>
                    
                    <!-- Scenario -->
                    <button onclick="worvox.showScenarioMode()" class="w-full bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 text-gray-900 dark:text-white font-medium py-4 px-4 rounded-xl transition-all text-left border-2 border-purple-200 dark:border-purple-800">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-1">
                            <span class="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">2단계</span>
                            <span class="text-sm md:text-base font-bold">🎭 시나리오 연습</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">초급~중급</span>
                          </div>
                          <p class="text-xs text-gray-600 dark:text-gray-400">실생활 상황(레스토랑, 공항 등)을 연습하세요</p>
                        </div>
                        <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">~10분</span>
                      </div>
                    </button>
                    
                    <!-- Timer -->
                    <button onclick="worvox.showTimerMode()" class="w-full bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 hover:from-orange-100 hover:to-red-100 dark:hover:from-orange-900/30 dark:hover:to-red-900/30 text-gray-900 dark:text-white font-medium py-4 px-4 rounded-xl transition-all text-left border-2 border-orange-200 dark:border-orange-800">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-1">
                            <span class="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">3단계</span>
                            <span class="text-sm md:text-base font-bold">⏱️ 타이머 모드</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">중급~고급</span>
                          </div>
                          <p class="text-xs text-gray-600 dark:text-gray-400">정해진 시간 동안 집중해서 말하기 연습</p>
                        </div>
                        <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">설정가능</span>
                      </div>
                    </button>
                    
                    <!-- Vocabulary -->
                    <button onclick="worvox.startVocabulary()" class="w-full bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 hover:from-green-100 hover:to-teal-100 dark:hover:from-green-900/30 dark:hover:to-teal-900/30 text-gray-900 dark:text-white font-medium py-4 px-4 rounded-xl transition-all text-left border-2 border-green-200 dark:border-green-800">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-1">
                            <span class="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">보충</span>
                            <span class="text-sm md:text-base font-bold">📖 단어 학습</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">모든 레벨</span>
                          </div>
                          <p class="text-xs text-gray-600 dark:text-gray-400">대화 중 나온 단어를 복습하세요</p>
                        </div>
                        <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">~3분</span>
                      </div>
                    </button>
                    
                    <!-- Exam -->
                    <button onclick="worvox.showExamMode()" class="w-full bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 hover:from-amber-100 hover:to-yellow-100 dark:hover:from-amber-900/30 dark:hover:to-yellow-900/30 text-gray-900 dark:text-white font-medium py-4 px-4 rounded-xl transition-all text-left border-2 border-amber-200 dark:border-amber-800">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-1">
                            <span class="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">고급</span>
                            <span class="text-sm md:text-base font-bold">📝 시험 모드</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">중급~고급</span>
                          </div>
                          <p class="text-xs text-gray-600 dark:text-gray-400">실전 면접/토익 스피킹 대비 연습</p>
                        </div>
                        <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">~15분</span>
                      </div>
                    </button>
                  </div>
                </div>
                
                <!-- Divider -->
                <div class="border-t border-gray-200 dark:border-gray-700 my-5"></div>
                
                <!-- Speak with a Tutor Section -->
                <div class="mb-5">
                  <h2 class="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-3">
                    👨‍🏫 원어민 튜터와 실전 대화
                  </h2>
                  <button onclick="worvox.showRealConversation()" class="w-full bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 hover:from-rose-100 hover:to-pink-100 dark:hover:from-rose-900/30 dark:hover:to-pink-900/30 text-gray-900 dark:text-white font-medium py-4 px-4 rounded-xl transition-all text-left border-2 border-rose-200 dark:border-rose-800">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">프리미엄</span>
                          <span class="text-sm md:text-base font-bold">🎁 실시간 튜터 수업</span>
                          <span class="text-xs text-gray-500 dark:text-gray-400">모든 레벨</span>
                        </div>
                        <p class="text-xs text-gray-600 dark:text-gray-400">원어민 튜터와 1:1 화상 수업 (첫 수업 무료!)</p>
                      </div>
                      <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">25분</span>
                    </div>
                  </button>
                </div>
                
                <!-- Daily Usage Tracker - Compact Grid -->
                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6 md:mb-8">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                      <i class="fas fa-chart-bar mr-1 text-sm"></i>Today's Usage
                    </h3>
                    ${this.currentUser?.plan === 'free' ? `
                    <button onclick="worvox.showPlan()" class="text-emerald-600 hover:text-emerald-700 text-xs font-medium">
                      Upgrade →
                    </button>
                    ` : this.currentUser?.plan === 'core' ? `
                    <span class="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      CORE
                    </span>
                    ` : `
                    <span class="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      PREMIUM
                    </span>
                    `}
                  </div>
                  
                  ${this.currentUser?.plan === 'free' ? `
                  <!-- Free Plan: Simple Grid with Limits -->
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <button onclick="worvox.showAIConversation()" class="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all text-center">
                      <div class="text-2xl mb-1">💬</div>
                      <div class="text-xs text-gray-600 mb-1">AI Conversation</div>
                      <div class="text-lg font-bold text-blue-600">
                        <span data-usage-count="ai_conversation">${this.getDailyUsage('ai_conversation')}</span>/<span class="text-sm">${this.usageLimits.free.aiConversations}</span>
                      </div>
                    </button>
                    
                    <button onclick="worvox.showTimerMode()" class="p-3 bg-gray-100 rounded-lg cursor-not-allowed opacity-50 text-center">
                      <div class="text-2xl mb-1">⏱️</div>
                      <div class="text-xs text-gray-600 mb-1">Timer Mode</div>
                      <div class="text-sm text-gray-500 font-medium">Core+</div>
                    </button>
                    
                    <button onclick="worvox.showScenarioMode()" class="p-3 bg-gray-100 rounded-lg cursor-not-allowed opacity-50 text-center">
                      <div class="text-2xl mb-1">🎬</div>
                      <div class="text-xs text-gray-600 mb-1">Scenario Mode</div>
                      <div class="text-sm text-gray-500 font-medium">Core+</div>
                    </button>
                    
                    <button onclick="worvox.showExamMode()" class="p-3 bg-gray-100 rounded-lg cursor-not-allowed opacity-50 text-center">
                      <div class="text-2xl mb-1">📝</div>
                      <div class="text-xs text-gray-600 mb-1">Exam Mode</div>
                      <div class="text-sm text-gray-500 font-medium">Core+</div>
                    </button>
                    
                    <button onclick="worvox.startVocabulary()" class="p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-all text-center">
                      <div class="text-2xl mb-1">📚</div>
                      <div class="text-xs text-gray-600 mb-1">Vocabulary</div>
                      <div class="text-lg font-bold text-emerald-600">
                        <span data-usage-count="word_search">${this.getDailyUsage('word_search')}</span>/<span class="text-sm">${this.usageLimits.free.wordSearch}</span>
                      </div>
                    </button>
                  </div>
                  ` : this.currentUser?.plan === 'core' ? `
                  <!-- Core Plan: Simple Grid with Limits -->
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <button onclick="worvox.showAIConversation()" class="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all text-center">
                      <div class="text-2xl mb-1">💬</div>
                      <div class="text-xs text-gray-600 mb-1">AI Conversation</div>
                      <div class="text-lg font-bold text-blue-600" data-usage-count="ai_conversation">${this.getDailyUsage('ai_conversation')}</div>
                      <div class="text-xs text-green-600 font-medium mt-1">∞</div>
                    </button>
                    
                    <button onclick="worvox.showTimerMode()" class="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all text-center">
                      <div class="text-2xl mb-1">⏱️</div>
                      <div class="text-xs text-gray-600 mb-1">Timer Mode</div>
                      <div class="text-lg font-bold text-purple-600">
                        <span data-usage-count="timer_mode">${this.getDailyUsage('timer_mode')}</span>/<span class="text-sm">${this.usageLimits.core.timerMode}</span>
                      </div>
                    </button>
                    
                    <button onclick="worvox.showScenarioMode()" class="p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all text-center">
                      <div class="text-2xl mb-1">🎬</div>
                      <div class="text-xs text-gray-600 mb-1">Scenario Mode</div>
                      <div class="text-lg font-bold text-indigo-600">
                        <span data-usage-count="scenario_mode">${this.getDailyUsage('scenario_mode')}</span>/<span class="text-sm">${this.usageLimits.core.scenarioMode}</span>
                      </div>
                    </button>
                    
                    <button onclick="worvox.showExamMode()" class="p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-all text-center">
                      <div class="text-2xl mb-1">📝</div>
                      <div class="text-xs text-gray-600 mb-1">Exam Mode</div>
                      <div class="text-lg font-bold text-orange-600">
                        <span data-usage-count="exam_mode">${this.getDailyUsage('exam_mode')}</span>/<span class="text-sm">${this.usageLimits.core.examMode}</span>
                      </div>
                    </button>
                    
                    <button onclick="worvox.startVocabulary()" class="p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-all text-center">
                      <div class="text-2xl mb-1">📚</div>
                      <div class="text-xs text-gray-600 mb-1">Vocabulary</div>
                      <div class="text-lg font-bold text-emerald-600" data-usage-count="word_search">${this.getDailyUsage('word_search')}</div>
                      <div class="text-xs text-green-600 font-medium mt-1">∞</div>
                    </button>
                  </div>
                  ` : `
                  <!-- Premium Plan: Simple Grid (All Unlimited) -->
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <button onclick="worvox.showAIConversation()" class="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all text-center">
                      <div class="text-2xl mb-1">💬</div>
                      <div class="text-xs text-gray-600 mb-1">AI Conversation</div>
                      <div class="text-lg font-bold text-blue-600" data-usage-count="ai_conversation">${this.getDailyUsage('ai_conversation')}</div>
                    </button>
                    
                    <button onclick="worvox.showTimerMode()" class="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all text-center">
                      <div class="text-2xl mb-1">⏱️</div>
                      <div class="text-xs text-gray-600 mb-1">Timer Mode</div>
                      <div class="text-lg font-bold text-purple-600" data-usage-count="timer_mode">${this.getDailyUsage('timer_mode')}</div>
                    </button>
                    
                    <button onclick="worvox.showScenarioMode()" class="p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all text-center">
                      <div class="text-2xl mb-1">🎬</div>
                      <div class="text-xs text-gray-600 mb-1">Scenario Mode</div>
                      <div class="text-lg font-bold text-indigo-600" data-usage-count="scenario_mode">${this.getDailyUsage('scenario_mode')}</div>
                    </button>
                    
                    <button onclick="worvox.showExamMode()" class="p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-all text-center">
                      <div class="text-2xl mb-1">📝</div>
                      <div class="text-xs text-gray-600 mb-1">Exam Mode</div>
                      <div class="text-lg font-bold text-orange-600" data-usage-count="exam_mode">${this.getDailyUsage('exam_mode')}</div>
                    </button>
                    
                    <button onclick="worvox.startVocabulary()" class="p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-all text-center">
                      <div class="text-2xl mb-1">📚</div>
                      <div class="text-xs text-gray-600 mb-1">Vocabulary</div>
                      <div class="text-lg font-bold text-emerald-600" data-usage-count="word_search">${this.getDailyUsage('word_search')}</div>
                    </button>
                  </div>
                  `}
                  
                  <div class="mt-3 pt-3 border-t border-gray-200">
                    <p class="text-xs text-gray-500 text-center">
                      <i class="fas fa-sync-alt mr-1"></i>Resets daily at midnight
                    </p>
                  </div>
                </div>

                <!-- Latest Report Card -->
                <div id="latestReportCard" class="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 mb-6 md:mb-8">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-base md:text-lg font-semibold text-gray-900">
                      <i class="fas fa-chart-line text-purple-600 mr-2"></i>Recent Report
                    </h3>
                    <button onclick="worvox.showHistory()" class="text-purple-600 hover:text-purple-700 text-xs md:text-sm font-medium">
                      View All →
                    </button>
                  </div>
                  <div id="latestReportContent">
                    <div class="text-center py-8 text-gray-400">
                      <i class="fas fa-spinner fa-spin text-4xl mb-3"></i>
                      <p class="text-sm">Loading report...</p>
                    </div>
                  </div>
                </div>
                
                <!-- Stats Summary -->
                <div class="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white">
                  <h3 class="text-2xl font-bold mb-6">Your Progress</h3>
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    <div>
                      <div class="text-2xl md:text-3xl font-bold mb-1">${stats.totalSessions}</div>
                      <div class="text-emerald-100 text-sm md:text-base">Sessions</div>
                    </div>
                    <div>
                      <div class="text-2xl md:text-3xl font-bold mb-1">${totalWords.toLocaleString()}</div>
                      <div class="text-emerald-100 text-sm md:text-base">Words</div>
                    </div>
                    <div class="col-span-2 md:col-span-1">
                      <div class="text-2xl md:text-3xl font-bold mb-1">${Math.floor(stats.totalMessages / 2)}h</div>
                      <div class="text-emerald-100 text-sm md:text-base">Study Time</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Footer (inside padded content area) -->
              ${this.getFooter()}
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Load gamification stats after rendering
      await this.loadGamificationStats();
      
      // Load latest report
      await this.loadLatestReport();
    } catch (error) {
      console.error('Error loading topics:', error);
      alert('Failed to load topics. Please refresh the page.');
    }
  }

  // Load latest report for dashboard
  async loadLatestReport() {
    const reportContainer = document.getElementById('latestReportContent');
    if (!reportContainer) return;

    try {
      if (!this.currentUser || !this.currentUser.id) {
        reportContainer.innerHTML = `
          <div class="text-center py-8 md:py-12">
            <i class="fas fa-chart-line text-gray-300 text-4xl md:text-5xl mb-3"></i>
            <p class="text-sm md:text-base text-gray-500 font-medium mb-2">No recent reports</p>
            <p class="text-xs md:text-sm text-gray-400">Start an AI conversation to get your report</p>
          </div>
        `;
        return;
      }

      const response = await axios.get(`/api/analysis/users/${this.currentUser.id}/latest-report`);
      
      if (response.data.success && response.data.report) {
        const report = response.data.report;
        
        // Calculate average score
        const avgScore = Math.round((report.grammar_score + report.vocabulary_score + report.fluency_score) / 3);
        
        // Determine color based on score
        let scoreColor = 'text-red-600';
        let bgColor = 'bg-red-50';
        let borderColor = 'border-red-200';
        if (avgScore >= 80) {
          scoreColor = 'text-green-600';
          bgColor = 'bg-green-50';
          borderColor = 'border-green-200';
        } else if (avgScore >= 60) {
          scoreColor = 'text-yellow-600';
          bgColor = 'bg-yellow-50';
          borderColor = 'border-yellow-200';
        }
        
        reportContainer.innerHTML = `
          <div class="border ${borderColor} ${bgColor} rounded-xl p-5 md:p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-16 h-16 md:w-20 md:h-20 ${bgColor} rounded-full flex items-center justify-center border-2 ${borderColor}">
                  <span class="text-3xl md:text-4xl ${scoreColor} font-bold">${avgScore}</span>
                </div>
                <div>
                  <div class="text-base md:text-lg font-bold text-gray-900">Average Score</div>
                  <div class="text-xs md:text-sm text-gray-500">${new Date(report.analyzed_at).toLocaleDateString('en-US')}</div>
                </div>
              </div>
              <button onclick="worvox.showSessionReportById(${report.session_id})" 
                class="text-purple-600 hover:text-purple-700 text-sm md:text-base font-semibold whitespace-nowrap">
                View Details →
              </button>
            </div>
            
            <div class="grid grid-cols-3 gap-3 md:gap-4 mb-4">
              <div class="text-center p-3 md:p-4 bg-white rounded-lg shadow-sm border border-blue-100">
                <div class="text-xs md:text-sm text-gray-500 mb-1 font-medium">Grammar</div>
                <div class="text-xl md:text-2xl font-bold text-blue-600">${report.grammar_score}</div>
              </div>
              <div class="text-center p-3 md:p-4 bg-white rounded-lg shadow-sm border border-purple-100">
                <div class="text-xs md:text-sm text-gray-500 mb-1 font-medium">Vocabulary</div>
                <div class="text-xl md:text-2xl font-bold text-purple-600">${report.vocabulary_score}</div>
              </div>
              <div class="text-center p-3 md:p-4 bg-white rounded-lg shadow-sm border border-green-100">
                <div class="text-xs md:text-sm text-gray-500 mb-1 font-medium">Fluency</div>
                <div class="text-xl md:text-2xl font-bold text-green-600">${report.fluency_score}</div>
              </div>
            </div>
            
            ${report.total_messages ? `
              <div class="pt-3 border-t border-gray-200">
                <div class="flex items-center justify-between text-xs md:text-sm text-gray-600">
                  <span class="flex items-center gap-1"><i class="fas fa-comments"></i>${report.total_messages} conversations</span>
                  <span class="flex items-center gap-1"><i class="fas fa-font"></i>${report.total_words} words</span>
                  <span class="flex items-center gap-1"><i class="fas fa-clock"></i>${Math.ceil(report.total_messages * 0.5)} min</span>
                </div>
              </div>
            ` : ''}
          </div>
        `;
      } else {
        // No report found
        reportContainer.innerHTML = `
          <div class="text-center py-8 md:py-12">
            <i class="fas fa-chart-line text-gray-300 text-4xl md:text-5xl mb-3"></i>
            <p class="text-sm md:text-base text-gray-500 font-medium mb-2">No recent reports</p>
            <p class="text-xs md:text-sm text-gray-400">Start an AI conversation to get your report</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading latest report:', error);
      // Show empty state on error
      reportContainer.innerHTML = `
        <div class="text-center py-8 md:py-12">
          <i class="fas fa-chart-line text-gray-300 text-4xl md:text-5xl mb-3"></i>
          <p class="text-sm md:text-base text-gray-500 font-medium mb-2">최근 리포트 없음</p>
          <p class="text-xs md:text-sm text-gray-400">AI 대화를 시작하고 리포트를 받아보세요</p>
        </div>
      `;
    }
  }

  // Start topic by ID (finds topic from stored topics array)
  startTopicById(topicId) {
    const topic = this.topics.find(t => t.id === topicId);
    if (topic) {
      this.startSession(topic.id, topic.name, topic.system_prompt, topic.level);
    }
  }

  async startSession(topicId, topicName, systemPrompt, level) {
    try {
      // Special handling for Vocabulary topic
      if (topicName === 'Vocabulary') {
        await this.showVocabulary();
        return;
      }
      
      // Check if it's Vocabulary topic
      if (topicName === 'Vocabulary') {
        this.showVocabularyLearning();
        return;
      }

      const response = await axios.post('/api/sessions/create', {
        userId: this.currentUser.id,
        topicId: topicId,
        level: level
      });

      if (response.data.success) {
        this.currentSession = response.data.sessionId;
        this.currentTopic = {
          name: topicName,
          systemPrompt: systemPrompt
        };
        this.messages = [];
        this.showChatInterface();
      }
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session. Please try again.');
    }
  }

  async resumeSession(sessionId) {
    try {
      // Fetch session details
      const response = await axios.get(`/api/sessions/${sessionId}`);
      if (response.data.success) {
        const session = response.data.session;
        this.currentSession = sessionId;
        this.currentTopic = {
          name: session.topic_name || 'Conversation',
          systemPrompt: session.system_prompt || ''
        };
        
        // Load messages for this session
        const messagesResponse = await axios.get(`/api/sessions/${sessionId}/messages`);
        this.messages = messagesResponse.data.messages || [];
        
        this.showChatInterface();
      }
    } catch (error) {
      console.error('Error resuming session:', error);
      alert('Failed to resume session. Please try again.');
    }
  }

  showChatInterface() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
        <!-- Sidebar -->
        ${this.getSidebar('conversation')}
        
        <!-- Main Content -->
        <div class="flex-1 flex flex-col">
          <!-- Header -->
          <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
            <div class="flex items-center justify-between">
              <!-- Back Button + Title -->
              <div class="flex items-center gap-2 md:gap-4 flex-1">
                <button onclick="worvox.endSession()" 
                  class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
                  <i class="fas fa-arrow-left text-xl"></i>
                </button>
                <div class="flex-1">
                  <h2 class="text-base md:text-lg font-semibold text-gray-800">${this.currentTopic.name}</h2>
                  <span class="hidden md:inline text-sm text-gray-500">Practice your English!</span>
                </div>
              </div>
              <!-- End Session Button -->
              <button onclick="worvox.endSession()" 
                class="flex items-center gap-2 text-white bg-red-500 hover:bg-red-600 px-3 md:px-4 py-2 rounded-lg transition-all text-sm md:text-base font-semibold shadow-sm">
                <i class="fas fa-stop-circle"></i>
                <span class="hidden sm:inline">End</span>
                <span class="hidden md:inline">Session</span>
              </button>
            </div>
          </div>

          <!-- Chat Container -->
          <div class="flex-1 overflow-hidden flex flex-col">
            <div id="chatMessages" class="flex-1 overflow-y-auto p-3 md:p-4 chat-container">
              <div class="max-w-4xl mx-auto">
                <div class="text-center text-gray-500 py-4 md:py-6">
                  <p class="text-sm md:text-base font-semibold mb-4">대화 주제를 선택하세요</p>
                  
                  <!-- Compact Conversation Scenario Grid -->
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 mb-4">
                    <button onclick="worvox.startAIScenario('roleplay')" 
                      class="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-3 rounded-lg shadow hover:shadow-lg transition-all transform hover:scale-105">
                      <div class="text-2xl mb-1">🎭</div>
                      <div class="text-xs font-semibold">AI Roleplay</div>
                    </button>
                    
                    <button onclick="worvox.startAIScenario('interview')" 
                      class="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-3 rounded-lg shadow hover:shadow-lg transition-all transform hover:scale-105">
                      <div class="text-2xl mb-1">💼</div>
                      <div class="text-xs font-semibold">Job Interview</div>
                    </button>
                    
                    <button onclick="worvox.startAIScenario('meeting')" 
                      class="bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white p-3 rounded-lg shadow hover:shadow-lg transition-all transform hover:scale-105">
                      <div class="text-2xl mb-1">📊</div>
                      <div class="text-xs font-semibold">Business Meeting</div>
                    </button>
                    
                    <button onclick="worvox.startAIScenario('restaurant')" 
                      class="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-3 rounded-lg shadow hover:shadow-lg transition-all transform hover:scale-105">
                      <div class="text-2xl mb-1">🍽️</div>
                      <div class="text-xs font-semibold">Restaurant</div>
                    </button>
                    
                    <button onclick="worvox.startAIScenario('travel')" 
                      class="bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white p-3 rounded-lg shadow hover:shadow-lg transition-all transform hover:scale-105">
                      <div class="text-2xl mb-1">✈️</div>
                      <div class="text-xs font-semibold">Travel</div>
                    </button>
                    
                    <button onclick="worvox.startAIScenario('shopping')" 
                      class="bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white p-3 rounded-lg shadow hover:shadow-lg transition-all transform hover:scale-105">
                      <div class="text-2xl mb-1">🛍️</div>
                      <div class="text-xs font-semibold">Shopping</div>
                    </button>
                    
                    <button onclick="worvox.startAIScenario('doctor')" 
                      class="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3 rounded-lg shadow hover:shadow-lg transition-all transform hover:scale-105">
                      <div class="text-2xl mb-1">🏥</div>
                      <div class="text-xs font-semibold">Doctor Visit</div>
                    </button>
                    
                    <button onclick="worvox.startAIScenario('military')" 
                      class="bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white p-3 rounded-lg shadow hover:shadow-lg transition-all transform hover:scale-105">
                      <div class="text-2xl mb-1">🪖</div>
                      <div class="text-xs font-semibold">Military English</div>
                    </button>
                    
                    <button onclick="worvox.startAIScenario('casual')" 
                      class="bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white p-3 rounded-lg shadow hover:shadow-lg transition-all transform hover:scale-105">
                      <div class="text-2xl mb-1">💬</div>
                      <div class="text-xs font-semibold">Casual Chat</div>
                    </button>
                  </div>
                  
                  <p class="text-xs text-gray-400">주제를 선택하거나 마이크를 눌러 자유롭게 대화하세요</p>
                </div>
              </div>
            </div>

            <!-- Input Area -->
            <div class="bg-white border-t border-gray-200">
              <div class="max-w-3xl mx-auto p-6">
                <div class="flex items-center gap-4">
                  <button id="recordBtn" 
                    class="flex-shrink-0 w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg"
                    onclick="worvox.toggleRecording()">
                    <i class="fas fa-microphone text-xl"></i>
                  </button>
                  <div class="flex-1">
                    <p id="statusText" class="text-gray-600">Tap the microphone to start speaking</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Load gamification stats after rendering
    setTimeout(() => this.loadGamificationStats(), 100);
  }

  async startAIScenario(scenarioType) {
    // Define scenario prompts
    const scenarios = {
      roleplay: {
        emoji: '🎭',
        title: 'AI Roleplay',
        prompt: "Hello! I'm excited to do some roleplay with you today. What kind of character or situation would you like to explore? I can be anyone - a friend, a colleague, a historical figure, or even a fictional character!",
        systemContext: "You are a versatile AI roleplay partner. Adapt to any character or situation the user requests and stay in character throughout the conversation."
      },
      interview: {
        emoji: '💼',
        title: 'Job Interview',
        prompt: "Good morning! Thank you for coming in today. I'm the hiring manager, and I'm excited to learn more about you. Let's start with this: Can you tell me about yourself and why you're interested in this position?",
        systemContext: "You are a professional job interviewer. Ask relevant questions about the candidate's experience, skills, and career goals. Provide constructive feedback."
      },
      meeting: {
        emoji: '📊',
        title: 'Business Meeting',
        prompt: "Good morning everyone! Thank you for joining today's meeting. We have several important items on our agenda. Let's start by discussing our quarterly goals and progress. What updates do you have from your department?",
        systemContext: "You are a professional business meeting facilitator. Guide discussions, ask relevant questions, and help make decisions."
      },
      restaurant: {
        emoji: '🍽️',
        title: 'Restaurant',
        prompt: "Good evening! Welcome to our restaurant. I'm your server today. Have you dined with us before? Let me tell you about our specials for tonight!",
        systemContext: "You are a friendly restaurant server. Help customers order food, make recommendations, and answer questions about the menu."
      },
      travel: {
        emoji: '✈️',
        title: 'Travel',
        prompt: "Hello! Welcome to our travel information desk. Are you visiting our city for the first time? I'd be happy to help you with directions, recommendations, or any questions about local attractions!",
        systemContext: "You are a helpful travel guide. Provide information about tourist attractions, local customs, transportation, and helpful tips."
      },
      shopping: {
        emoji: '🛍️',
        title: 'Shopping',
        prompt: "Hi there! Welcome to our store! I'm here to help you find exactly what you're looking for today. What kind of items are you interested in?",
        systemContext: "You are a helpful retail sales associate. Assist customers in finding products, answer questions, and provide recommendations."
      },
      doctor: {
        emoji: '🏥',
        title: 'Doctor Visit',
        prompt: "Hello! Please come in and have a seat. I'm Dr. Smith. What brings you to the clinic today? Tell me about any symptoms you've been experiencing.",
        systemContext: "You are a kind and professional doctor. Ask about symptoms, provide general health advice (always remind that this is practice and not real medical advice)."
      },
      military: {
        emoji: '🪖',
        title: 'Military English',
        prompt: "Good morning, soldier! Welcome to the military English training. I'm your commanding officer. Today we'll practice essential military communication - orders, reports, and briefings. Are you ready to begin? Report your status!",
        systemContext: "You are a military officer conducting English training. Use military terminology, teach proper reporting format, chain of command language, and tactical communication. Be professional but encouraging."
      },
      casual: {
        emoji: '💬',
        title: 'Casual Chat',
        prompt: "Hey! How's it going? I'm always up for a good conversation. What's on your mind today? We can talk about anything - hobbies, current events, life experiences, or just chat about our day!",
        systemContext: "You are a friendly conversation partner. Chat naturally about everyday topics, ask follow-up questions, and keep the conversation engaging."
      }
    };

    const scenario = scenarios[scenarioType];
    if (!scenario) return;

    // Clear chat messages
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = `
      <div class="max-w-3xl mx-auto">
        <div class="mb-4 p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl text-white text-center">
          <div class="text-3xl mb-2">${scenario.emoji}</div>
          <div class="font-semibold">${scenario.title} Mode</div>
        </div>
      </div>
    `;

    // Store scenario context for AI
    this.currentScenarioContext = scenario.systemContext;

    // Add AI greeting message
    this.addMessage(scenario.prompt, 'bot');

    // Auto-play AI greeting
    try {
      const response = await axios.post('/api/tts/synthesize', {
        text: scenario.prompt,
        userId: this.currentUser.id
      });

      if (response.data.audioUrl) {
        const audio = new Audio(response.data.audioUrl);
        audio.play();
      }
    } catch (error) {
      console.error('TTS error:', error);
    }
  }

  async toggleRecording() {
    if (this.isRecording) {
      await this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to use audio/webm with opus codec, fallback to default
      let options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log('audio/webm;codecs=opus not supported, trying audio/webm');
        options = { mimeType: 'audio/webm' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.log('audio/webm not supported, using default');
          options = {};
        }
      }
      
      this.mediaRecorder = new MediaRecorder(stream, options);
      this.audioChunks = [];

      console.log('MediaRecorder created with mimeType:', this.mediaRecorder.mimeType);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
        const recordedAudio = new Blob(this.audioChunks, { type: mimeType });
        console.log('Recording stopped. Blob size:', recordedAudio.size, 'type:', recordedAudio.type);
        await this.processAudio(recordedAudio);
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      // Update UI
      const recordBtn = document.getElementById('recordBtn');
      recordBtn.classList.add('mic-recording', 'bg-red-600');
      recordBtn.innerHTML = '<i class="fas fa-stop text-2xl"></i>';
      document.getElementById('statusText').textContent = 'Recording... Tap to stop';

    } catch (error) {
      console.error('Error starting recording:', error);
      if (error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone access in your browser settings.');
      } else {
        alert('Unable to access microphone: ' + error.message);
      }
    }
  }

  async stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;

      // Update UI
      const recordBtn = document.getElementById('recordBtn');
      recordBtn.classList.remove('mic-recording', 'bg-red-600');
      recordBtn.classList.add('bg-gray-400');
      recordBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-2xl"></i>';
      document.getElementById('statusText').textContent = 'Processing...';
    }
  }

  async processAudio(recordedAudio) {
    try {
      console.log('Processing audio blob:', recordedAudio.size, 'bytes, type:', recordedAudio.type);
      
      // Step 1: Transcribe audio
      const formData = new FormData();
      // Determine file extension based on mime type
      const fileExt = recordedAudio.type.includes('webm') ? 'webm' : 
                     recordedAudio.type.includes('mp4') ? 'm4a' : 
                     recordedAudio.type.includes('ogg') ? 'ogg' : 'webm';
      formData.append('audio', recordedAudio, `recording.${fileExt}`);

      console.log('Sending to STT API...');
      const transcriptionResponse = await axios.post('/api/stt/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('STT Response:', transcriptionResponse.data);
      const transcription = transcriptionResponse.data.transcription;
      
      if (!transcription || transcription.trim() === '') {
        throw new Error('No transcription received. Please speak clearly.');
      }
      
      // Add user message to UI
      this.addMessage(transcription, 'user');

      // Step 2: Get AI response
      console.log('Sending to Chat API...');
      
      // Use scenario context if available, otherwise use topic system prompt
      const systemPrompt = this.currentScenarioContext || this.currentTopic.systemPrompt;
      
      const chatResponse = await axios.post('/api/chat/message', {
        sessionId: this.currentSession,
        userMessage: transcription,
        systemPrompt: systemPrompt
      });

      console.log('Chat Response:', chatResponse.data);
      const aiMessage = chatResponse.data.message;
      
      // Add AI message to UI (without audio yet)
      this.addMessage(aiMessage, 'assistant');

      // Step 3: Generate speech for AI response
      console.log('Sending to TTS API...');
      const ttsResponse = await axios.post('/api/tts/speak', {
        text: aiMessage
      }, {
        responseType: 'arraybuffer'
      });

      console.log('TTS Response received:', ttsResponse.data.byteLength, 'bytes');
      
      // Create audio blob and URL
      const ttsAudioBlob = new Blob([ttsResponse.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(ttsAudioBlob);
      
      // Store audio URL for replay button
      const lastMessageIndex = this.messages.length - 1;
      this.messages[lastMessageIndex].audioUrl = audioUrl;
      
      // Add replay button to the last AI message
      this.addReplayButton(lastMessageIndex);
      
      // Play audio
      this.playAudio(audioUrl);

      // Reset UI
      const recordBtn = document.getElementById('recordBtn');
      recordBtn.classList.remove('bg-gray-400');
      recordBtn.classList.add('bg-red-500');
      recordBtn.innerHTML = '<i class="fas fa-microphone text-2xl"></i>';
      document.getElementById('statusText').textContent = 'Tap the microphone to speak again';

    } catch (error) {
      console.error('Error processing audio:', error);
      
      let errorMessage = 'Failed to process your message.';
      if (error.response) {
        console.error('API Error Response:', error.response.data);
        errorMessage = `API Error: ${error.response.data.error || error.response.statusText}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage + ' Please try again.');
      
      // Reset UI
      const recordBtn = document.getElementById('recordBtn');
      recordBtn.classList.remove('bg-gray-400');
      recordBtn.classList.add('bg-red-500');
      recordBtn.innerHTML = '<i class="fas fa-microphone text-2xl"></i>';
      document.getElementById('statusText').textContent = 'Error occurred. Tap to try again';
    }
  }

  addMessage(content, role) {
    const messageIndex = this.messages.length;
    this.messages.push({ role, content, audioUrl: null });
    
    const chatMessages = document.getElementById('chatMessages');
    
    // Remove empty state if exists
    if (chatMessages.querySelector('.text-center')) {
      chatMessages.innerHTML = '';
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `mb-4 ${role === 'user' ? 'text-right' : 'text-left'} message-${role}`;
    messageDiv.id = `message-${messageIndex}`;
    
    messageDiv.innerHTML = `
      <div class="inline-block max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${
        role === 'user' 
          ? 'bg-indigo-600 text-white' 
          : 'bg-gray-200 text-gray-800'
      }">
        <p class="text-sm md:text-base">${this.escapeHtml(content)}</p>
        ${role === 'assistant' ? '<div id="replay-container-' + messageIndex + '" class="mt-2"></div>' : ''}
      </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  addReplayButton(messageIndex) {
    const replayContainer = document.getElementById(`replay-container-${messageIndex}`);
    if (replayContainer) {
      replayContainer.innerHTML = `
        <button 
          onclick="worvox.replayAudio(${messageIndex})" 
          id="replay-btn-${messageIndex}"
          class="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition-colors">
          <i class="fas fa-redo"></i>
          <span>다시 듣기</span>
        </button>
      `;
    }
  }

  async replayAudio(messageIndex) {
    const message = this.messages[messageIndex];
    const replayBtn = document.getElementById(`replay-btn-${messageIndex}`);
    
    if (!message || !message.audioUrl) {
      alert('Audio not available');
      return;
    }
    
    try {
      // Update button state
      if (replayBtn) {
        replayBtn.disabled = true;
        replayBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>재생 중...</span>';
      }
      
      // Play audio
      if (this.currentAudio) {
        this.currentAudio.pause();
      }
      
      this.currentAudio = new Audio(message.audioUrl);
      this.currentAudio.playbackRate = 0.85; // 15% slower for better comprehension
      
      this.currentAudio.onended = () => {
        if (replayBtn) {
          replayBtn.disabled = false;
          replayBtn.innerHTML = '<i class="fas fa-redo"></i><span>다시 듣기</span>';
        }
      };
      
      this.currentAudio.onerror = () => {
        if (replayBtn) {
          replayBtn.disabled = false;
          replayBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>오류</span>';
          setTimeout(() => {
            replayBtn.innerHTML = '<i class="fas fa-redo"></i><span>다시 듣기</span>';
          }, 2000);
        }
      };
      
      await this.currentAudio.play();
    } catch (error) {
      console.error('Error replaying audio:', error);
      if (replayBtn) {
        replayBtn.disabled = false;
        replayBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>오류</span>';
        setTimeout(() => {
          replayBtn.innerHTML = '<i class="fas fa-redo"></i><span>다시 듣기</span>';
        }, 2000);
      }
    }
  }

  playAudio(url) {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
    
    this.currentAudio = new Audio(url);
    this.currentAudio.play();
  }

  async endSession() {
    try {
      console.log('🛑 End Session clicked!');
      if (this.currentSession) {
        console.log('✅ Current session ID:', this.currentSession);
        console.log('📝 Total messages:', this.messages.length);
        
        // 1. 세션 종료 API 호출
        await axios.post(`/api/sessions/end/${this.currentSession}`);
        console.log('✅ Session ended successfully');
        
        // 2. 분석 시작 (최소 3개 이상의 사용자 메시지가 있을 때)
        const userMessages = this.messages.filter(m => m.role === 'user');
        console.log('👤 User messages count:', userMessages.length);
        
        if (userMessages.length >= 3) {
          console.log('✅ Starting analysis (>=3 messages)...');
          const sessionIdToAnalyze = this.currentSession;
          
          // 세션 변수 초기화 (분석 중에도 다른 작업 가능하게)
          this.currentSession = null;
          this.currentTopic = null;
          this.messages = [];
          
          // 분석 로딩 화면 표시
          this.showAnalysisLoading();
          
          try {
            // 3. 분석 API 호출
            const analysisResponse = await axios.post(
              `/api/analysis/sessions/${sessionIdToAnalyze}/analyze`
            );
            
            console.log('✅ Analysis response:', analysisResponse.data);
            
            if (analysisResponse.data.success) {
              console.log('✅ Showing report with ID:', analysisResponse.data.reportId);
              // 4. 리포트 페이지로 이동
              await this.showSessionReport(analysisResponse.data.reportId);
              console.log('✅ Report displayed successfully');
            } else {
              throw new Error('Analysis failed: ' + JSON.stringify(analysisResponse.data));
            }
          } catch (error) {
            console.error('❌ Analysis error:', error);
            console.error('Error details:', error.response?.data);
            const errorMsg = error.response?.data?.error || error.message || '알 수 없는 오류';
            const errorDetails = error.response?.data?.details || '';
            alert('분석 중 오류가 발생했습니다:\n\n' + errorMsg + (errorDetails ? '\n\n상세: ' + errorDetails : '') + '\n\n콘솔(F12)에서 자세한 내용을 확인하세요.');
            // 분석 실패 시 대시보드로
            this.showTopicSelection();
          }
        } else {
          // 메시지가 너무 적으면 분석 없이 종료
          console.log('⚠️ Not enough messages for analysis (need 3+, got ' + userMessages.length + ')');
          alert('분석을 위해서는 최소 3번 이상 대화해야 합니다.\n현재 메시지: ' + userMessages.length + '개');
          this.currentSession = null;
          this.currentTopic = null;
          this.messages = [];
          this.showTopicSelection();
        }
      } else {
        console.log('❌ No current session');
        this.showTopicSelection();
      }
    } catch (error) {
      console.error('Error ending session:', error);
      this.currentSession = null;
      this.currentTopic = null;
      this.messages = [];
      this.showTopicSelection();
    }
  }

  logout() {
    localStorage.removeItem('worvox_user');
    this.currentUser = null;
    this.currentSession = null;
    this.currentTopic = null;
    this.messages = [];
    this.showLogin();
  }

  // Vocabulary feature
  async showVocabulary(difficulty = 'beginner', mode = 'list') {
    this.vocabularyDifficulty = difficulty; // 'beginner', 'intermediate', 'advanced'
    this.vocabularyMode = mode; // 'list', 'flashcard', 'quiz'
    
    // Reset mode-specific data when switching modes or difficulty
    if (mode === 'flashcard') {
      this.flashcardIndex = 0;
      this.flashcardFlipped = false;
    } else if (mode === 'quiz') {
      this.quizData = null; // Reset quiz data
    }
    
    try {
      // Fetch words by difficulty
      const response = await axios.get(`/api/vocabulary/list?difficulty=${difficulty}`);
      let words = response.data.words || [];
      
      // Shuffle words for flashcard/quiz mode
      if (mode !== 'list') {
        words = this.shuffleArray(words);
      }
      
      // Store data
      document.getElementById('app').dataset.vocabularyData = JSON.stringify({ words });
      
      // Get user progress
      let progressData = {};
      let bookmarkedWords = [];
      if (this.currentUser) {
        try {
          const progressResponse = await axios.get(`/api/vocabulary/progress/${this.currentUser.id}/all`);
          const bookmarksResponse = await axios.get(`/api/vocabulary/bookmarks/${this.currentUser.id}`);
          
          if (progressResponse.data.success) {
            const progress = progressResponse.data.progress || [];
            progress.forEach(p => {
              progressData[p.word_id] = p;
            });
          }
          
          if (bookmarksResponse.data.success) {
            bookmarkedWords = bookmarksResponse.data.bookmarks.map(b => b.word_id);
          }
        } catch (e) {
          console.log('Progress/bookmarks not loaded:', e);
        }
      }
  
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
          <!-- Sidebar -->
          ${this.getSidebar('vocabulary')}
          
          <!-- Main Content -->
          <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Header with Back Button -->
            <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
              <div class="flex items-center gap-2 mb-4">
                <button onclick="worvox.showTopicSelection()" 
                  class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
                  <i class="fas fa-arrow-left text-xl"></i>
                </button>
                <div>
                  <h1 class="text-lg md:text-2xl font-bold text-gray-800">📚 Vocabulary Study</h1>
                  <p class="hidden md:block text-gray-600 text-sm mt-1">Learn English vocabulary by difficulty level</p>
                </div>
              </div>
              
              <!-- Difficulty Tabs -->
              <div class="flex gap-2 mb-4 overflow-x-auto">
                <button onclick="worvox.showVocabulary('beginner', '${mode}')" 
                  class="flex-shrink-0 px-4 md:px-6 py-2 md:py-3 ${difficulty === 'beginner' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} rounded-lg transition-all font-semibold text-sm md:text-base">
                  <i class="fas fa-seedling mr-2"></i>Beginner
                </button>
                <button onclick="worvox.showVocabulary('intermediate', '${mode}')" 
                  class="flex-shrink-0 px-4 md:px-6 py-2 md:py-3 ${difficulty === 'intermediate' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} rounded-lg transition-all font-semibold text-sm md:text-base">
                  <i class="fas fa-book mr-2"></i>Intermediate
                </button>
                <button onclick="worvox.showVocabulary('advanced', '${mode}')" 
                  class="flex-shrink-0 px-4 md:px-6 py-2 md:py-3 ${difficulty === 'advanced' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} rounded-lg transition-all font-semibold text-sm md:text-base">
                  <i class="fas fa-graduation-cap mr-2"></i>Advanced
                </button>
              </div>
              
              <!-- Mode Buttons -->
              <div class="flex gap-2">
                <button onclick="worvox.showVocabulary('${difficulty}', 'list')" 
                  class="flex-1 px-3 md:px-4 py-2 ${mode === 'list' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors text-xs md:text-sm font-medium">
                  <i class="fas fa-list mr-2"></i>List
                </button>
                <button onclick="worvox.showVocabulary('${difficulty}', 'flashcard')" 
                  class="flex-1 px-3 md:px-4 py-2 ${mode === 'flashcard' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors text-xs md:text-sm font-medium">
                  <i class="fas fa-clone mr-2"></i>Flashcard
                </button>
                <button onclick="worvox.showVocabulary('${difficulty}', 'quiz')" 
                  class="flex-1 px-3 md:px-4 py-2 ${mode === 'quiz' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors text-xs md:text-sm font-medium">
                  <i class="fas fa-graduation-cap mr-2"></i>Quiz
                </button>
              </div>
            </div>
            
            <!-- Content Area -->
            <div class="flex-1 overflow-y-auto p-4 md:p-6">
              ${this.renderVocabularyContent(mode, words, difficulty, progressData, bookmarkedWords)}
            </div>
          </div>
        </div>
      `;
      
    } catch (error) {
      console.error('Error loading vocabulary:', error);
      document.getElementById('app').innerHTML = `
        <div class="flex items-center justify-center h-screen">
          <div class="text-center">
            <i class="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">Failed to Load Vocabulary</h2>
            <p class="text-gray-600 mb-4">${error.message}</p>
            <button onclick="worvox.showTopicSelection()" 
              class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Go Back
            </button>
          </div>
        </div>
      `;
    }
  }
  
  // Render content based on mode
  renderVocabularyContent(mode, words, difficulty, progressData, bookmarkedWords) {
    if (words.length === 0) {
      return `
        <div class="text-center py-12">
          <i class="fas fa-book-open text-gray-300 text-6xl mb-4"></i>
          <h3 class="text-xl font-bold text-gray-600 mb-2">No ${difficulty} words available yet</h3>
          <p class="text-gray-500">Check back later or try another difficulty level.</p>
        </div>
      `;
    }
    
    if (mode === 'list') {
      return this.renderListMode(words, progressData, bookmarkedWords);
    } else if (mode === 'flashcard') {
      return this.renderFlashcardMode(words, progressData, bookmarkedWords);
    } else if (mode === 'quiz') {
      return this.renderQuizMode(words, difficulty);
    }
  }
  
  // List Mode
  renderListMode(words, progressData, bookmarkedWords) {
    return `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${words.map(word => {
          const isLearned = progressData[word.id]?.is_learned === 1;
          const isBookmarked = bookmarkedWords.includes(word.id);
          
          return `
            <div class="bg-white rounded-xl p-4 md:p-5 border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all">
              <!-- Word Header -->
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="text-xl md:text-2xl font-bold text-gray-800">${this.escapeHtml(word.word)}</h3>
                    <button onclick="worvox.playPronunciation('${this.escapeHtml(word.word)}')" 
                      class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all">
                      <i class="fas fa-volume-up"></i>
                    </button>
                  </div>
                  ${word.pronunciation ? `
                    <div class="text-sm text-gray-500 italic">${this.escapeHtml(word.pronunciation)}</div>
                  ` : ''}
                </div>
                
                ${this.currentUser ? `
                  <div class="flex items-center gap-2">
                    <button onclick="worvox.toggleBookmark(${word.id}, ${isBookmarked})" 
                      class="p-2 text-xl ${isBookmarked ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500 transition-colors">
                      <i class="fas fa-star"></i>
                    </button>
                    ${isLearned ? '<i class="fas fa-check-circle text-green-600 text-xl"></i>' : ''}
                  </div>
                ` : ''}
              </div>
              
              <!-- Meanings -->
              <div class="mb-3 pb-3 border-b border-gray-100">
                <div class="text-gray-800 font-medium mb-1">${this.escapeHtml(word.meaning_ko)}</div>
                ${word.meaning_en ? `
                  <div class="text-gray-600 text-sm italic">${this.escapeHtml(word.meaning_en)}</div>
                ` : ''}
              </div>
              
              <!-- Example -->
              ${word.example_sentence ? `
                <div class="bg-gray-50 rounded-lg p-3 mb-3">
                  <div class="text-sm text-gray-700 italic">"${this.escapeHtml(word.example_sentence)}"</div>
                </div>
              ` : ''}
              
              <!-- Actions -->
              ${this.currentUser ? `
                <div class="flex gap-2">
                  <button onclick="worvox.toggleLearnedStatus(${word.id}, ${!isLearned})" 
                    class="flex-1 px-4 py-2 ${isLearned ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'} rounded-lg font-medium transition-colors text-sm">
                    ${isLearned ? '<i class="fas fa-check mr-1"></i> Learned' : 'Mark as Learned'}
                  </button>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  
  // Flashcard Mode (existing implementation - will keep similar)
  renderFlashcardMode(words, progressData, bookmarkedWords) {
    const word = words[0];
    const isLearned = progressData[word.id]?.is_learned === 1;
    const isBookmarked = bookmarkedWords.includes(word.id);
    
    return `
      <div class="max-w-2xl mx-auto">
        <!-- Progress Indicator -->
        <div class="mb-6 text-center">
          <div class="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-sm">
            <span class="text-gray-600 font-medium">Card ${this.flashcardIndex + 1} / ${words.length}</span>
            <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div class="h-full bg-indigo-600 transition-all" style="width: ${((this.flashcardIndex + 1) / words.length) * 100}%"></div>
            </div>
          </div>
        </div>
        
        <!-- Flashcard -->
        <div id="flashcard" 
          onclick="worvox.flipFlashcard()" 
          class="relative bg-white rounded-2xl shadow-2xl p-8 md:p-12 cursor-pointer hover:shadow-3xl transition-all min-h-[400px] flex items-center justify-center border-4 border-indigo-100">
          <div id="flashcard-front" class="text-center">
            <div class="text-4xl md:text-5xl font-bold text-gray-800 mb-4">${this.escapeHtml(word.word)}</div>
            ${word.pronunciation ? `
              <div class="text-lg text-gray-500 italic mb-6">${this.escapeHtml(word.pronunciation)}</div>
            ` : ''}
            <div class="text-gray-400 text-sm mt-8">
              <i class="fas fa-sync-alt mr-2"></i>Click to flip
            </div>
          </div>
        </div>
        
        <!-- Controls -->
        <div class="mt-6 flex items-center justify-between">
          <button onclick="worvox.previousFlashcard()" 
            class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors ${this.flashcardIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
            ${this.flashcardIndex === 0 ? 'disabled' : ''}>
            <i class="fas fa-arrow-left mr-2"></i>Previous
          </button>
  
          <div class="flex items-center gap-2">
            ${this.currentUser ? `
              <button onclick="worvox.toggleBookmark(${word.id}, ${isBookmarked})" 
                class="p-3 text-2xl ${isBookmarked ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500 transition-colors">
                <i class="fas fa-star"></i>
              </button>
              <button onclick="worvox.toggleLearnedStatus(${word.id}, ${!isLearned})" 
                class="px-4 py-2 ${isLearned ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg font-semibold hover:opacity-80 transition-opacity">
                ${isLearned ? '✓ Learned' : 'Mark Learned'}
              </button>
            ` : ''}
            <button onclick="worvox.playPronunciation('${this.escapeHtml(word.word)}')" 
              class="p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
              <i class="fas fa-volume-up"></i>
            </button>
          </div>
  
          <button onclick="worvox.nextFlashcard()" 
            class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors ${this.flashcardIndex >= words.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}"
            ${this.flashcardIndex >= words.length - 1 ? 'disabled' : ''}>
            Next<i class="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>
    `;
  }
  
  // Quiz Mode (will use existing quiz implementation)
  renderQuizMode(words, difficulty) {
    if (!words || words.length === 0) {
      return `
        <div class="max-w-3xl mx-auto">
          <div class="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div class="text-6xl mb-4">📖</div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">No Vocabulary Yet</h3>
            <p class="text-gray-600">Add some vocabulary words first!</p>
          </div>
        </div>
      `;
    }

    // Initialize quiz if not already initialized
    if (!this.quizData) {
      const shuffledWords = [...words].sort(() => Math.random() - 0.5);
      const selectedWords = shuffledWords.slice(0, Math.min(10, words.length));
      
      this.quizData = {
        questions: selectedWords.map(word => {
          // Get other words for wrong options
          const otherWords = words.filter(w => w.id !== word.id);
          const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
          const wrongOptions = shuffledOthers.slice(0, 3).map(w => w.meaning_ko);
          
          // Combine correct answer with wrong options and shuffle
          const options = [word.meaning_ko, ...wrongOptions].sort(() => Math.random() - 0.5);
          
          return {
            word: word,
            options: options,
            userAnswer: null,
            isCorrect: null
          };
        }),
        currentIndex: 0,
        score: 0,
        finished: false
      };
    }

    const quiz = this.quizData;
    
    if (quiz.finished) {
      return this.renderQuizResults();
    }

    const question = quiz.questions[quiz.currentIndex];
    const word = question.word;

    return `
      <div class="max-w-3xl mx-auto">
        <!-- Quiz Progress -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-600 font-semibold">Question ${quiz.currentIndex + 1} / ${quiz.questions.length}</span>
            <span class="text-indigo-600 font-bold text-lg">Score: ${quiz.score} / ${quiz.currentIndex}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div class="bg-indigo-600 h-3 rounded-full transition-all" style="width: ${(quiz.currentIndex / quiz.questions.length) * 100}%"></div>
          </div>
        </div>

        <!-- Question Card -->
        <div class="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div class="text-center mb-8">
            <h2 class="text-5xl font-bold text-indigo-600 mb-4">${this.escapeHtml(word.word)}</h2>
            <button onclick="worvox.playPronunciation('${this.escapeHtml(word.word)}')" 
              class="p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
              <i class="fas fa-volume-up text-xl"></i>
            </button>
          </div>

          <p class="text-gray-700 text-xl mb-8 text-center font-medium">이 단어의 뜻은 무엇일까요?</p>

          <!-- Options -->
          <div class="space-y-3">
            ${question.options.map((option, index) => {
              const isSelected = question.userAnswer === option;
              const isCorrect = option === word.meaning_ko;
              let buttonClass = 'bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-indigo-400';
              let iconHtml = '';
              
              if (question.userAnswer !== null) {
                if (isCorrect) {
                  buttonClass = 'bg-green-50 border-2 border-green-500';
                  iconHtml = '<i class="fas fa-check-circle text-green-600 text-2xl"></i>';
                } else if (isSelected) {
                  buttonClass = 'bg-red-50 border-2 border-red-500';
                  iconHtml = '<i class="fas fa-times-circle text-red-600 text-2xl"></i>';
                }
              }
              
              return `
                <button 
                  onclick="worvox.selectQuizAnswer('${this.escapeHtml(option)}')"
                  ${question.userAnswer !== null ? 'disabled' : ''}
                  class="w-full p-5 ${buttonClass} rounded-xl transition-all text-left flex items-center justify-between group ${question.userAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer'}">
                  <span class="text-lg font-medium text-gray-800">${this.escapeHtml(option)}</span>
                  ${iconHtml}
                </button>
              `;
            }).join('')}
          </div>

          ${question.userAnswer !== null ? `
            <div class="mt-6 p-4 ${question.isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'} rounded-xl">
              <p class="text-lg font-semibold mb-2 ${question.isCorrect ? 'text-green-800' : 'text-red-800'}">
                ${question.isCorrect ? '✓ 정답입니다!' : '✗ 틀렸습니다'}
              </p>
              ${word.example_sentence ? `
                <p class="text-gray-700 text-sm italic">"${this.escapeHtml(word.example_sentence)}"</p>
              ` : ''}
            </div>
            
            <button 
              onclick="worvox.nextQuizQuestion()"
              class="w-full mt-4 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-all">
              ${quiz.currentIndex < quiz.questions.length - 1 ? 'Next Question →' : 'Show Results 🎉'}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  flipFlashcard() {
    const flashcard = document.getElementById('flashcard');
    const frontDiv = document.getElementById('flashcard-front');
    
    if (!this.flashcardFlipped) {
      // Show back
      const response = JSON.parse(document.getElementById('app').dataset.vocabularyData);
      const words = response.words;
      const word = words[this.flashcardIndex];
      
      frontDiv.innerHTML = `
        <div class="text-center">
          <h2 class="text-4xl font-bold text-gray-800 mb-4">${this.escapeHtml(word.meaning_ko)}</h2>
          ${word.example_sentence ? `
            <div class="mt-6 p-4 bg-gray-50 rounded-lg">
              <p class="text-gray-600 text-sm mb-2">예문:</p>
              <p class="text-gray-800 italic">${this.escapeHtml(word.example_sentence)}</p>
            </div>
          ` : ''}
          <p class="mt-8 text-gray-500 text-sm">클릭하여 영어 단어 보기</p>
        </div>
      `;
      this.flashcardFlipped = true;
    } else {
      // Show front
      const response = JSON.parse(document.getElementById('app').dataset.vocabularyData);
      const words = response.words;
      const word = words[this.flashcardIndex];
      
      frontDiv.innerHTML = `
        <h2 class="text-5xl font-bold text-indigo-600 mb-4">${this.escapeHtml(word.word)}</h2>
        <div class="flex items-center justify-center gap-2">
          <span class="inline-block px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full">
            ${this.escapeHtml(word.part_of_speech)}
          </span>
          ${word.toeic_related ? `
          <span class="inline-block px-2 py-1 bg-amber-100 text-amber-700 text-sm font-semibold rounded">
            TOEIC
          </span>
          ` : ''}
          ${word.toefl_related ? `
          <span class="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded">
            TOEFL
          </span>
          ` : ''}
        </div>
        <p class="mt-8 text-gray-500 text-sm">클릭하여 뜻 보기</p>
      `;
      this.flashcardFlipped = false;
    }
  }

  async pronounceFlashcardWord(word) {
    try {
      const response = await axios.post('/api/tts/speak', {
        text: word,
        voice: 'nova'
      }, {
        responseType: 'arraybuffer'
      });

      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      await audio.play();
    } catch (error) {
      console.error('Error playing pronunciation:', error);
    }
  }

  async nextFlashcard() {
    const response = JSON.parse(document.getElementById('app').dataset.vocabularyData);
    const words = response.words;
    
    if (this.flashcardIndex < words.length - 1) {
      this.flashcardIndex++;
      this.flashcardFlipped = false;
      // Only update the flashcard content, not the entire page
      this.updateFlashcardContent(response.words);
    }
  }

  async previousFlashcard() {
    if (this.flashcardIndex > 0) {
      this.flashcardIndex--;
      this.flashcardFlipped = false;
      // Only update the flashcard content, not the entire page
      const response = JSON.parse(document.getElementById('app').dataset.vocabularyData);
      this.updateFlashcardContent(response.words);
    }
  }

  updateFlashcardContent(words) {
    const response = JSON.parse(document.getElementById('app').dataset.vocabularyData);
    const allWords = response.words || words;
    const word = allWords[this.flashcardIndex];
    
    // Get user progress
    let progressData = {};
    let bookmarkedWords = [];
    const isLearned = progressData[word.id]?.is_learned === 1;
    const isBookmarked = bookmarkedWords.includes(word.id);
    
    // Update flashcard content only
    const flashcardContainer = document.querySelector('.max-w-2xl.mx-auto');
    if (flashcardContainer) {
      flashcardContainer.innerHTML = `
        <!-- Progress Indicator -->
        <div class="mb-6 text-center">
          <div class="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-sm">
            <span class="text-gray-600 font-medium">Card ${this.flashcardIndex + 1} / ${allWords.length}</span>
            <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div class="h-full bg-indigo-600 transition-all" style="width: ${((this.flashcardIndex + 1) / allWords.length) * 100}%"></div>
            </div>
          </div>
        </div>
        
        <!-- Flashcard -->
        <div id="flashcard" 
          onclick="worvox.flipFlashcard()" 
          class="relative bg-white rounded-2xl shadow-2xl p-8 md:p-12 cursor-pointer hover:shadow-3xl transition-all min-h-[400px] flex items-center justify-center border-4 border-indigo-100">
          <div id="flashcard-front" class="text-center">
            <div class="text-4xl md:text-5xl font-bold text-gray-800 mb-4">${this.escapeHtml(word.word)}</div>
            ${word.pronunciation ? `
              <div class="text-lg text-gray-500 italic mb-6">${this.escapeHtml(word.pronunciation)}</div>
            ` : ''}
            <div class="text-gray-400 text-sm mt-8">
              <i class="fas fa-sync-alt mr-2"></i>Click to flip
            </div>
          </div>
        </div>
        
        <!-- Controls -->
        <div class="mt-6 flex items-center justify-between">
          <button onclick="worvox.previousFlashcard()" 
            class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors ${this.flashcardIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
            ${this.flashcardIndex === 0 ? 'disabled' : ''}>
            <i class="fas fa-arrow-left mr-2"></i>Previous
          </button>

          <div class="flex items-center gap-2">
            ${this.currentUser ? `
              <button onclick="worvox.toggleBookmark(${word.id}, ${isBookmarked})" 
                class="p-3 text-2xl ${isBookmarked ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500 transition-colors">
                <i class="fas fa-star"></i>
              </button>
              <button onclick="worvox.toggleLearnedStatus(${word.id}, ${!isLearned})" 
                class="px-4 py-2 ${isLearned ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg font-semibold hover:opacity-80 transition-opacity">
                ${isLearned ? '✓ Learned' : 'Mark Learned'}
              </button>
            ` : ''}
            <button onclick="worvox.playPronunciation('${this.escapeHtml(word.word)}')" 
              class="p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
              <i class="fas fa-volume-up"></i>
            </button>
          </div>

          <button onclick="worvox.nextFlashcard()" 
            class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors ${this.flashcardIndex >= allWords.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}"
            ${this.flashcardIndex >= allWords.length - 1 ? 'disabled' : ''}>
            Next<i class="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      `;
    }
  }



  async selectQuizAnswer(answer) {
    const question = this.quizData.questions[this.quizData.currentIndex];
    
    if (question.userAnswer !== null) return; // Already answered
    
    question.userAnswer = answer;
    question.isCorrect = (answer === question.word.meaning_ko);
    
    if (question.isCorrect) {
      this.quizData.score++;
      
      // Award XP for correct answer
      if (typeof gamificationManager !== 'undefined' && this.currentUser) {
        await gamificationManager.addXP(
          this.currentUser.id,
          15, // 15 XP per correct answer
          'quiz_correct',
          `Correct answer for word: ${question.word.word}`
        );
      }
    }
    
    // Update only the quiz content area, not the entire page
    this.updateQuizContent();
  }

  async nextQuizQuestion() {
    this.quizData.currentIndex++;
    
    if (this.quizData.currentIndex >= this.quizData.questions.length) {
      this.quizData.finished = true;
      
      // Award bonus XP for completing quiz
      if (typeof gamificationManager !== 'undefined' && this.currentUser) {
        await gamificationManager.addXP(
          this.currentUser.id,
          50, // 50 XP bonus for completing quiz
          'quiz_complete',
          `Completed quiz with score: ${this.quizData.score}/${this.quizData.questions.length}`
        );
      }
    }
    
    // Update only the quiz content area
    this.updateQuizContent();
  }

  updateQuizContent() {
    const contentArea = document.querySelector('.flex-1.overflow-y-auto.p-4.md\\:p-6');
    if (!contentArea) return;
    
    const response = JSON.parse(document.getElementById('app').dataset.vocabularyData);
    const words = response.words;
    
    contentArea.innerHTML = this.renderQuizMode(words, this.vocabularyDifficulty);
  }

  renderQuizResults() {
    const quiz = this.quizData;
    const percentage = Math.round((quiz.score / quiz.questions.length) * 100);
    let message = '';
    let emoji = '';
    
    if (percentage >= 90) {
      emoji = '🎉';
      message = '완벽해요! 정말 잘하셨어요!';
    } else if (percentage >= 70) {
      emoji = '👏';
      message = '잘했어요! 조금만 더 연습하면 완벽할 거예요!';
    } else if (percentage >= 50) {
      emoji = '💪';
      message = '괜찮아요! 계속 연습하세요!';
    } else {
      emoji = '📚';
      message = '더 열심히 공부해봐요!';
    }

    return `
      <div class="max-w-2xl mx-auto">
        <div class="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div class="text-8xl mb-6">${emoji}</div>
          <h2 class="text-3xl font-bold text-gray-800 mb-4">퀴즈 완료!</h2>
          <p class="text-xl text-gray-600 mb-8">${message}</p>
          
          <div class="grid grid-cols-3 gap-4 mb-8">
            <div class="bg-green-50 p-4 rounded-lg">
              <p class="text-gray-600 text-sm mb-1">정답</p>
              <p class="text-3xl font-bold text-green-600">${quiz.score}</p>
            </div>
            <div class="bg-red-50 p-4 rounded-lg">
              <p class="text-gray-600 text-sm mb-1">오답</p>
              <p class="text-3xl font-bold text-red-600">${quiz.questions.length - quiz.score}</p>
            </div>
            <div class="bg-indigo-50 p-4 rounded-lg">
              <p class="text-gray-600 text-sm mb-1">정답률</p>
              <p class="text-3xl font-bold text-indigo-600">${percentage}%</p>
            </div>
          </div>

          <div class="space-y-3">
            <button onclick="worvox.startNewQuiz()" 
              class="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors">
              <i class="fas fa-forward mr-2"></i>Next Quiz (새로운 단어)
            </button>
            <button onclick="worvox.restartQuiz()" 
              class="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors">
              <i class="fas fa-redo mr-2"></i>다시 풀기 (같은 단어)
            </button>
            <button onclick="worvox.showVocabulary('list')" 
              class="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors">
              <i class="fas fa-list mr-2"></i>단어 목록으로
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async restartQuiz() {
    this.quizData = null;
    this.flashcardIndex = 0;
    await this.showVocabulary('quiz');
  }

  async startNewQuiz() {
    // Reset quiz data to generate new questions with different words
    this.quizData = null;
    this.flashcardIndex = 0;
    
    // Mark that we want new words (not just resetting the same quiz)
    this.quizNeedsNewWords = true;
    
    await this.showVocabulary('quiz');
  }

  // History feature
  async showHistory() {
    try {
      // Load user from localStorage if not in memory
      if (!this.currentUser) {
        const storedUser = localStorage.getItem('worvox_user');
        if (storedUser) {
          this.currentUser = JSON.parse(storedUser);
        }
      }
      
      // Ensure user is logged in
      if (!this.currentUser || !this.currentUser.id) {
        
        this.showLogin();
        return;
      }
      
      const response = await axios.get(`/api/history/sessions/${this.currentUser.id}`);
      const sessions = response.data.sessions;
      
      // Group sessions by type
      // Special topic IDs: 997 = Exam Mode, 998 = Scenario Mode, 999 = Timer Mode
      const aiConversations = sessions.filter(s => {
        return s.topic_id !== 997 && s.topic_id !== 998 && s.topic_id !== 999;
      });
      const timerSessions = sessions.filter(s => {
        return s.topic_id === 999;
      });
      const scenarioSessions = sessions.filter(s => {
        return s.topic_id === 998;
      });
      const examSessions = sessions.filter(s => {
        return s.topic_id === 997;
      });

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
          <!-- Sidebar -->
          ${this.getSidebar('history')}
          
          <!-- Main Content -->
          <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Header -->
            <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
              <div class="flex items-center gap-2">
                <button onclick="worvox.showTopicSelection()" 
                  class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
                  <i class="fas fa-arrow-left text-xl"></i>
                </button>
                <div>
                  <h1 class="text-lg md:text-2xl font-bold text-gray-800">📚 학습 기록</h1>
                  <p class="hidden md:block text-gray-600 text-sm mt-1">AI 대화, 타이머, 시나리오, 시험 모드 기록을 확인하세요</p>
                </div>
              </div>
            </div>

            <!-- Tabs -->
            <div class="bg-white border-b border-gray-200 px-2 md:px-6">
              <div class="flex gap-1 overflow-x-auto scrollbar-hide">
                <button onclick="worvox.showHistoryTab('ai', event)" 
                  class="history-tab active flex-shrink-0 px-2 md:px-4 py-3 text-xs md:text-sm font-semibold border-b-2 border-blue-600 text-blue-600">
                  <div class="flex flex-col items-center gap-1">
                    <i class="fas fa-comment text-lg md:text-base"></i>
                    <span class="text-[10px] md:text-sm">AI 대화</span>
                    <span class="text-[10px] md:text-xs text-gray-500">(${aiConversations.length})</span>
                  </div>
                </button>
                <button onclick="worvox.showHistoryTab('timer', event)" 
                  class="history-tab flex-shrink-0 px-2 md:px-4 py-3 text-xs md:text-sm font-semibold border-b-2 border-transparent text-gray-600 hover:text-gray-800">
                  <div class="flex flex-col items-center gap-1">
                    <i class="fas fa-stopwatch text-lg md:text-base"></i>
                    <span class="text-[10px] md:text-sm">타이머</span>
                    <span class="text-[10px] md:text-xs text-gray-500">(${timerSessions.length})</span>
                  </div>
                </button>
                <button onclick="worvox.showHistoryTab('scenario', event)" 
                  class="history-tab flex-shrink-0 px-2 md:px-4 py-3 text-xs md:text-sm font-semibold border-b-2 border-transparent text-gray-600 hover:text-gray-800">
                  <div class="flex flex-col items-center gap-1">
                    <i class="fas fa-film text-lg md:text-base"></i>
                    <span class="text-[10px] md:text-sm">시나리오</span>
                    <span class="text-[10px] md:text-xs text-gray-500">(${scenarioSessions.length})</span>
                  </div>
                </button>
                <button onclick="worvox.showHistoryTab('exam', event)" 
                  class="history-tab flex-shrink-0 px-2 md:px-4 py-3 text-xs md:text-sm font-semibold border-b-2 border-transparent text-gray-600 hover:text-gray-800">
                  <div class="flex flex-col items-center gap-1">
                    <i class="fas fa-graduation-cap text-lg md:text-base"></i>
                    <span class="text-[10px] md:text-sm">시험</span>
                    <span class="text-[10px] md:text-xs text-gray-500">(${examSessions.length})</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Content Area -->
            <div class="flex-1 overflow-y-auto p-4 md:p-6">
              <div class="max-w-4xl mx-auto">
                
                <!-- AI Conversation Tab -->
                <div id="historyTab-ai" class="history-tab-content">
                  ${aiConversations.length === 0 ? `
                    <div class="bg-white rounded-2xl shadow-sm p-12 text-center">
                      <div class="text-6xl mb-4">💬</div>
                      <h3 class="text-xl font-bold text-gray-800 mb-2">AI 대화 기록이 없습니다</h3>
                      <p class="text-gray-600 mb-6">AI와 대화를 시작하고 학습 기록을 만들어보세요!</p>
                      <button onclick="worvox.startConversation()" 
                        class="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all">
                        AI 대화 시작하기
                      </button>
                    </div>
                  ` : `
                    <div class="bg-white rounded-2xl shadow-sm p-6">
                      <h2 class="text-xl font-bold text-gray-800 mb-4">AI 대화 기록 (${aiConversations.length})</h2>
                      <div class="space-y-4">
                        ${this.groupSessionsByDate(aiConversations)}
                      </div>
                    </div>
                  `}
                </div>
                
                <!-- Timer Mode Tab -->
                <div id="historyTab-timer" class="history-tab-content hidden">
                  ${timerSessions.length === 0 ? `
                    <div class="bg-white rounded-2xl shadow-sm p-12 text-center">
                      <div class="text-6xl mb-4">⏱️</div>
                      <h3 class="text-xl font-bold text-gray-800 mb-2">타이머 모드 기록이 없습니다</h3>
                      <p class="text-gray-600 mb-6">타이머 모드로 압박 훈련을 시작해보세요!</p>
                      <button onclick="worvox.showTimerMode()" 
                        class="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-all">
                        타이머 모드 시작하기
                      </button>
                    </div>
                  ` : `
                    <div class="bg-white rounded-2xl shadow-sm p-6">
                      <h2 class="text-xl font-bold text-gray-800 mb-4">타이머 모드 기록 (${timerSessions.length})</h2>
                      <div class="space-y-4">
                        ${this.groupSessionsByDate(timerSessions)}
                      </div>
                    </div>
                  `}
                </div>
                
                <!-- Scenario Mode Tab -->
                <div id="historyTab-scenario" class="history-tab-content hidden">
                  ${scenarioSessions.length === 0 ? `
                    <div class="bg-white rounded-2xl shadow-sm p-12 text-center">
                      <div class="text-6xl mb-4">🎬</div>
                      <h3 class="text-xl font-bold text-gray-800 mb-2">시나리오 모드 기록이 없습니다</h3>
                      <p class="text-gray-600 mb-6">30가지 실전 상황 대화를 연습해보세요!</p>
                      <button onclick="worvox.showScenarioMode()" 
                        class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all">
                        시나리오 모드 시작하기
                      </button>
                    </div>
                  ` : `
                    <div class="bg-white rounded-2xl shadow-sm p-6">
                      <h2 class="text-xl font-bold text-gray-800 mb-4">시나리오 모드 기록 (${scenarioSessions.length})</h2>
                      <div class="space-y-4">
                        ${this.groupSessionsByDate(scenarioSessions)}
                      </div>
                    </div>
                  `}
                </div>
                
                <!-- Exam Mode Tab -->
                <div id="historyTab-exam" class="history-tab-content hidden">
                  ${examSessions.length === 0 ? `
                    <div class="bg-white rounded-2xl shadow-sm p-12 text-center">
                      <div class="text-6xl mb-4">🎓</div>
                      <h3 class="text-xl font-bold text-gray-800 mb-2">시험 모드 기록이 없습니다</h3>
                      <p class="text-gray-600 mb-6">OPIC 스타일 말하기 시험을 연습해보세요!</p>
                      <button onclick="worvox.showExamMode()" 
                        class="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-semibold transition-all">
                        시험 모드 시작하기
                      </button>
                    </div>
                  ` : `
                    <div class="bg-white rounded-2xl shadow-sm p-6">
                      <h2 class="text-xl font-bold text-gray-800 mb-4">시험 모드 기록 (${examSessions.length})</h2>
                      <div class="space-y-4">
                        ${this.groupSessionsByDate(examSessions)}
                      </div>
                    </div>
                  `}
                </div>
                
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading history:', error);
      alert('Failed to load history. Please try again.');
    }
  }
  
  // Show specific history tab
  showHistoryTab(tabName, event) {
    // Update tab buttons
    const tabs = document.querySelectorAll('.history-tab');
    tabs.forEach(tab => {
      tab.classList.remove('active', 'border-blue-600', 'text-blue-600');
      tab.classList.add('border-transparent', 'text-gray-600');
    });
    
    // Get the clicked button
    const clickedTab = event ? event.target.closest('.history-tab') : document.querySelector('.history-tab.active');
    if (clickedTab) {
      clickedTab.classList.add('active', 'border-blue-600', 'text-blue-600');
      clickedTab.classList.remove('border-transparent', 'text-gray-600');
    }
    
    // Update content
    const contents = document.querySelectorAll('.history-tab-content');
    contents.forEach(content => content.classList.add('hidden'));
    const targetContent = document.getElementById(`historyTab-${tabName}`);
    if (targetContent) {
      targetContent.classList.remove('hidden');
    }
  }

  groupSessionsByDate(sessions) {
    // Group sessions by date
    const grouped = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.started_at);
      const dateOnly = new Date(sessionDate);
      dateOnly.setHours(0, 0, 0, 0);
      
      // Format date in English
      const dateLabel = sessionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      });
      
      if (!grouped[dateLabel]) {
        grouped[dateLabel] = [];
      }
      grouped[dateLabel].push(session);
    });

    // Generate HTML
    let html = '';
    for (const [date, dateSessions] of Object.entries(grouped)) {
      html += `
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-700 mb-3 flex items-center">
            <i class="fas fa-calendar-day mr-2 text-indigo-600"></i>${date}
          </h3>
          <div class="space-y-3">
            ${dateSessions.map(session => this.renderSessionCard(session)).join('')}
          </div>
        </div>
      `;
    }
    
    return html;
  }

  renderSessionCard(session) {
    const sessionDate = new Date(session.started_at);
    
    // Format time in English (12-hour format with AM/PM)
    const startTime = sessionDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    const duration = session.ended_at 
      ? Math.round((new Date(session.ended_at) - sessionDate) / 1000 / 60)
      : 'In progress';
    
    // Set proper names and icons for special modes
    let topicName = session.topic_name || 'Conversation';
    let topicIcon = session.topic_icon || '📚';
    let topicDescription = session.topic_description || '';
    
    if (session.topic_id === 999) {
      topicName = '⏱️ 타이머 모드';
      topicIcon = '⏱️';
      topicDescription = '시간 제한 압박 훈련';
    } else if (session.topic_id === 998) {
      topicName = '🎬 시나리오 모드';
      topicIcon = '🎬';
      topicDescription = '실전 상황 대화 연습';
    } else if (session.topic_id === 997) {
      topicName = '🎓 시험 모드';
      topicIcon = '🎓';
      topicDescription = 'OPIC 스타일 말하기 시험';
    }
    
    // Determine click handler based on mode
    const isSpecialMode = [997, 998, 999].includes(session.topic_id);
    const clickHandler = isSpecialMode 
      ? `worvox.showSessionReportById(${session.id})`
      : `worvox.showConversation(${session.id})`;
    
    return `
      <div class="border-2 border-gray-200 rounded-xl p-3 md:p-4 hover:border-indigo-500 transition-all">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <!-- Main content area -->
          <div class="flex-1 cursor-pointer" onclick="${clickHandler}">
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <span class="text-2xl">${topicIcon}</span>
              <h4 class="text-base md:text-lg font-bold text-gray-800">${topicName}</h4>
              ${session.has_report ? '<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">✓ 분석완료</span>' : ''}
            </div>
            <div class="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600 flex-wrap">
              <span><i class="fas fa-clock mr-1"></i>${startTime}</span>
              <span><i class="fas fa-hourglass-half mr-1"></i>${duration}${typeof duration === 'number' ? ' min' : ''}</span>
              <span><i class="fas fa-comment mr-1"></i>${session.message_count} messages</span>
              <span class="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                ${session.level}
              </span>
            </div>
            ${topicDescription ? `
              <p class="text-gray-600 text-xs md:text-sm mt-2">${topicDescription}</p>
            ` : ''}
          </div>
          
          <!-- Button area - full width on mobile, right side on desktop -->
          <div class="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 w-full md:w-auto">
            ${(session.has_report || isSpecialMode) ? `
              <button 
                onclick="event.stopPropagation(); worvox.showSessionReportById(${session.id})"
                class="flex-1 md:flex-none px-3 md:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap">
                📊 리포트 보기
              </button>
            ` : ''}
            <i class="fas fa-chevron-right text-gray-400 md:mt-2"></i>
          </div>
        </div>
      </div>
    `;
  }

  async showConversation(sessionId) {
    try {
      const response = await axios.get(`/api/history/conversation/${sessionId}`);
      const { session, messages } = response.data;

      const sessionDate = new Date(session.started_at);
      const startTime = sessionDate.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="min-h-screen p-4 md:p-8">
          <div class="max-w-4xl mx-auto">
            <!-- Header -->
            <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <button onclick="worvox.showHistory()" 
                class="text-indigo-600 hover:text-indigo-800 transition-colors mb-4">
                <i class="fas fa-arrow-left mr-2"></i>Back to History
              </button>
              
              <div class="flex items-start gap-4">
                <span class="text-4xl">${session.topic_icon || '📚'}</span>
                <div class="flex-1">
                  <h1 class="text-2xl font-bold text-gray-800 mb-2">${session.topic_name}</h1>
                  <div class="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                    <span><i class="fas fa-user mr-1"></i>${session.username}</span>
                    <span><i class="fas fa-calendar mr-1"></i>${startTime}</span>
                    <span><i class="fas fa-comment mr-1"></i>${messages.length} messages</span>
                    <span class="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                      ${session.level}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Conversation -->
            <div class="bg-white rounded-2xl shadow-lg p-6">
              <h2 class="text-xl font-bold text-gray-800 mb-6">Conversation</h2>
              
              ${messages.length === 0 ? `
                <div class="text-center py-12 text-gray-500">
                  <i class="fas fa-comment-slash text-4xl mb-4"></i>
                  <p>No messages in this conversation</p>
                </div>
              ` : `
                <div class="space-y-4">
                  ${messages.map(msg => this.renderHistoryMessage(msg)).join('')}
                </div>
              `}
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading conversation:', error);
      alert('Failed to load conversation. Please try again.');
    }
  }

  renderHistoryMessage(message) {
    const messageDate = new Date(message.created_at);
    const time = messageDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const isUser = message.role === 'user';
    const messageId = `history-msg-${message.id}`;
    
    return `
      <div class="flex ${isUser ? 'justify-end' : 'justify-start'}">
        <div class="max-w-xs md:max-w-md lg:max-w-lg">
          <div class="inline-block px-4 py-3 rounded-2xl ${
            isUser 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-200 text-gray-800'
          }">
            <p class="text-sm md:text-base">${this.escapeHtml(message.content)}</p>
            ${!isUser ? `
              <div class="mt-2">
                <button 
                  onclick="worvox.playHistoryMessage('${this.escapeHtml(message.content)}', '${messageId}')" 
                  id="${messageId}"
                  class="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition-colors">
                  <i class="fas fa-redo"></i>
                  <span>다시 듣기</span>
                </button>
              </div>
            ` : ''}
          </div>
          <p class="text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}">${time}</p>
        </div>
      </div>
    `;
  }

  async playHistoryMessage(text, buttonId) {
    const btn = document.getElementById(buttonId);
    
    try {
      // Update button state
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>재생 중...</span>';
      }
      
      // Call TTS API
      const response = await axios.post('/api/tts/speak', {
        text: text,
        voice: 'nova'
      }, {
        responseType: 'arraybuffer'
      });

      // Play audio
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (this.currentAudio) {
        this.currentAudio.pause();
      }
      
      this.currentAudio = new Audio(audioUrl);
      
      this.currentAudio.onended = () => {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-redo"></i><span>다시 듣기</span>';
        }
        URL.revokeObjectURL(audioUrl);
      };
      
      this.currentAudio.onerror = () => {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>오류</span>';
          setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-redo"></i><span>다시 듣기</span>';
          }, 2000);
        }
      };
      
      await this.currentAudio.play();
    } catch (error) {
      console.error('Error playing history message:', error);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>오류</span>';
        setTimeout(() => {
          btn.innerHTML = '<i class="fas fa-redo"></i><span>다시 듣기</span>';
        }, 2000);
      }
    }
  }

  // Shuffle array using Fisher-Yates algorithm
  shuffleArray(array) {
    const shuffled = [...array]; // Create a copy
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Show Plan/Pricing Page
  showPlan() {
    // Load user from localStorage if not in memory
    if (!this.currentUser) {
      const storedUser = localStorage.getItem('worvox_user');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }
    }
    
    // Ensure user is logged in
    if (!this.currentUser || !this.currentUser.id) {
      
      this.showLogin();
      return;
    }
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
        <!-- Sidebar -->
        ${this.getSidebar('plan')}
        
        <!-- Main Content -->
        <div class="flex-1 overflow-y-auto">
          <!-- Header -->
          <div class="bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-6">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-2xl md:text-3xl font-bold text-gray-800">💎 요금제</h1>
                <p class="text-gray-600 mt-1">WorVox와 함께 영어 실력을 향상시키세요</p>
              </div>
            </div>
          </div>
          
          <!-- Pricing Cards -->
          <div class="max-w-7xl mx-auto px-4 py-8 md:py-12">
            <!-- 7-day Free Trial Banner -->
            <div class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl p-6 mb-8 text-center">
              <h2 class="text-2xl font-bold mb-2">🎉 7일 무료 체험</h2>
              <p class="text-emerald-50">Premium과 Business 플랜을 7일간 무료로 체험해보세요!</p>
            </div>
            
            <!-- Pricing Cards Grid -->
            <div class="grid md:grid-cols-3 gap-6 md:gap-8">
              <!-- Free Plan -->
              <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8 border-2 border-gray-200 hover:border-gray-300 transition-all">
                <div class="text-center mb-6">
                  <div class="text-4xl mb-3">💚</div>
                  <h3 class="text-2xl font-bold text-gray-800 mb-2">Free</h3>
                  <div class="text-4xl font-bold text-gray-900 mb-2">₩0</div>
                  <p class="text-gray-500 text-sm">영원히 무료</p>
                </div>
                
                <ul class="space-y-3 mb-8">
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-green-600 mt-1"></i>
                    <span class="text-gray-700">AI 영어 대화 <strong>하루 5회</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-green-600 mt-1"></i>
                    <span class="text-gray-700">단어장 전체 레벨</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-green-600 mt-1"></i>
                    <span class="text-gray-700">Flashcard & Quiz 무제한</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-green-600 mt-1"></i>
                    <span class="text-gray-700">발음 연습 <strong>하루 10회</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-green-600 mt-1"></i>
                    <span class="text-gray-700">XP/레벨 시스템</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-times text-gray-300 mt-1"></i>
                    <span class="text-gray-400">학습 분석 리포트</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-times text-gray-300 mt-1"></i>
                    <span class="text-gray-400">AI 상세 피드백</span>
                  </li>
                </ul>
                
                <button class="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all">
                  현재 플랜
                </button>
              </div>
              
              <!-- Premium Plan -->
              <div class="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border-4 border-emerald-500 relative transform md:scale-105">
                <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white px-6 py-1 rounded-full text-sm font-bold">
                  인기
                </div>
                
                <div class="text-center mb-6">
                  <div class="text-4xl mb-3">⭐</div>
                  <h3 class="text-2xl font-bold text-gray-800 mb-2">Premium</h3>
                  <div class="text-4xl font-bold text-emerald-600 mb-2">₩9,900</div>
                  <p class="text-gray-500 text-sm">/월</p>
                </div>
                
                <ul class="space-y-3 mb-8">
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700"><strong>AI 영어 대화 무제한</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700">단어장 전체 레벨</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700">Flashcard & Quiz 무제한</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700"><strong>발음 연습 무제한</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700">XP/레벨 시스템</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700"><strong>학습 분석 리포트 (주간/월간)</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700"><strong>AI 상세 피드백</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700">개인 맞춤 학습</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700">광고 제거</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700"><strong>Real Conversation 15% 할인</strong></span>
                  </li>
                </ul>
                
                <button onclick="worvox.upgradePlan('premium')" class="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all shadow-lg">
                  7일 무료 체험 시작
                </button>
              </div>
              
              <!-- Business Plan -->
              <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8 border-2 border-indigo-200 hover:border-indigo-300 transition-all">
                <div class="text-center mb-6">
                  <div class="text-4xl mb-3">🏢</div>
                  <h3 class="text-2xl font-bold text-gray-800 mb-2">Business</h3>
                  <div class="text-4xl font-bold text-indigo-600 mb-2">₩32,000</div>
                  <p class="text-gray-500 text-sm">/월/인</p>
                </div>
                
                <ul class="space-y-3 mb-8">
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-indigo-600 mt-1"></i>
                    <span class="text-gray-700"><strong>Premium 전체 기능</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-indigo-600 mt-1"></i>
                    <span class="text-gray-700"><strong>실시간 학습 대시보드</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-indigo-600 mt-1"></i>
                    <span class="text-gray-700"><strong>팀 관리 기능</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-indigo-600 mt-1"></i>
                    <span class="text-gray-700"><strong>전담 매니저</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-indigo-600 mt-1"></i>
                    <span class="text-gray-700"><strong>Real Conversation 25% 할인</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-indigo-600 mt-1"></i>
                    <span class="text-gray-700"><strong>5인 이상 추가 20% 할인</strong></span>
                  </li>
                </ul>
                
                <button onclick="worvox.contactSales()" class="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all">
                  영업팀 문의하기
                </button>
              </div>
            </div>
            
            <!-- Feature Comparison Table -->
            <div class="mt-12 bg-white rounded-2xl shadow-lg overflow-hidden">
              <div class="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-4">
                <h3 class="text-xl font-bold">기능 상세 비교</h3>
              </div>
              
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">기능</th>
                      <th class="px-6 py-4 text-center text-sm font-semibold text-gray-700">Free</th>
                      <th class="px-6 py-4 text-center text-sm font-semibold text-emerald-700">Premium</th>
                      <th class="px-6 py-4 text-center text-sm font-semibold text-indigo-700">Business</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <!-- 핵심 학습 기능 -->
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 font-semibold" colspan="4">
                        <i class="fas fa-graduation-cap mr-2 text-blue-600"></i>핵심 학습 기능
                      </td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">AI 영어 대화</td>
                      <td class="px-6 py-4 text-center text-sm">하루 5회</td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600 font-semibold">무제한</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600 font-semibold">무제한</td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">발음 연습</td>
                      <td class="px-6 py-4 text-center text-sm">하루 10회</td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600 font-semibold">무제한</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600 font-semibold">무제한</td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">단어 검색 (AI 생성)</td>
                      <td class="px-6 py-4 text-center text-sm">하루 10회</td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600 font-semibold">무제한</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600 font-semibold">무제한</td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">대화 주제</td>
                      <td class="px-6 py-4 text-center text-sm">기본 2개</td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600 font-semibold">전체 (10개+)</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600 font-semibold">전체 + 커스텀</td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">대화 히스토리 저장</td>
                      <td class="px-6 py-4 text-center text-sm">최근 10개</td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600 font-semibold">무제한</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600 font-semibold">무제한</td>
                    </tr>
                    
                    <!-- 단어장 & 학습 도구 -->
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 font-semibold" colspan="4">
                        <i class="fas fa-book mr-2 text-purple-600"></i>단어장 & 학습 도구
                      </td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">단어장 (전체 레벨)</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">Flashcard & Quiz</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">단어 북마크</td>
                      <td class="px-6 py-4 text-center text-sm">최대 50개</td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600 font-semibold">무제한</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600 font-semibold">무제한</td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">나만의 단어장</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    
                    <!-- 분석 & 피드백 -->
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 font-semibold" colspan="4">
                        <i class="fas fa-chart-line mr-2 text-green-600"></i>분석 & 피드백
                      </td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">기본 학습 통계</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">학습 분석 리포트</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600">주간/월간</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600">실시간 대시보드</td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">AI 상세 피드백</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">문법 오류 분석</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">발음 개선 제안</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">개인 맞춤 학습 플랜</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    
                    <!-- 게임화 & 보상 -->
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 font-semibold" colspan="4">
                        <i class="fas fa-trophy mr-2 text-yellow-600"></i>게임화 & 보상
                      </td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">XP/레벨 시스템</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">배지 & 업적</td>
                      <td class="px-6 py-4 text-center text-sm">기본</td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600 font-semibold">전체</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600 font-semibold">전체 + 특별</td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">리더보드</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600">팀 전용</td>
                    </tr>
                    
                    <!-- Real Conversation -->
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 font-semibold" colspan="4">
                        <i class="fas fa-user-tie mr-2 text-red-600"></i>Real Conversation (1:1 원어민 수업)
                      </td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">수업 예약</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">수업 할인</td>
                      <td class="px-6 py-4 text-center text-sm">정가</td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600 font-semibold">20% 할인</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600 font-semibold">30% 할인</td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">우선 예약</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    
                    <!-- 기타 기능 -->
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 font-semibold" colspan="4">
                        <i class="fas fa-cog mr-2 text-gray-600"></i>기타 기능
                      </td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">광고 제거</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">오프라인 모드</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">우선 고객 지원</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600">이메일</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600">24시간 채팅</td>
                    </tr>
                    
                    <!-- Business 전용 -->
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 font-semibold" colspan="4">
                        <i class="fas fa-briefcase mr-2 text-indigo-600"></i>Business 전용
                      </td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">팀 관리 대시보드</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">팀원 학습 진도 추적</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">전담 학습 매니저</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">커스텀 학습 콘텐츠</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">API 접근 (기업 연동)</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">5인 이상 단체 할인</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600 font-semibold">추가 20% 할인</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <!-- Footer (inside padded content area) -->
            ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Upgrade to Premium
  upgradePlan(plan) {
    this.showPaymentPage(plan);
  }

  // Show payment page with billing cycle selection
  showPaymentPage(plan) {
    const planName = plan === 'premium' ? 'Premium' : 'Business';
    const monthlyPrice = plan === 'premium' ? 9900 : 32000;
    // Yearly payment option removed temporarily
    // const yearlyPrice = plan === 'premium' ? 95040 : 854400;
    // const yearlySavings = plan === 'premium' ? 23760 : 213600;
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
        <!-- Sidebar -->
        ${this.getSidebar('plan')}
        
        <!-- Main Content -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Mobile Header -->
          <div class="md:hidden bg-white border-b border-gray-200 px-4 py-3">
            <div class="flex items-center justify-between">
              <button onclick="worvox.showPlan()" class="text-gray-600">
                <i class="fas fa-arrow-left text-xl"></i>
              </button>
              <h1 class="text-lg font-semibold text-gray-800">${planName} 구독</h1>
              <div class="w-6"></div>
            </div>
          </div>
          
          <!-- Desktop Top Bar -->
          <div class="hidden md:flex bg-white border-b border-gray-200 px-6 py-3 items-center">
            <button onclick="worvox.showPlan()" class="text-gray-600 hover:text-gray-800 mr-4">
              <i class="fas fa-arrow-left text-xl"></i>
            </button>
            <h2 class="text-lg font-semibold text-gray-800">${planName} 플랜 구독</h2>
          </div>
          
          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto p-4 md:p-8">
            <div class="max-w-2xl mx-auto">
              <!-- Plan Info Card -->
              <div class="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 md:p-8 text-white mb-6">
                <div class="flex items-center gap-3 mb-4">
                  <i class="fas fa-crown text-3xl"></i>
                  <div>
                    <h2 class="text-2xl md:text-3xl font-bold">${planName} 플랜</h2>
                    <p class="text-emerald-100 mt-1">무제한 학습 + 고급 기능</p>
                  </div>
                </div>
                
                <div class="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2 inline-block">
                  <i class="fas fa-check-circle"></i>
                  <span class="font-medium">7일 무료 체험</span>
                </div>
              </div>
              
              <!-- TEMPORARY: Billing cycle selection removed (monthly only) -->
              <!-- Payment Summary -->
              <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">결제 정보</h3>
                
                <div class="space-y-3">
                  <div class="flex items-center justify-between py-2">
                    <span class="text-gray-700">${planName} 플랜</span>
                    <span class="font-semibold text-gray-900" id="planPrice">₩${monthlyPrice.toLocaleString()}</span>
                  </div>
                  <div class="flex items-center justify-between py-2">
                    <span class="text-gray-700">결제 주기</span>
                    <span class="font-medium text-gray-900" id="billingCycleText">월간</span>
                  </div>
                  <div class="flex items-center justify-between py-2 text-emerald-600">
                    <span class="flex items-center gap-2">
                      <i class="fas fa-gift"></i>
                      <span>7일 무료 체험</span>
                    </span>
                    <span class="font-semibold">-₩0</span>
                  </div>
                  
                  <div class="border-t border-gray-200 pt-3 mt-3">
                    <div class="flex items-center justify-between">
                      <span class="text-lg font-bold text-gray-900">오늘 결제 금액</span>
                      <span class="text-2xl font-bold text-emerald-600">₩0</span>
                    </div>
                    <p class="text-xs text-gray-500 mt-2">
                      * 7일 무료 체험 후 자동 결제됩니다
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Payment Method -->
              <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">결제 수단</h3>
                
                <div class="space-y-3">
                  <label class="flex items-center p-4 border-2 border-emerald-500 bg-emerald-50 rounded-xl cursor-pointer">
                    <input type="radio" name="paymentMethod" value="card" class="mr-4" checked>
                    <i class="fas fa-credit-card text-emerald-600 text-xl mr-3"></i>
                    <span class="font-semibold text-gray-900">신용/체크카드</span>
                  </label>
                  
                  <label class="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-emerald-500 transition-all">
                    <input type="radio" name="paymentMethod" value="kakaopay" class="mr-4">
                    <i class="fas fa-comment text-yellow-500 text-xl mr-3"></i>
                    <span class="font-semibold text-gray-900">카카오페이</span>
                  </label>
                  
                  <label class="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-emerald-500 transition-all">
                    <input type="radio" name="paymentMethod" value="naverpay" class="mr-4">
                    <i class="fas fa-n text-green-600 text-xl mr-3"></i>
                    <span class="font-semibold text-gray-900">네이버페이</span>
                  </label>
                </div>
              </div>
              
              <!-- Terms Agreement -->
              <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <label class="flex items-start cursor-pointer">
                  <input type="checkbox" id="agreeTerms" class="mt-1 mr-3">
                  <div class="text-sm text-gray-700">
                    <span class="font-semibold">(필수)</span> 
                    <a href="#" class="text-emerald-600 hover:underline">서비스 이용약관</a> 및 
                    <a href="#" class="text-emerald-600 hover:underline">개인정보 처리방침</a>, 
                    <a href="#" class="text-emerald-600 hover:underline">자동결제 이용약관</a>에 동의합니다.
                  </div>
                </label>
              </div>
              
              <!-- Payment Button -->
              <button onclick="worvox.processPayment('${plan}')" 
                class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-lg font-bold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg">
                <i class="fas fa-lock mr-2"></i>안전하게 결제하기
              </button>
              
              <p class="text-xs text-gray-500 text-center mt-4">
                <i class="fas fa-shield-alt mr-1"></i>
                NHN KCP 안전결제 시스템으로 보호됩니다
              </p>
            </div>
            
            <!-- Footer (inside padded content area) -->
            ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Set default billing cycle to monthly (yearly option removed)
    this.selectedBillingCycle = 'monthly';
    this.selectedPlanPrice = monthlyPrice;
  }

  selectBillingCycle(cycle, price) {
    this.selectedBillingCycle = cycle;
    this.selectedPlanPrice = price;
    
    // Update UI
    document.getElementById('planPrice').textContent = '₩' + price.toLocaleString();
    document.getElementById('billingCycleText').textContent = cycle === 'monthly' ? '월간' : '연간';
    document.getElementById('chargeDate').textContent = this.getChargeDate();
  }

  getChargeDate() {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  async processPayment(plan) {
    // Check terms agreement
    const agreeTerms = document.getElementById('agreeTerms');
    if (!agreeTerms || !agreeTerms.checked) {
      alert('⚠️ 약관에 동의해주세요.');
      return;
    }
    
    // Get selected payment method
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'card';
    
    try {
      // TODO: Implement actual NHN KCP payment integration
      // For now, show preparation message
      
      const planName = plan === 'premium' ? 'Premium' : 'Business';
      const billingCycleKo = this.selectedBillingCycle === 'monthly' ? '월간' : '연간';
      
      alert(`💳 결제 준비 중...\n\n${planName} 플랜 (${billingCycleKo})\n결제 금액: ₩${this.selectedPlanPrice.toLocaleString()}\n결제 수단: ${this.getPaymentMethodName(paymentMethod)}\n\nNHN KCP 결제 시스템 연동 준비 중입니다.\n곧 만나요! 🚀`);
      
      // Simulate payment success
      // setTimeout(() => {
      //   this.handlePaymentSuccess(plan, this.selectedBillingCycle);
      // }, 2000);
      
    } catch (error) {
      console.error('Payment error:', error);
      alert('❌ 결제 처리 중 오류가 발생했습니다.\n다시 시도해주세요.');
    }
  }

  getPaymentMethodName(method) {
    const names = {
      'card': '신용/체크카드',
      'kakaopay': '카카오페이',
      'naverpay': '네이버페이'
    };
    return names[method] || '신용/체크카드';
  }

  handlePaymentSuccess(plan, billingCycle) {
    // Update user subscription status
    this.currentUser.subscription_plan = plan;
    this.currentUser.billing_cycle = billingCycle;
    this.currentUser.subscription_status = 'trial'; // 7-day trial
    this.currentUser.trial_ends_at = this.getChargeDate();
    localStorage.setItem('worvox_user', JSON.stringify(this.currentUser));
    
    // Show success message and redirect
    alert('🎉 구독이 완료되었습니다!\n\n7일 무료 체험이 시작되었습니다.\n이제 모든 프리미엄 기능을 사용하실 수 있습니다!');
    this.showTopicSelection();
  }

  // Contact Sales for Business Plan
  contactSales() {
    alert('🏢 Business 플랜 문의\n\n영업팀 연락처:\n📧 business@worvox.com\n📞 02-1234-5678\n\n담당자가 곧 연락드리겠습니다!');
  }

  // Load usage data from localStorage
  loadUsageData() {
    const savedUsage = localStorage.getItem('worvox_usage');
    if (savedUsage) {
      try {
        const usage = JSON.parse(savedUsage);
        const today = new Date().toDateString();
        
        // Reset if new day
        if (usage.lastReset !== today) {
          this.resetDailyUsage();
        } else {
          this.dailyUsage = usage;
        }
      } catch (e) {
        console.error('Failed to load usage data:', e);
        this.resetDailyUsage();
      }
    }
  }

  // Load usage data from server
  async loadUsageFromServer() {
    if (!this.currentUser) return;
    
    try {
      const response = await axios.get(`/api/usage/${this.currentUser.id}`);
      if (response.data.success && response.data.usage) {
        this.dailyUsage = response.data.usage;
        // Also save to localStorage as backup
        this.saveUsageData();
      }
    } catch (error) {
      console.error('Failed to load usage from server:', error);
      // Fallback to localStorage
      this.loadUsageData();
    }
  }

  // Save usage data to localStorage
  saveUsageData() {
    localStorage.setItem('worvox_usage', JSON.stringify(this.dailyUsage));
  }

  // Save usage data to server
  async saveUsageToServer(featureType) {
    if (!this.currentUser) return;
    
    try {
      await axios.post(`/api/usage/${this.currentUser.id}`, {
        featureType: featureType,
        increment: 1
      });
      
      // Update UI after successful save
      this.updateUsageTrackerUI();
      
    } catch (error) {
      console.error('Failed to save usage to server:', error);
    }
  }

  // Increment daily usage (alias for saveUsageToServer)
  async incrementDailyUsage(featureType) {
    return this.saveUsageToServer(featureType);
  }

  // Reset daily usage
  resetDailyUsage() {
    this.dailyUsage = {
      aiConversations: 0,
      pronunciationPractice: 0,
      wordSearch: 0,
      lastReset: new Date().toDateString()
    };
    this.saveUsageData();
  }

  // Check usage limit
  checkUsageLimit(feature) {
    const limit = this.usageLimits[this.userPlan][feature];
    const current = this.dailyUsage[feature];
    
    if (current >= limit) {
      this.showUpgradeBanner(feature, current, limit);
      return false;
    }
    
    return true;
  }

  // Increment usage
  incrementUsage(feature) {
    this.dailyUsage[feature]++;
    this.saveUsageData();
    
    // Save to server
    this.saveUsageToServer(feature);
    
    // Update UI if usage tracker is visible
    this.updateUsageTrackerUI();
    
    // Show warning when approaching limit
    const limit = this.usageLimits[this.userPlan][feature];
    const current = this.dailyUsage[feature];
    
    if (this.userPlan === 'free' && current >= limit * 0.8) {
      this.showUsageWarning(feature, current, limit);
    }
  }

  // Update usage tracker UI in real-time
  updateUsageTrackerUI() {
    // Get current user plan
    const userPlan = this.currentUser?.plan || 'free';
    
    // Update AI Conversation
    const aiConvCurrent = this.getDailyUsage('ai_conversation');
    const aiConvLimit = this.usageLimits[userPlan]?.aiConversations || 0;
    this.updateUsageElement('ai_conversation', aiConvCurrent, aiConvLimit);
    
    // Update Timer Mode
    const timerCurrent = this.getDailyUsage('timer_mode');
    const timerLimit = this.usageLimits[userPlan]?.timerMode || 0;
    this.updateUsageElement('timer_mode', timerCurrent, timerLimit);
    
    // Update Scenario Mode
    const scenarioCurrent = this.getDailyUsage('scenario_mode');
    const scenarioLimit = this.usageLimits[userPlan]?.scenarioMode || 0;
    this.updateUsageElement('scenario_mode', scenarioCurrent, scenarioLimit);
    
    // Update Word Search
    const wordCurrent = this.getDailyUsage('word_search');
    const wordLimit = this.usageLimits[userPlan]?.wordSearch || 0;
    this.updateUsageElement('word_search', wordCurrent, wordLimit);
  }
  
  // Update individual usage element
  updateUsageElement(featureName, current, limit) {
    // Update count text
    const countElements = document.querySelectorAll(`[data-usage-count="${featureName}"]`);
    countElements.forEach(el => {
      if (limit === Infinity || limit === 999999) {
        el.textContent = `${current}회`;
      } else {
        el.textContent = `${current}/${limit}회`;
      }
    });
    
    // Update progress bar (only if not unlimited)
    if (limit !== Infinity && limit !== 999999 && limit > 0) {
      const percentage = Math.min(100, (current / limit) * 100);
      const barElements = document.querySelectorAll(`[data-usage-bar="${featureName}"]`);
      barElements.forEach(el => {
        el.style.width = `${percentage}%`;
      });
    }
  }

  // Show upgrade banner when limit reached
  showUpgradeBanner(feature, current, limit) {
    const featureNames = {
      aiConversations: 'AI 영어 대화',
      pronunciationPractice: '발음 연습',
      wordSearch: '단어 검색'
    };
    
    const banner = document.createElement('div');
    banner.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4';
    banner.innerHTML = `
      <div class="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl shadow-2xl p-6 animate-bounce">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0">
            <i class="fas fa-exclamation-circle text-4xl"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold mb-2">오늘 ${featureNames[feature]} 횟수 초과 ⚠️</h3>
            <p class="text-sm text-red-50 mb-4">
              ${featureNames[feature]} 하루 ${limit}회 중 ${current}회를 모두 사용했습니다.<br>
              Premium으로 업그레이드하고 <strong>무제한</strong>으로 사용하세요! 🚀
            </p>
            <div class="flex gap-2">
              <button onclick="worvox.showPlan(); document.querySelector('.fixed.top-4').remove();" 
                class="flex-1 bg-white text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-50 transition-all">
                <i class="fas fa-crown mr-2"></i>Premium 보기
              </button>
              <button onclick="this.closest('.fixed').remove()" 
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(banner);
    
    // Auto remove after 10 seconds
    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove();
      }
    }, 10000);
  }

  // Show usage warning when approaching limit
  showUsageWarning(feature, current, limit) {
    const featureNames = {
      aiConversations: 'AI 영어 대화',
      pronunciationPractice: '발음 연습',
      wordSearch: '단어 검색'
    };
    
    const remaining = limit - current;
    
    // Only show if exactly at warning threshold
    if (current === Math.ceil(limit * 0.8)) {
      const banner = document.createElement('div');
      banner.className = 'fixed top-4 right-4 z-50 max-w-sm';
      banner.innerHTML = `
        <div class="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 rounded-xl shadow-lg p-4">
          <div class="flex items-start gap-3">
            <i class="fas fa-exclamation-triangle text-2xl"></i>
            <div class="flex-1">
              <h4 class="font-bold mb-1">${featureNames[feature]} 곧 소진</h4>
              <p class="text-sm">오늘 ${remaining}회 남았습니다!</p>
              <button onclick="worvox.showPlan(); this.closest('.fixed').remove();" 
                class="mt-2 text-xs underline hover:no-underline">
                Premium 보기 →
              </button>
            </div>
            <button onclick="this.closest('.fixed').remove()" class="text-gray-700 hover:text-gray-900">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(banner);
      
      setTimeout(() => {
        if (banner.parentNode) {
          banner.remove();
        }
      }, 5000);
    }
  }

  // Word Search Feature with Hybrid Approach
  async searchWord() {
    // Check usage limit for free users
    if (!this.checkUsageLimit('wordSearch')) {
      return; // Show upgrade banner
    }
    
    const searchInput = document.getElementById('wordSearch');
    const searchResult = document.getElementById('searchResult');
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
      searchResult.innerHTML = '';
      return;
    }
    
    // Increment usage when searching
    this.incrementUsage('wordSearch');
    
    // Show loading state
    searchResult.innerHTML = `
      <div class="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
        <p class="text-gray-600">Searching...</p>
      </div>
    `;
    
    try {
      // Search in vocabulary (DB first, then ChatGPT if not found)
      const response = await axios.get('/api/vocabulary/search', {
        params: { query: searchTerm.toLowerCase() }
      });
      
      if (response.data.success && response.data.words.length > 0) {
        const word = response.data.words[0]; // Get first match
        const source = response.data.source; // 'database' or 'chatgpt'
        const summary = word.summary || [];
        
        searchResult.innerHTML = `
          <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200 animate-fadeIn">
            <!-- Header with Word and Pronunciation -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-2xl font-bold text-gray-800">${word.word}</h3>
                  <button 
                    onclick="worvox.playPronunciation('${word.word}')"
                    class="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg">
                    <i class="fas fa-volume-up"></i>
                  </button>
                  ${source === 'chatgpt' ? '<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">✨ AI</span>' : ''}
                </div>
                <div class="text-sm text-gray-500 mb-3">${word.pronunciation || ''}</div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    ${word.part_of_speech}
                  </span>
                  ${word.toeic_related ? '<span class="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">TOEIC</span>' : ''}
                  ${word.toefl_related ? '<span class="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-semibold">TOEFL</span>' : ''}
                  <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    ${word.difficulty}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Meanings -->
            <div class="mb-4 pb-4 border-b border-indigo-100">
              <!-- Korean Meaning with Play Button -->
              <div class="mb-3">
                <div class="flex items-center justify-between mb-1">
                  <div class="text-lg font-semibold text-gray-700">한국어 뜻:</div>
                  <button onclick="worvox.playKoreanMeaning('${word.meaning_ko}')" 
                    class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-all">
                    <i class="fas fa-volume-up"></i>
                    듣기
                  </button>
                </div>
                <div class="text-gray-800 text-lg">${word.meaning_ko}</div>
              </div>
              
              <!-- English Meaning -->
              ${word.meaning_en ? `
                <div class="pt-3 border-t border-indigo-50">
                  <div class="text-sm font-semibold text-gray-600 mb-1">English Definition:</div>
                  <div class="text-gray-700 text-sm italic">${word.meaning_en}</div>
                </div>
              ` : ''}
            </div>
            
            ${summary.length > 0 ? `
              <!-- 5-Point Summary (from ChatGPT) -->
              <div class="mb-4 pb-4 border-b border-indigo-100">
                <div class="text-sm font-semibold text-indigo-700 mb-3">📌 핵심 요약:</div>
                <div class="space-y-2">
                  ${summary.map((point, index) => `
                    <div class="flex items-start gap-2">
                      <span class="text-indigo-600 font-bold mt-0.5">✓</span>
                      <span class="text-gray-700 text-sm">${point}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            
            ${word.example_sentence ? `
              <!-- Example Sentence -->
              <div class="bg-white rounded-lg p-4 border border-indigo-100 mb-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-semibold text-indigo-700">예문:</div>
                  <button 
                    onclick="worvox.playExampleSentence('${word.example_sentence.replace(/'/g, "\\'")}')"
                    class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs hover:bg-indigo-200 transition-all">
                    <i class="fas fa-volume-up mr-1"></i>듣기
                  </button>
                </div>
                <div class="text-gray-700 italic">"${word.example_sentence}"</div>
              </div>
            ` : ''}
            
            <!-- External Links -->
            <div class="bg-white rounded-lg p-4 border border-indigo-100">
              <div class="text-sm font-semibold text-indigo-700 mb-3">🔗 자세히 보기:</div>
              <div class="grid grid-cols-2 gap-2">
                <a href="https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(word.word)}" 
                  target="_blank" 
                  class="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 text-sm transition-all">
                  <i class="fas fa-book"></i>
                  <span>Cambridge</span>
                </a>
                <a href="https://www.oxfordlearnersdictionaries.com/definition/english/${encodeURIComponent(word.word)}" 
                  target="_blank" 
                  class="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-700 text-sm transition-all">
                  <i class="fas fa-book-open"></i>
                  <span>Oxford</span>
                </a>
                <a href="https://youglish.com/pronounce/${encodeURIComponent(word.word)}/english" 
                  target="_blank" 
                  class="flex items-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 text-sm transition-all">
                  <i class="fas fa-video"></i>
                  <span>Youglish</span>
                </a>
                <a href="https://www.wordreference.com/definition/${encodeURIComponent(word.word)}" 
                  target="_blank" 
                  class="flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 text-sm transition-all">
                  <i class="fas fa-language"></i>
                  <span>WordRef</span>
                </a>
              </div>
            </div>
          </div>
        `;
      } else {
        searchResult.innerHTML = `
          <div class="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
            <i class="fas fa-search text-yellow-600 text-3xl mb-2"></i>
            <p class="text-gray-700">Word not found: "<strong>${searchTerm}</strong>"</p>
            <p class="text-sm text-gray-600 mt-2">Try searching for another word.</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Search error:', error);
      searchResult.innerHTML = `
        <div class="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
          <i class="fas fa-exclamation-circle text-red-600 text-3xl mb-2"></i>
          <p class="text-gray-700">An error occurred while searching.</p>
          <p class="text-sm text-gray-600 mt-2">${error.response?.data?.message || 'Please try again.'}</p>
        </div>
      `;
    }
  }
  
  async playPronunciation(word) {
    try {
      const response = await axios.post('/api/tts/speak', {
        text: word,
        language: 'en'
      }, {
        responseType: 'blob'
      });
      
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      alert('Failed to play pronunciation. Please try again.');
    }
  }
  
  async playExampleSentence(sentence) {
    try {
      const response = await axios.post('/api/tts/speak', {
        text: sentence,
        language: 'en'
      }, {
        responseType: 'blob'
      });
      
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.playbackRate = 0.85; // 15% slower for better comprehension
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      alert('Failed to play sentence. Please try again.');
    }
  }

  // Statistics feature
  async showStats() {
    try {
      const response = await axios.get(`/api/history/stats/${this.currentUser.id}`);
      const stats = response.data.stats;

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
          <!-- Sidebar -->
          ${this.getSidebar('stats')}
          
          <!-- Main Content -->
          <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Header -->
            <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
              <div class="flex items-center gap-2">
                <button onclick="worvox.showTopicSelection()" 
                  class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
                  <i class="fas fa-arrow-left text-xl"></i>
                </button>
                <div>
                  <h1 class="text-lg md:text-2xl font-bold text-gray-800">📊 Learning Statistics</h1>
                  <p class="text-gray-600 text-sm mt-1">Track your learning progress and insights</p>
                </div>
              </div>
            </div>

            <!-- Content Area -->
            <div class="flex-1 overflow-y-auto p-6">
              <div class="max-w-7xl mx-auto">
                <!-- Summary Cards -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                    <div class="text-4xl mb-2">📚</div>
                    <div class="text-3xl font-bold text-blue-700">${stats.totalSessions}</div>
                    <div class="text-sm text-blue-600">Total Sessions</div>
                  </div>
                  <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                    <div class="text-4xl mb-2">💬</div>
                    <div class="text-3xl font-bold text-green-700">${stats.totalMessages}</div>
                    <div class="text-sm text-green-600">Total Messages</div>
                  </div>
                  <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                    <div class="text-4xl mb-2">🗣️</div>
                    <div class="text-3xl font-bold text-purple-700">${stats.totalWords.toLocaleString()}</div>
                    <div class="text-sm text-purple-600">Words Spoken</div>
                  </div>
                  <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
                    <div class="text-4xl mb-2">🔥</div>
                    <div class="text-3xl font-bold text-orange-700">${stats.currentStreak}</div>
                    <div class="text-sm text-orange-600">Day Streak</div>
                  </div>
                </div>

                <!-- Charts Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <!-- Daily Activity Chart -->
                  <div class="bg-white rounded-xl shadow-sm p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">📈 Daily Activity (Last 30 Days)</h3>
                    <canvas id="dailyActivityChart"></canvas>
                  </div>

                  <!-- Topic Distribution Chart -->
                  <div class="bg-white rounded-xl shadow-sm p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">🎯 Learning by Topic</h3>
                    <canvas id="topicDistributionChart"></canvas>
                  </div>

              <!-- Weekly Progress Chart -->
              <div class="bg-white rounded-2xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">📅 Weekly Progress (Last 12 Weeks)</h3>
                <canvas id="weeklyProgressChart"></canvas>
              </div>

              <!-- Level Distribution Chart -->
              <div class="bg-white rounded-2xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">🎓 Learning by Level</h3>
                <canvas id="levelDistributionChart"></canvas>
              </div>

              <!-- Time of Day Chart -->
              <div class="bg-white rounded-2xl shadow-lg p-6 lg:col-span-2">
                <h3 class="text-xl font-bold text-gray-800 mb-4">⏰ Learning Time Patterns</h3>
                <canvas id="timeOfDayChart"></canvas>
              </div>
            </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Wait for DOM to be ready
      setTimeout(() => {
        this.renderCharts(stats);
      }, 100);
    } catch (error) {
      console.error('Error loading statistics:', error);
      alert('Failed to load statistics. Please try again.');
    }
  }

  renderCharts(stats) {
    // Daily Activity Chart
    if (stats.recentActivity && stats.recentActivity.length > 0) {
      const dailyCtx = document.getElementById('dailyActivityChart');
      if (dailyCtx) {
        new Chart(dailyCtx, {
          type: 'line',
          data: {
            labels: stats.recentActivity.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [{
              label: 'Sessions',
              data: stats.recentActivity.map(d => d.sessions),
              borderColor: 'rgb(99, 102, 241)',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        });
      }
    }

    // Topic Distribution Chart
    if (stats.topicStats && stats.topicStats.length > 0) {
      const topicCtx = document.getElementById('topicDistributionChart');
      if (topicCtx) {
        new Chart(topicCtx, {
          type: 'doughnut',
          data: {
            labels: stats.topicStats.map(t => `${t.topic_icon} ${t.topic_name}`),
            datasets: [{
              data: stats.topicStats.map(t => t.session_count),
              backgroundColor: [
                'rgba(255, 193, 7, 0.8)',
                'rgba(33, 150, 243, 0.8)',
                'rgba(76, 175, 80, 0.8)',
                'rgba(233, 30, 99, 0.8)',
                'rgba(156, 39, 176, 0.8)'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }
    }

    // Weekly Progress Chart
    if (stats.weeklyActivity && stats.weeklyActivity.length > 0) {
      const weeklyCtx = document.getElementById('weeklyProgressChart');
      if (weeklyCtx) {
        new Chart(weeklyCtx, {
          type: 'bar',
          data: {
            labels: stats.weeklyActivity.map(w => {
              const date = new Date(w.week_start);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
              label: 'Sessions',
              data: stats.weeklyActivity.map(w => w.sessions),
              backgroundColor: 'rgba(99, 102, 241, 0.8)',
              borderRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        });
      }
    }

    // Level Distribution Chart
    if (stats.levelStats && stats.levelStats.length > 0) {
      const levelCtx = document.getElementById('levelDistributionChart');
      if (levelCtx) {
        new Chart(levelCtx, {
          type: 'pie',
          data: {
            labels: stats.levelStats.map(l => l.level.charAt(0).toUpperCase() + l.level.slice(1)),
            datasets: [{
              data: stats.levelStats.map(l => l.session_count),
              backgroundColor: [
                'rgba(76, 175, 80, 0.8)',
                'rgba(255, 193, 7, 0.8)',
                'rgba(244, 67, 54, 0.8)'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }
    }

    // Time of Day Chart
    if (stats.timeOfDay && stats.timeOfDay.length > 0) {
      const timeCtx = document.getElementById('timeOfDayChart');
      if (timeCtx) {
        // Create full 24-hour array
        const hourlyData = new Array(24).fill(0);
        stats.timeOfDay.forEach(t => {
          hourlyData[t.hour] = t.session_count;
        });

        new Chart(timeCtx, {
          type: 'bar',
          data: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            datasets: [{
              label: 'Sessions',
              data: hourlyData,
              backgroundColor: (context) => {
                const hour = context.dataIndex;
                if (hour >= 6 && hour < 12) return 'rgba(255, 193, 7, 0.8)'; // Morning
                if (hour >= 12 && hour < 18) return 'rgba(33, 150, 243, 0.8)'; // Afternoon
                if (hour >= 18 && hour < 22) return 'rgba(156, 39, 176, 0.8)'; // Evening
                return 'rgba(63, 81, 181, 0.8)'; // Night
              },
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              },
              x: {
                ticks: {
                  maxRotation: 45,
                  minRotation: 45
                }
              }
            }
          }
        });
      }
    }
  }

  // Rewards System
  async showRewards() {
    try {
      // Load user from localStorage if not in memory
      if (!this.currentUser) {
        const storedUser = localStorage.getItem('worvox_user');
        if (storedUser) {
          this.currentUser = JSON.parse(storedUser);
          console.log('Loaded user from localStorage:', this.currentUser);
        }
      }
      
      // Ensure user is logged in
      if (!this.currentUser || !this.currentUser.id) {
        console.error('User not logged in');
        
        this.showLogin();
        return;
      }
      
      // Force reload current user from database to ensure fresh data
      try {
        const userResponse = await axios.get(`/api/users/${this.currentUser.id}`);
        console.log('🔍 User API response:', userResponse.data);
        if (userResponse.data.success && userResponse.data.user) {
          this.currentUser = userResponse.data.user;
          this.userPlan = this.currentUser.plan || 'free';
          localStorage.setItem('worvox_user', JSON.stringify(this.currentUser));
          console.log('✅ Refreshed current user:', this.currentUser);
        } else {
          console.warn('⚠️ User refresh returned unsuccessful:', userResponse.data);
        }
      } catch (error) {
        console.error('❌ Could not refresh user data:', error);
        console.error('Error details:', error.response?.data);
        // Continue anyway with cached user data
      }
      
      // Verify user is still valid (but don't block if we have cached data)
      if (!this.currentUser || !this.currentUser.id) {
        console.error('❌ User data invalid - redirecting to login');
        this.showLogin();
        return;
      }
      
      console.log('📊 Loading rewards for user:', this.currentUser.email || this.currentUser.id);
      
      // Get user gamification stats with error handling
      let stats = null;
      let userLevel = 1;
      try {
        stats = await gamificationManager.getStats(this.currentUser.id);
        userLevel = stats ? stats.stats.level : 1;
        console.log('✅ User level:', userLevel);
      } catch (error) {
        console.error('❌ Failed to load gamification stats:', error);
        console.error('Error details:', error.response?.data);
        // Continue with default level 1
        userLevel = 1;
      }

      // Define rewards (unlocked at level 30, 40, 50, etc.)
      const rewards = [
        { level: 30, title: '랜덤박스 1회', description: '행운의 랜덤박스를 열어보세요!', icon: '🎁', type: 'spin', spins: 1, unlocked: userLevel >= 30 },
        { level: 40, title: '프리미엄 5일 무료', description: '프리미엄 기능을 5일간 체험하세요', icon: '👑', type: 'premium', days: 5, unlocked: userLevel >= 40 },
        { level: 50, title: '랜덤박스 2회', description: '행운의 랜덤박스를 2번 열어보세요!', icon: '🎁', type: 'spin', spins: 2, unlocked: userLevel >= 50 },
        { level: 60, title: '랜덤박스 3회', description: '행운의 랜덤박스를 3번 열어보세요!', icon: '🎁', type: 'spin', spins: 3, unlocked: userLevel >= 60 },
        { level: 70, title: '랜덤박스 4회', description: '행운의 랜덤박스를 4번 열어보세요!', icon: '🎁', type: 'spin', spins: 4, unlocked: userLevel >= 70 },
        { level: 80, title: 'XP 보상 + 랜덤박스 3회', description: 'Level 83까지 즉시 상승 + 랜덤박스 3회', icon: '⚡', type: 'xp+spin', xpBonus: 'level83', spins: 3, unlocked: userLevel >= 80 },
        { level: 90, title: '랜덤박스 5회', description: '행운의 랜덤박스를 5번 열어보세요!', icon: '🎁', type: 'spin', spins: 5, unlocked: userLevel >= 90 },
        { level: 100, title: '대한항공 10만원 쿠폰', description: '대한항공 항공권 구매에 사용 가능', icon: '✈️', type: 'coupon', value: '100,000원', unlocked: userLevel >= 100 },
      ];

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
          <!-- Sidebar -->
          ${this.getSidebar('rewards')}
          
          <!-- Main Content -->
          <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Header -->
            <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
              <div class="flex items-center gap-2 max-w-6xl mx-auto">
                <button onclick="worvox.showTopicSelection()" 
                  class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
                  <i class="fas fa-arrow-left text-xl"></i>
                </button>
                <div>
                  <h1 class="text-lg md:text-2xl font-bold text-gray-800 mb-1">🎁 Level Rewards</h1>
                  <p class="hidden md:block text-gray-600">Unlock exclusive rewards as you level up!</p>
                </div>
              </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-4 md:p-8">
              <div class="max-w-6xl mx-auto">
                <!-- Current Level & Spin Count Card -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <!-- Level Card -->
                  <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                    <div class="flex items-center justify-between mb-2">
                      <div>
                        <h2 class="text-xl font-bold mb-1">Level ${userLevel}</h2>
                        <p class="text-xs text-indigo-100">Keep learning to unlock rewards!</p>
                      </div>
                      <div class="text-3xl">🎯</div>
                    </div>
                    <div class="bg-white bg-opacity-20 rounded-full h-2">
                      <div class="bg-yellow-400 h-2 rounded-full transition-all" style="width: ${stats ? stats.stats.progress : 0}%"></div>
                    </div>
                    <div class="mt-1 text-xs text-indigo-100">
                      ${stats ? `${stats.stats.xp} / ${stats.stats.xpForNextLevel} XP` : ''}
                    </div>
                  </div>
                  
                  <!-- Spin Wheel Count Card -->
                  <div class="bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl p-4 text-white shadow-lg">
                    <div class="flex items-center justify-between">
                      <div>
                        <h2 class="text-xl font-bold mb-1">보유 랜덤박스</h2>
                        <div class="flex items-baseline gap-2">
                          <div class="text-3xl font-bold" id="availableSpins">0</div>
                          <p class="text-xs text-orange-100">개</p>
                        </div>
                      </div>
                      <button onclick="worvox.openRandomBox()" class="bg-white text-orange-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-50 transition-all shadow-lg">
                        열기
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Random Box Section -->
                <div id="randomBoxSection" class="bg-white rounded-xl shadow-lg p-4 mb-4">
                  <h3 class="text-lg font-bold text-gray-800 mb-3 text-center">🎁 행운의 랜덤박스</h3>
                  
                  <!-- Box Container (Fixed Height) -->
                  <div class="flex justify-center items-center mb-3">
                    <div class="relative" style="width: 200px; height: 200px;">
                      <!-- Mystery Box (closed) -->
                      <div id="mysteryBox" class="absolute inset-0 cursor-pointer transition-all duration-500" onclick="worvox.openBox()">
                        <div class="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 rounded-xl shadow-xl flex items-center justify-center transform hover:scale-105 transition-all">
                          <div class="text-center text-white">
                            <div class="text-5xl mb-2">🎁</div>
                            <div class="text-lg font-bold mb-1">클릭하세요!</div>
                            <div class="text-xs opacity-80">무엇이 나올까요?</div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Opening Animation Container -->
                      <div id="boxOpening" class="hidden absolute inset-0">
                        <div class="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 rounded-xl shadow-xl flex items-center justify-center">
                          <div class="text-center text-white">
                            <div class="text-5xl mb-2 animate-bounce">✨</div>
                            <div class="text-lg font-bold">Opening...</div>
                            <div class="text-xs opacity-80 mt-1">Please wait</div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Result Display (Same position as box) -->
                      <div id="boxResult" class="hidden"></div>
                    </div>
                  </div>
                  
                  <!-- Close Button (Below box) -->
                  <div id="closeButtonContainer" class="hidden flex justify-center mt-3">
                    <button onclick="worvox.closeBoxResult()" class="bg-white text-orange-600 px-6 py-2 rounded-lg text-sm font-bold hover:bg-orange-50 transition-all shadow-lg">
                      확인
                    </button>
                  </div>
                </div>

                <!-- Rewards Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  ${rewards.map(reward => `
                    <div class="relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-2xl ${reward.unlocked ? 'transform hover:-translate-y-1' : ''}">
                      <!-- Unlocked/Locked Overlay (with reduced opacity to show content) -->
                      ${!reward.unlocked ? `
                        <div class="absolute inset-0 bg-gray-900 bg-opacity-30 backdrop-blur-[2px] flex items-center justify-center z-10">
                          <div class="text-center bg-black bg-opacity-70 px-6 py-4 rounded-xl">
                            <i class="fas fa-lock text-4xl text-white mb-2"></i>
                            <p class="text-white font-bold text-base">Level ${reward.level} Required</p>
                            <p class="text-gray-300 text-xs mt-1">${reward.level - userLevel} levels to go</p>
                          </div>
                        </div>
                      ` : ''}
                      
                      <!-- Reward Content -->
                      <div class="p-6">
                        <!-- Level Badge -->
                        <div class="flex items-center justify-between mb-4">
                          <span class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
                            Lv.${reward.level}
                          </span>
                          ${reward.unlocked ? `
                            <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                              <i class="fas fa-check mr-1"></i>UNLOCKED
                            </span>
                          ` : ''}
                        </div>
                        
                        <!-- Icon -->
                        <div class="text-6xl mb-4 text-center">${reward.icon}</div>
                        
                        <!-- Title & Description -->
                        <h3 class="text-xl font-bold text-gray-800 mb-2 text-center">${reward.title}</h3>
                        <p class="text-gray-600 text-center mb-4">${reward.description}</p>
                        
                        <!-- Type Badge -->
                        <div class="text-center">
                          <span class="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                            ${reward.type === 'spin' ? '🎰 돌림판' : reward.type === 'premium' ? '👑 프리미엄' : reward.type === 'xp+spin' ? '⚡ XP+돌림판' : reward.type === 'coupon' ? '✈️ 쿠폰' : '🎁 보상'}
                          </span>
                        </div>
                        
                        <!-- Claim Button (if unlocked) -->
                        ${reward.unlocked ? `
                          <button onclick="worvox.claimReward(${reward.level})" 
                            class="mt-4 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all">
                            <i class="fas fa-gift mr-2"></i>보상 받기
                          </button>
                        ` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>

                <!-- Next Milestone -->
                ${userLevel < 30 ? `
                  <div class="mt-8 bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 text-center">
                    <div class="text-4xl mb-3">🎯</div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">First Reward at Level 30!</h3>
                    <p class="text-gray-600 mb-4">You need ${30 - userLevel} more levels to unlock your first reward.</p>
                    <p class="text-sm text-gray-500">Keep completing quizzes to earn XP and level up faster!</p>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;

      // Load gamification stats after rendering
      await this.loadGamificationStats();
      
      // Load spin count from database
      await this.loadSpinCount();
      this.updateSpinCount();
    } catch (error) {
      console.error('❌ Error loading rewards:', error);
      console.error('Error details:', error.response?.data);
      console.error('Stack trace:', error.stack);
      // Show error in UI instead of alert
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen items-center justify-center bg-gray-50">
          <div class="text-center p-8">
            <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">보상을 불러오는 중 오류가 발생했습니다</h2>
            <p class="text-gray-600 mb-6">잠시 후 다시 시도해주세요.</p>
            <button onclick="worvox.showTopicSelection()" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold">
              홈으로 돌아가기
            </button>
          </div>
        </div>
      `;
    }
  }
  
  generateSpinWheelHTML() {
    const prizes = [
      { name: 'XP 50', icon: '⚡', color: '#EF4444' },      // Red
      { name: 'XP 300', icon: '💫', color: '#6366F1' },    // Blue  
      { name: '스타벅스', icon: '☕', color: '#F59E0B' },   // Yellow
      { name: '1만원권', icon: '🎫', color: '#14B8A6' },   // Teal
      { name: '키보드', icon: '⌨️', color: '#10B981' },    // Green
      { name: '삼성버즈', icon: '🎧', color: '#3B82F6' },  // Light Blue
      { name: '에어팟', icon: '🎵', color: '#F97316' },    // Orange
      { name: '아이패드', icon: '📱', color: '#EAB308' }   // Gold
    ];
    
    const sectorAngle = 360 / 8; // 45 degrees
    
    return prizes.map((prize, index) => {
      const rotation = sectorAngle * index;
      
      return `
        <div style="position: absolute; width: 100%; height: 100%; transform: rotate(${rotation}deg); clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%); background: ${prize.color};">
          <div style="position: absolute; top: 30%; left: 70%; transform: translate(-50%, -50%) rotate(22.5deg); text-align: center;">
            <div style="font-size: 24px; margin-bottom: 2px;">${prize.icon}</div>
            <div style="font-size: 10px; font-weight: bold; color: white; white-space: nowrap;">${prize.name}</div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  async loadSpinCount() {
    try {
      if (!this.currentUser || !this.currentUser.id) {
        console.warn('Cannot load spin count: user not logged in');
        this.availableSpins = 0;
        return;
      }
      console.log('Loading spin count for user:', this.currentUser.id);
      const response = await axios.get(`/api/gamification/spin-count/${this.currentUser.id}`);
      if (response.data.success) {
        this.availableSpins = response.data.spin_count || 0;
        console.log('Loaded spin count:', this.availableSpins);
      } else {
        this.availableSpins = 0;
      }
    } catch (error) {
      console.error('Error loading spin count:', error);
      this.availableSpins = 0;
    }
  }
  
  async saveSpinCount() {
    try {
      if (!this.currentUser || !this.currentUser.id) {
        console.warn('Cannot save spin count: user not logged in');
        return;
      }
      console.log('Saving spin count:', this.availableSpins, 'for user:', this.currentUser.id);
      await axios.post('/api/gamification/spin-count/update', {
        userId: this.currentUser.id,
        spin_count: this.availableSpins
      });
    } catch (error) {
      console.error('Error saving spin count:', error);
    }
  }
  
  updateSpinCount() {
    const spinCountElement = document.getElementById('availableSpins');
    if (spinCountElement) {
      const count = this.availableSpins || 0;
      spinCountElement.textContent = count;
      console.log('Updated UI spin count:', count);
    }
  }
  
  openRandomBox() {
    if (!this.availableSpins || this.availableSpins <= 0) {
      alert('보유한 랜덤박스 횟수가 없습니다!\n\n레벨업 보상을 통해 랜덤박스를 획득하세요.');
      return;
    }
    
    // Scroll to random box section
    const boxSection = document.getElementById('randomBoxSection');
    if (boxSection) {
      boxSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Highlight the section briefly
      boxSection.classList.add('ring-4', 'ring-orange-500');
      setTimeout(() => {
        boxSection.classList.remove('ring-4', 'ring-orange-500');
      }, 2000);
    }
  }
  
  async openBox() {
    // Ensure user is loaded
    if (!this.currentUser) {
      const storedUser = localStorage.getItem('worvox_user');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      } else {
        
        this.showLogin();
        return;
      }
    }
    
    // Check available count
    if (!this.availableSpins || this.availableSpins <= 0) {
      alert('보유한 랜덤박스 횟수가 없습니다!');
      return;
    }
    
    // Hide box, show opening animation
    const mysteryBox = document.getElementById('mysteryBox');
    const boxOpening = document.getElementById('boxOpening');
    const boxResult = document.getElementById('boxResult');
    
    mysteryBox.classList.add('hidden');
    boxOpening.classList.remove('hidden');
    
    // Prizes with probabilities
    const prizes = [
      { name: 'XP 50', probability: 55, icon: '⚡' },
      { name: 'XP 300', probability: 40, icon: '💫' },
      { name: '스타벅스 아메리카노', probability: 4.9, icon: '☕' },
      { name: '스타벅스 1만원권', probability: 0.025, icon: '🎫' },
      { name: '로지텍 무선 키보드', probability: 0.025, icon: '⌨️' },
      { name: '삼성 버즈', probability: 0.025, icon: '🎧' },
      { name: '에어팟 프로', probability: 0.013, icon: '🎵' },
      { name: '아이패드 프로', probability: 0.012, icon: '📱' }
    ];
    
    // Select prize based on probability
    const random = Math.random() * 100;
    let cumulative = 0;
    let selectedPrize = prizes[0];
    
    for (let i = 0; i < prizes.length; i++) {
      cumulative += prizes[i].probability;
      if (random <= cumulative) {
        selectedPrize = prizes[i];
        break;
      }
    }
    
    // Wait for animation (2 seconds)
    setTimeout(async () => {
      // Decrease available count
      this.availableSpins--;
      await this.saveSpinCount();
      this.updateSpinCount();
      
      // Award XP if XP prize
      let xpAwarded = 0;
      try {
        if (selectedPrize.name === 'XP 50') {
          xpAwarded = 50;
          const result = await this.awardXP(50, 'random_box', 'Random Box - XP 50');
          if (result && result.success) {
            console.log('✅ XP awarded successfully:', xpAwarded);
            // Refresh user stats to update UI
            await this.loadUsageFromServer();
            await this.loadGamificationStats();
          }
        } else if (selectedPrize.name === 'XP 300') {
          xpAwarded = 300;
          const result = await this.awardXP(300, 'random_box', 'Random Box - XP 300');
          if (result && result.success) {
            console.log('✅ XP awarded successfully:', xpAwarded);
            // Refresh user stats to update UI
            await this.loadUsageFromServer();
            await this.loadGamificationStats();
          }
        }
      } catch (error) {
        console.error('❌ Error awarding XP:', error);
        // Still show the prize but with an error message
      }
      
      // Hide opening animation and mystery box
      boxOpening.classList.add('hidden');
      mysteryBox.classList.add('hidden');
      
      // Show result (in the same box position)
      boxResult.innerHTML = `
        <div class="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-xl shadow-xl flex items-center justify-center">
          <div class="text-center">
            <div class="text-5xl mb-3">${selectedPrize.icon}</div>
            <div class="text-lg font-bold mb-1">축하합니다!</div>
            <div class="text-base mb-2">${selectedPrize.name} 당첨!</div>
            ${xpAwarded > 0 ? `<div class="text-sm text-yellow-100">✨ +${xpAwarded} XP 획득!</div>` : ''}
            <div class="text-xs opacity-80 mt-2">남은 횟수: ${this.availableSpins}회</div>
          </div>
        </div>
      `;
      boxResult.classList.remove('hidden');
      
      // Show close button
      const closeBtn = document.getElementById('closeButtonContainer');
      if (closeBtn) {
        closeBtn.classList.remove('hidden');
      }
    }, 2000);
  }
  
  closeBoxResult() {
    const mysteryBox = document.getElementById('mysteryBox');
    const boxResult = document.getElementById('boxResult');
    const closeBtn = document.getElementById('closeButtonContainer');
    
    // Hide result and close button
    boxResult.classList.add('hidden');
    boxResult.innerHTML = '';
    if (closeBtn) {
      closeBtn.classList.add('hidden');
    }
    
    // Show box again if spins remain
    if (this.availableSpins > 0) {
      mysteryBox.classList.remove('hidden');
    } else {
      // Show empty state
      mysteryBox.classList.add('hidden');
      boxResult.innerHTML = `
        <div class="absolute inset-0 bg-gray-100 rounded-xl flex items-center justify-center">
          <div class="text-center px-4">
            <div class="text-4xl mb-3">🎁</div>
            <p class="text-gray-700 text-base font-semibold mb-2">모든 기회를 사용했습니다!</p>
            <p class="text-gray-500 text-sm">레벨업 보상으로 랜덤박스를 다시 받으세요!</p>
          </div>
        </div>
      `;
      `;
      boxResult.classList.remove('hidden');
    }
  }

  async claimReward(level) {
    try {
      // Get reward info
      const stats = await gamificationManager.getStats(this.currentUser.id);
      const userLevel = stats ? stats.stats.level : 1;
      
      const rewards = [
        { level: 30, type: 'spin', spins: 1 },
        { level: 40, type: 'premium', days: 5 },
        { level: 50, type: 'spin', spins: 2 },
        { level: 60, type: 'spin', spins: 3 },
        { level: 70, type: 'spin', spins: 4 },
        { level: 80, type: 'xp+spin', xpBonus: 'level83', spins: 3 },
        { level: 90, type: 'spin', spins: 5 },
        { level: 100, type: 'coupon', value: '100,000원' },
      ];
      
      const reward = rewards.find(r => r.level === level);
      if (!reward) return;
      
      if (reward.type === 'spin') {
        // Add spins to available count
        this.availableSpins = (this.availableSpins || 0) + reward.spins;
        await this.saveSpinCount();
        this.updateSpinCount();
        alert(`🎉 축하합니다!\n\n랜덤박스 ${reward.spins}회가 지급되었습니다!\n\n상단의 "랜덤박스 열기" 버튼을 눌러 행운을 시험해보세요!`);
      } else if (reward.type === 'premium') {
        alert(`🎉 축하합니다!\n\n프리미엄 ${reward.days}일 무료 체험권이 지급되었습니다!`);
      } else if (reward.type === 'xp+spin') {
        this.availableSpins = (this.availableSpins || 0) + reward.spins;
        await this.saveSpinCount();
        this.updateSpinCount();
        alert(`🎉 축하합니다!\n\nLevel 83으로 즉시 상승 + 랜덤박스 ${reward.spins}회 기회가 지급되었습니다!`);
      } else if (reward.type === 'coupon') {
        alert(`✈️ 축하합니다!\n\n대한항공 ${reward.value} 쿠폰이 지급되었습니다!\n쿠폰은 이메일로 전송됩니다.`);
      }
    } catch (error) {
      console.error('Claim reward error:', error);
      alert('보상 수령 중 오류가 발생했습니다.');
    }
  }
  
  showSpinWheel(totalSpins) {
    // Store total spins
    this.remainingSpins = totalSpins;
    
    // Spin wheel prizes with probabilities
    const prizes = [
      { name: 'XP 50', probability: 55, icon: '⚡', color: '#3B82F6' },
      { name: 'XP 300', probability: 40, icon: '💫', color: '#8B5CF6' },
      { name: '스타벅스 아메리카노', probability: 4.9, icon: '☕', color: '#10B981' },
      { name: '스타벅스 1만원권', probability: 0.025, icon: '🎫', color: '#F59E0B' },
      { name: '로지텍 무선 키보드', probability: 0.025, icon: '⌨️', color: '#EF4444' },
      { name: '삼성 버즈', probability: 0.012, icon: '🎧', color: '#EC4899' },
      { name: '에어팟 프로', probability: 0.012, icon: '🎵', color: '#14B8A6' },
      { name: '삼성 워치', probability: 0.013, icon: '⌚', color: '#F97316' },
      { name: '애플 워치', probability: 0.013, icon: '⌚', color: '#6366F1' },
      { name: '아이패드 프로', probability: 0.01, icon: '📱', color: '#A855F7' }
    ];
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl">
          <!-- Header -->
          <div class="text-center mb-6">
            <h2 class="text-3xl font-bold text-gray-800 mb-2">🎰 행운의 돌림판</h2>
            <p class="text-gray-600">남은 기회: <span id="remainingSpins" class="text-2xl font-bold text-indigo-600">${totalSpins}</span>회</p>
          </div>
          
          <!-- Spin Wheel Container -->
          <div class="relative mb-6">
            <!-- Wheel -->
            <div id="spinWheel" class="relative w-60 h-60 mx-auto rounded-full border-8 border-gray-800 shadow-2xl overflow-hidden" style="transition: transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99);">
              ${prizes.map((prize, index) => {
                const angle = (360 / prizes.length) * index;
                return `
                  <div class="absolute w-full h-full" style="transform: rotate(${angle}deg); transform-origin: center;">
                    <div class="absolute w-1/2 h-full right-1/2 origin-right flex items-center justify-end pr-2" style="background: ${prize.color}; clip-path: polygon(100% 0, 100% 100%, 0 50%);">
                      <div class="transform rotate-90 text-center">
                        <div class="text-2xl mb-0.5">${prize.icon}</div>
                        <div class="text-[9px] font-bold text-white whitespace-nowrap leading-tight">${prize.name}</div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            
            <!-- Pointer -->
            <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
              <div class="w-0 h-0 border-l-8 border-r-8 border-t-16 border-l-transparent border-r-transparent border-t-red-500"></div>
            </div>
            
            <!-- Center Button -->
            <button id="spinButton" onclick="worvox.spinTheWheel()" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-2xl flex items-center justify-center text-white font-bold text-lg hover:scale-110 transition-all z-20 border-4 border-white">
              SPIN
            </button>
          </div>
          
          <!-- Result Display -->
          <div id="spinResult" class="text-center mb-4 min-h-16"></div>
          
          <!-- Close Button -->
          <button onclick="worvox.showRewards()" class="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-all">
            닫기
          </button>
        </div>
      </div>
    `;
  }
  
  spinTheWheel() {
    // Check available spins from Rewards page
    if (!this.availableSpins || this.availableSpins <= 0) {
      alert('보유한 돌림판 횟수가 없습니다!');
      return;
    }
    
    // Disable button
    const spinButton = document.getElementById('spinButton');
    spinButton.disabled = true;
    spinButton.classList.add('opacity-50', 'cursor-not-allowed');
    
    // Prizes with cumulative probabilities (8 prizes)
    const prizes = [
      { name: 'XP 50', probability: 55, icon: '⚡' },
      { name: 'XP 300', probability: 40, icon: '💫' },
      { name: '스타벅스 아메리카노', probability: 4.9, icon: '☕' },
      { name: '스타벅스 1만원권', probability: 0.025, icon: '🎫' },
      { name: '로지텍 무선 키보드', probability: 0.025, icon: '⌨️' },
      { name: '삼성 버즈', probability: 0.025, icon: '🎧' },
      { name: '에어팟 프로', probability: 0.013, icon: '🎵' },
      { name: '아이패드 프로', probability: 0.012, icon: '📱' }
    ];
    
    // Select prize based on probability
    const random = Math.random() * 100;
    let cumulative = 0;
    let selectedPrize = prizes[0];
    let selectedIndex = 0;
    
    for (let i = 0; i < prizes.length; i++) {
      cumulative += prizes[i].probability;
      if (random <= cumulative) {
        selectedPrize = prizes[i];
        selectedIndex = i;
        break;
      }
    }
    
    // Calculate rotation
    const degreesPerPrize = 360 / prizes.length;
    const targetDegree = 360 * 5 + (degreesPerPrize * selectedIndex) + (degreesPerPrize / 2);
    
    // Rotate wheel
    const wheel = document.getElementById('spinWheel');
    wheel.style.transform = `rotate(${targetDegree}deg)`;
    
    // Show result after animation
    setTimeout(async () => {
      // Decrease available spins
      this.availableSpins--;
      await this.saveSpinCount();
      this.updateSpinCount();
      
      // Award XP if XP prize
      let xpAwarded = 0;
      if (selectedPrize.name === 'XP 50') {
        xpAwarded = 50;
        await this.awardXP(50, 'spin_wheel', 'Spin Wheel - XP 50');
      } else if (selectedPrize.name === 'XP 300') {
        xpAwarded = 300;
        await this.awardXP(300, 'spin_wheel', 'Spin Wheel - XP 300');
      }
      
      document.getElementById('spinResult').innerHTML = `
        <div class="bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-6 px-8 rounded-2xl shadow-2xl">
          <div class="text-6xl mb-3">${selectedPrize.icon}</div>
          <div class="text-3xl font-bold mb-2">축하합니다!</div>
          <div class="text-2xl mb-1">${selectedPrize.name} 당첨!</div>
          ${xpAwarded > 0 ? `<div class="text-lg mt-2 text-yellow-100">✨ +${xpAwarded} XP 획득!</div>` : ''}
          <div class="text-sm mt-3 text-yellow-100">남은 횟수: ${this.availableSpins}회</div>
          <button onclick="worvox.closeSpinResult()" class="mt-4 bg-white text-orange-600 px-6 py-2 rounded-lg font-bold hover:bg-orange-50 transition-all">
            확인
          </button>
        </div>
      `;
    }, 3000);
  }
  
  async awardXP(xp, activityType, details) {
    try {
      if (!this.currentUser) {
        console.error('Current user is null or undefined');
        console.error('localStorage user:', localStorage.getItem('worvox_user'));
        alert('XP 지급 중 오류가 발생했습니다. (User not loaded)');
        return;
      }
      
      if (!this.currentUser.id) {
        console.error('Current user has no id:', this.currentUser);
        alert('XP 지급 중 오류가 발생했습니다. (User ID missing)');
        return;
      }
      
      console.log('=== XP Award Debug ===');
      console.log('Current user:', this.currentUser);
      console.log('User ID:', this.currentUser.id);
      console.log('XP to award:', xp);
      console.log('Activity:', activityType);
      
      const response = await axios.post('/api/gamification/xp/add', {
        userId: this.currentUser.id,
        xp: xp,
        activityType: activityType,
        details: details
      });
      
      console.log('XP award response:', response.data);
      
      if (response.data.success) {
        // Reload stats to show updated XP and level
        await this.loadGamificationStats();
        // Force reload current user data
        const userResponse = await axios.get(`/api/users/${this.currentUser.id}`);
        if (userResponse.data.success) {
          this.currentUser = userResponse.data.data;
          console.log('User data reloaded, new XP:', this.currentUser.total_xp);
          // Also update localStorage
          localStorage.setItem('worvox_user', JSON.stringify(this.currentUser));
        }
      } else {
        throw new Error(response.data.error || 'XP award failed');
      }
    } catch (error) {
      console.error('=== XP Award Error ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      
      let errorMsg = 'XP 지급 중 오류가 발생했습니다.';
      if (error.response?.data?.message) {
        errorMsg += '\n' + error.response.data.message;
      }
      alert(errorMsg);
    }
  }
  
  closeSpinResult() {
    const spinButton = document.getElementById('spinButton');
    const wheel = document.getElementById('spinWheel');
    
    // Clear result
    document.getElementById('spinResult').innerHTML = '';
    
    // Re-enable button if spins remain
    if (this.availableSpins > 0) {
      spinButton.disabled = false;
      spinButton.classList.remove('opacity-50', 'cursor-not-allowed');
      
      // Reset wheel rotation for next spin
      wheel.style.transition = 'none';
      wheel.style.transform = 'rotate(0deg)';
      setTimeout(() => {
        wheel.style.transition = 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
      }, 50);
    } else {
      document.getElementById('spinResult').innerHTML = `
        <p class="text-gray-600 text-lg">모든 기회를 사용했습니다!</p>
        <p class="text-gray-500 text-sm mt-2">레벨업 보상으로 돌림판을 다시 받으세요!</p>
      `;
    }
  }

  showUpgrade() {
    // Redirect to Plan page
    this.showPlan();
  }

  // Plan Page (요금제 비교)
  async showPlan() {
    try {
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
          <!-- Sidebar -->
          ${this.getSidebar('plan')}
          
          <!-- Main Content -->
          <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Header -->
            <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
              <div class="flex items-center gap-2 max-w-6xl mx-auto">
                <button onclick="worvox.showTopicSelection()" 
                  class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
                  <i class="fas fa-arrow-left text-xl"></i>
                </button>
                <div>
                  <h1 class="text-lg md:text-2xl font-bold text-gray-800 mb-1">👑 요금제</h1>
                  <p class="hidden md:block text-gray-600">당신에게 맞는 플랜을 선택하세요</p>
                </div>
              </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-4 md:p-8">
              <div class="max-w-7xl mx-auto">
                
                <!-- Billing Period Toggle -->
                <div class="flex justify-center mb-8">
                  <div class="bg-white rounded-full p-1.5 shadow-lg inline-flex items-center">
                    <button id="monthlyToggle" onclick="worvox.toggleBillingPeriod('monthly')" 
                      class="px-6 py-2.5 rounded-full font-semibold transition-all bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      월별 결제
                    </button>
                    <button id="yearlyToggle" onclick="worvox.toggleBillingPeriod('yearly')" 
                      class="px-6 py-2.5 rounded-full font-semibold transition-all text-gray-600">
                      연별 결제
                      <span class="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">18% 할인</span>
                    </button>
                  </div>
                </div>
                
                <!-- Pricing Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-6 mb-8 pt-8">
                  
                  <!-- Free Plan -->
                  <div class="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200 transition-all hover:shadow-2xl">
                    <div class="bg-gradient-to-br from-gray-50 to-gray-100 p-6 text-center">
                      <div class="text-4xl mb-3">🆓</div>
                      <h3 class="text-2xl font-bold text-gray-800 mb-2">Free</h3>
                      <div class="text-gray-600 mb-4">
                        <span class="text-3xl font-bold">무료</span>
                      </div>
                      <p class="text-sm text-gray-500">기본 기능 체험</p>
                    </div>
                    <div class="p-6">
                      <ul class="space-y-3 mb-6">
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700">일일 대화 <strong>5분</strong></span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700">단어 검색 <strong>제한</strong></span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700">기본 학습 기능</span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-times text-gray-300 mr-2 mt-1"></i>
                          <span class="text-gray-400">리포트 & 분석</span>
                        </li>
                      </ul>
                      <button class="w-full py-3 bg-gray-100 text-gray-600 rounded-lg font-semibold cursor-default">
                        현재 플랜
                      </button>
                    </div>
                  </div>

                  <!-- Core Plan -->
                  <div class="bg-white rounded-2xl shadow-lg border-2 border-blue-200 transition-all hover:shadow-2xl transform hover:-translate-y-1 relative" style="overflow: visible;">
                    <!-- Free Trial Badge with animation -->
                    <div class="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                      <div class="relative">
                        <div class="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur opacity-75 animate-pulse"></div>
                        <div class="relative bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 md:px-5 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold shadow-lg whitespace-nowrap">
                          <span class="flex items-center gap-1.5">
                            <i class="fas fa-gift"></i>
                            <span>2주 무료 체험</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-center text-white pt-10 rounded-t-2xl">
                      <div class="text-4xl mb-3">💙</div>
                      <h3 class="text-2xl font-bold mb-2">Core</h3>
                      <div class="mb-4">
                        <span id="corePrice" class="text-3xl font-bold">₩9,900</span>
                        <span id="corePeriod" class="text-blue-100 text-sm">/월</span>
                        <div id="coreYearlySavings" class="hidden text-xs text-green-300 mt-1">
                          월 ₩9,900 × 12개월 = ₩118,800 → 18% 할인
                        </div>
                      </div>
                      <p class="text-sm text-blue-100">무제한 대화</p>
                    </div>
                    <div class="p-6">
                      <ul class="space-y-3 mb-6">
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700 font-semibold">AI 대화 <strong>무제한</strong></span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700 font-semibold">개인 단어장</span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700">단어 퀴즈 & 학습</span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-times text-gray-300 mr-2 mt-1"></i>
                          <span class="text-gray-400">리포트 & 분석</span>
                        </li>
                      </ul>
                      
                      <!-- Free Trial Button with improved design -->
                      <button onclick="worvox.startFreeTrial('core')" 
                        class="w-full py-3.5 mb-3 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white rounded-xl font-bold hover:from-green-600 hover:via-emerald-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm md:text-base group relative overflow-hidden">
                        <span class="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
                        <span class="relative flex items-center justify-center gap-2">
                          <i class="fas fa-gift text-lg"></i>
                          <span class="inline md:hidden">2주 무료 체험</span>
                          <span class="hidden md:inline">2주 무료로 시작하기</span>
                          <i class="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform"></i>
                        </span>
                      </button>
                      
                      <!-- Regular Purchase Button -->
                      <button onclick="worvox.selectPlan('Core')" 
                        class="w-full py-2.5 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all text-sm hover:border-blue-700">
                        바로 구매하기
                      </button>
                    </div>
                  </div>

                  <!-- Premium Plan (Most Popular) -->
                  <div class="bg-white rounded-2xl shadow-2xl border-2 border-purple-400 relative transition-all hover:shadow-2xl transform hover:-translate-y-2" style="overflow: visible;">
                    <!-- Popular Badge -->
                    <div class="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-bold shadow-lg z-10 animate-pulse">
                      🔥 POPULAR
                    </div>
                    <!-- Free Trial Badge with animation -->
                    <div class="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                      <div class="relative">
                        <div class="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur opacity-75 animate-pulse"></div>
                        <div class="relative bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 md:px-5 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold shadow-lg whitespace-nowrap">
                          <span class="flex items-center gap-1.5">
                            <i class="fas fa-gift"></i>
                            <span>2주 무료 체험</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-center text-white pt-10 rounded-t-2xl">
                      <div class="text-4xl mb-3">✨</div>
                      <h3 class="text-2xl font-bold mb-2">Premium</h3>
                      <div class="mb-4">
                        <span id="premiumPrice" class="text-3xl font-bold">₩19,000</span>
                        <span id="premiumPeriod" class="text-purple-100 text-sm">/월</span>
                        <div id="premiumYearlySavings" class="hidden text-xs text-green-300 mt-1">
                          월 ₩19,000 × 12개월 = ₩228,000 → 18% 할인
                        </div>
                      </div>
                      <p class="text-sm text-purple-100">완벽한 학습 경험</p>
                    </div>
                    <div class="p-6">
                      <ul class="space-y-3 mb-6">
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700 font-semibold">발음 <strong>분석</strong></span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700 font-semibold">문장 <strong>첨삭</strong></span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700 font-semibold">학습 <strong>리포트</strong></span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700">+ Core 모든 기능</span>
                        </li>
                      </ul>
                      
                      <!-- Free Trial Button with improved design -->
                      <button onclick="worvox.startFreeTrial('premium')" 
                        class="w-full py-3.5 mb-3 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white rounded-xl font-bold hover:from-green-600 hover:via-emerald-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm md:text-base group relative overflow-hidden">
                        <span class="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
                        <span class="relative flex items-center justify-center gap-2">
                          <i class="fas fa-gift text-lg"></i>
                          <span class="inline md:hidden">2주 무료 체험</span>
                          <span class="hidden md:inline">2주 무료로 시작하기</span>
                          <i class="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform"></i>
                        </span>
                      </button>
                      
                      <!-- Regular Purchase Button -->
                      <button onclick="worvox.selectPlan('Premium')" 
                        class="w-full py-2.5 bg-white text-purple-600 border-2 border-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-all text-sm hover:border-purple-700">
                        바로 구매하기
                      </button>
                    </div>
                  </div>

                  <!-- B2B Plan -->
                  <div class="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-yellow-200 transition-all hover:shadow-2xl transform hover:-translate-y-1">
                    <div class="bg-gradient-to-br from-yellow-400 to-orange-400 p-6 text-center text-white">
                      <div class="text-4xl mb-3">🏢</div>
                      <h3 class="text-2xl font-bold mb-2">B2B</h3>
                      <div class="mb-4">
                        <span class="text-2xl font-bold">협의</span>
                      </div>
                      <p class="text-sm text-yellow-100">기업 맞춤 솔루션</p>
                    </div>
                    <div class="p-6">
                      <ul class="space-y-3 mb-6">
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700 font-semibold">관리자 대시보드</span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700 font-semibold">팀 분석 리포트</span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700">모든 Premium 기능</span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700">전담 지원팀</span>
                        </li>
                      </ul>
                      <button onclick="worvox.showPaymentStayTuned('B2B', 'Custom Pricing')" 
                        class="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-500 transition-all">
                        문의하기
                      </button>
                    </div>
                  </div>

                </div>

                <!-- 카테고리별 상세 비교 -->
                <div class="mt-12 mb-8">
                  <h2 class="text-3xl font-bold text-gray-800 mb-2 text-center">📊 상세 기능 비교</h2>
                  <p class="text-gray-600 text-center mb-8">플랜별 제공 기능을 카테고리별로 확인하세요</p>
                  
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    <!-- 기본 기능 -->
                    <div class="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100">
                      <div class="bg-gradient-to-r from-yellow-400 to-orange-400 p-4 text-white">
                        <h3 class="text-xl font-bold flex items-center">
                          <i class="fas fa-star mr-2"></i>
                          기본 기능
                        </h3>
                      </div>
                      <div class="p-6">
                        <table class="w-full text-sm">
                          <tbody class="divide-y divide-gray-100">
                            <tr>
                              <td class="py-3 text-gray-700">일일 AI 대화</td>
                              <td class="py-3 text-right">
                                <span class="text-gray-600">Free: 5회</span><br>
                                <span class="text-blue-600 font-semibold">Core+: 무제한</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">AI 대화 주제</td>
                              <td class="py-3 text-right">
                                <span class="text-gray-600">Free: 기본 3개</span><br>
                                <span class="text-blue-600 font-semibold">Core+: 전체 20개</span><br>
                                <span class="text-yellow-600 font-semibold">B2B: 커스텀</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">⏱️ 타이머 모드</td>
                              <td class="py-3 text-right">
                                <span class="text-gray-600">Free: 미제공</span><br>
                                <span class="text-blue-600">Core: 30회/일</span><br>
                                <span class="text-purple-600 font-semibold">Premium+: 무제한</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">🎬 시나리오 모드</td>
                              <td class="py-3 text-right">
                                <span class="text-gray-600">Free: 미제공</span><br>
                                <span class="text-blue-600">Core: 30회/일</span><br>
                                <span class="text-purple-600 font-semibold">Premium+: 무제한</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">🎓 시험 모드</td>
                              <td class="py-3 text-right">
                                <span class="text-gray-600">Free: 미제공</span><br>
                                <span class="text-blue-600">Core: 10회/일</span><br>
                                <span class="text-purple-600 font-semibold">Premium+: 무제한</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">대화 히스토리</td>
                              <td class="py-3 text-right">
                                <span class="text-gray-600">Free: 7일</span><br>
                                <span class="text-blue-600">Core: 30일</span><br>
                                <span class="text-purple-600 font-semibold">Premium+: 무제한</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">음성 인식/답변</td>
                              <td class="py-3 text-right">
                                <span class="text-green-600 font-semibold">모든 플랜 제공</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- 단어 학습 -->
                    <div class="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100">
                      <div class="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 text-white">
                        <h3 class="text-xl font-bold flex items-center">
                          <i class="fas fa-book mr-2"></i>
                          단어 학습
                        </h3>
                      </div>
                      <div class="p-6">
                        <table class="w-full text-sm">
                          <tbody class="divide-y divide-gray-100">
                            <tr>
                              <td class="py-3 text-gray-700">단어 검색</td>
                              <td class="py-3 text-right">
                                <span class="text-gray-600">Free: 일 10개</span><br>
                                <span class="text-blue-600 font-semibold">Core+: 무제한</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">개인 단어장</td>
                              <td class="py-3 text-right">
                                <span class="text-blue-600">Core: 500개</span><br>
                                <span class="text-purple-600 font-semibold">Premium+: 무제한</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">단어 퀴즈</td>
                              <td class="py-3 text-right">
                                <span class="text-blue-600 font-semibold">Core 이상</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">플래시카드</td>
                              <td class="py-3 text-right">
                                <span class="text-blue-600 font-semibold">Core 이상</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- AI 분석 & 피드백 -->
                    <div class="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100">
                      <div class="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
                        <h3 class="text-xl font-bold flex items-center">
                          <i class="fas fa-brain mr-2"></i>
                          AI 분석 & 피드백
                        </h3>
                      </div>
                      <div class="p-6">
                        <table class="w-full text-sm">
                          <tbody class="divide-y divide-gray-100">
                            <tr>
                              <td class="py-3 text-gray-700">발음 분석 AI</td>
                              <td class="py-3 text-right">
                                <span class="text-purple-600 font-semibold">Premium 이상</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">문법 첨삭</td>
                              <td class="py-3 text-right">
                                <span class="text-purple-600 font-semibold">Premium 이상</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">표현 제안</td>
                              <td class="py-3 text-right">
                                <span class="text-purple-600 font-semibold">Premium 이상</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">학습 리포트</td>
                              <td class="py-3 text-right">
                                <span class="text-purple-600 font-semibold">Premium 이상</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">약점 분석</td>
                              <td class="py-3 text-right">
                                <span class="text-purple-600">Premium: 주간</span><br>
                                <span class="text-yellow-600 font-semibold">B2B: 실시간</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- 게임화 & 동기부여 -->
                    <div class="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100">
                      <div class="bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white">
                        <h3 class="text-xl font-bold flex items-center">
                          <i class="fas fa-trophy mr-2"></i>
                          게임화 & 동기부여
                        </h3>
                      </div>
                      <div class="p-6">
                        <table class="w-full text-sm">
                          <tbody class="divide-y divide-gray-100">
                            <tr>
                              <td class="py-3 text-gray-700">레벨 & XP</td>
                              <td class="py-3 text-right">
                                <span class="text-green-600 font-semibold">모든 플랜</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">학습 스트릭</td>
                              <td class="py-3 text-right">
                                <span class="text-green-600 font-semibold">모든 플랜</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">배지 & 업적</td>
                              <td class="py-3 text-right">
                                <span class="text-gray-600">Free: 기본</span><br>
                                <span class="text-blue-600">Core: 고급</span><br>
                                <span class="text-purple-600">Premium: 프리미엄</span><br>
                                <span class="text-yellow-600 font-semibold">B2B: 전체</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">리워드</td>
                              <td class="py-3 text-right">
                                <span class="text-blue-600 font-semibold">Core 이상</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- 특별 훈련 모드 (Core/Premium) -->
                    <div class="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-purple-200">
                      <div class="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 text-white">
                        <h3 class="text-xl font-bold flex items-center">
                          <i class="fas fa-bolt mr-2"></i>
                          특별 훈련 모드
                        </h3>
                      </div>
                      <div class="p-6">
                        <table class="w-full text-sm">
                          <tbody class="divide-y divide-gray-100">
                            <tr>
                              <td class="py-3 text-gray-700">타이머 모드</td>
                              <td class="py-3 text-right">
                                <span class="text-blue-600">Core: 30회/일</span><br>
                                <span class="text-purple-600 font-semibold">Premium: 무제한</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">시나리오 모드</td>
                              <td class="py-3 text-right">
                                <span class="text-blue-600">Core: 30회/일</span><br>
                                <span class="text-purple-600 font-semibold">Premium: 무제한</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">시나리오 개수</td>
                              <td class="py-3 text-right">
                                <span class="text-blue-600 font-semibold">Core+: 30개</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">시험 모드 (OPIC 스타일)</td>
                              <td class="py-3 text-right">
                                <span class="text-blue-600">Core: 10회/일</span><br>
                                <span class="text-purple-600 font-semibold">Premium: 무제한</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">실전 압박 훈련</td>
                              <td class="py-3 text-right">
                                <span class="text-blue-600 font-semibold">Core 이상</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- 팀 & 관리 (B2B 전용) -->
                    <div class="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-yellow-200">
                      <div class="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 text-white">
                        <h3 class="text-xl font-bold flex items-center">
                          <i class="fas fa-users mr-2"></i>
                          팀 & 관리 기능
                        </h3>
                      </div>
                      <div class="p-6">
                        <table class="w-full text-sm">
                          <tbody class="divide-y divide-gray-100">
                            <tr>
                              <td class="py-3 text-gray-700">관리자 대시보드</td>
                              <td class="py-3 text-right">
                                <span class="text-yellow-600 font-semibold">B2B 전용</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">팀원 진도 추적</td>
                              <td class="py-3 text-right">
                                <span class="text-yellow-600 font-semibold">B2B 전용</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">팀 분석 리포트</td>
                              <td class="py-3 text-right">
                                <span class="text-yellow-600 font-semibold">B2B: 주간/월간</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">사용자 수</td>
                              <td class="py-3 text-right">
                                <span class="text-gray-600">Free-Premium: 1명</span><br>
                                <span class="text-yellow-600 font-semibold">B2B: 무제한</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">전담 매니저</td>
                              <td class="py-3 text-right">
                                <span class="text-yellow-600 font-semibold">B2B 전용</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- 고객 지원 -->
                    <div class="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100">
                      <div class="bg-gradient-to-r from-teal-500 to-cyan-500 p-4 text-white">
                        <h3 class="text-xl font-bold flex items-center">
                          <i class="fas fa-headset mr-2"></i>
                          고객 지원
                        </h3>
                      </div>
                      <div class="p-6">
                        <table class="w-full text-sm">
                          <tbody class="divide-y divide-gray-100">
                            <tr>
                              <td class="py-3 text-gray-700">우선 지원</td>
                              <td class="py-3 text-right">
                                <span class="text-purple-600 font-semibold">Premium 이상</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">맞춤형 교육 자료</td>
                              <td class="py-3 text-right">
                                <span class="text-yellow-600 font-semibold">B2B 전용</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">이메일 지원</td>
                              <td class="py-3 text-right">
                                <span class="text-green-600 font-semibold">모든 플랜</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                </div>

                <!-- Feature Comparison Table -->
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
                    <h2 class="text-2xl font-bold text-white">📊 기능 비교</h2>
                    <p class="text-indigo-100 mt-2">모든 플랜의 기능을 한눈에 비교해보세요</p>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full">
                      <thead class="bg-gray-50">
                        <tr>
                          <th class="px-6 py-4 text-left text-sm font-bold text-gray-700">기능</th>
                          <th class="px-6 py-4 text-center text-sm font-bold text-gray-700">Free</th>
                          <th class="px-6 py-4 text-center text-sm font-bold text-blue-700">Core</th>
                          <th class="px-6 py-4 text-center text-sm font-bold text-purple-700">Premium</th>
                          <th class="px-6 py-4 text-center text-sm font-bold text-yellow-700">B2B</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-200">
                        <!-- 기본 기능 섹션 -->
                        <tr class="bg-gray-100">
                          <td colspan="5" class="px-6 py-3 text-sm font-bold text-gray-700 uppercase">
                            <i class="fas fa-star text-yellow-500 mr-2"></i>기본 기능
                          </td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">일일 AI 대화 시간</td>
                          <td class="px-6 py-4 text-center text-sm text-gray-600">5분</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-blue-600">무제한</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">무제한</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">무제한</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">AI 대화 주제</td>
                          <td class="px-6 py-4 text-center text-sm text-gray-600">기본 3개</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-blue-600">전체 20개</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">전체 20개</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">전체 + 커스텀</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">음성 인식 (STT)</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">음성 답변 (TTS)</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">대화 히스토리</td>
                          <td class="px-6 py-4 text-center text-sm text-gray-600">7일</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-blue-600">30일</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">무제한</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">무제한</td>
                        </tr>

                        <!-- 단어 학습 섹션 -->
                        <tr class="bg-gray-100">
                          <td colspan="5" class="px-6 py-3 text-sm font-bold text-gray-700 uppercase">
                            <i class="fas fa-book text-blue-500 mr-2"></i>단어 학습
                          </td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">단어 검색</td>
                          <td class="px-6 py-4 text-center text-sm text-gray-600">일 10개</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-blue-600">무제한</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">무제한</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">무제한</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">개인 단어장</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-blue-600">최대 500개</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">무제한</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">무제한</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">단어 퀴즈</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">플래시카드</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>

                        <!-- AI 분석 & 피드백 섹션 -->
                        <tr class="bg-gray-100">
                          <td colspan="5" class="px-6 py-3 text-sm font-bold text-gray-700 uppercase">
                            <i class="fas fa-brain text-purple-500 mr-2"></i>AI 분석 & 피드백
                          </td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">발음 분석 AI</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">실시간 분석</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">실시간 분석</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">문법 첨삭</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">자동 교정</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">자동 교정</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">더 나은 표현 제안</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">문장별 제안</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">문장별 제안</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">학습 리포트</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">세션별 생성</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">세션별 생성</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">약점 분석</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">주간 리포트</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">실시간 추적</td>
                        </tr>

                        <!-- 게임화 & 동기부여 섹션 -->
                        <tr class="bg-gray-100">
                          <td colspan="5" class="px-6 py-3 text-sm font-bold text-gray-700 uppercase">
                            <i class="fas fa-trophy text-yellow-500 mr-2"></i>게임화 & 동기부여
                          </td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">레벨 & XP 시스템</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">학습 스트릭</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">배지 & 업적</td>
                          <td class="px-6 py-4 text-center text-sm text-gray-600">기본</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-blue-600">고급</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">프리미엄</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">전체</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">리워드 시스템</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>

                        <!-- 팀 & 관리 기능 섹션 -->
                        <tr class="bg-gray-100">
                          <td colspan="5" class="px-6 py-3 text-sm font-bold text-gray-700 uppercase">
                            <i class="fas fa-users text-indigo-500 mr-2"></i>팀 & 관리 기능
                          </td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">관리자 대시보드</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">전체 기능</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">팀원 진도 추적</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">실시간</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">팀 분석 리포트</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">주간/월간</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">사용자 수</td>
                          <td class="px-6 py-4 text-center text-sm text-gray-600">1명</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-blue-600">1명</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">1명</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">무제한</td>
                        </tr>

                        <!-- 고객 지원 섹션 -->
                        <tr class="bg-gray-100">
                          <td colspan="5" class="px-6 py-3 text-sm font-bold text-gray-700 uppercase">
                            <i class="fas fa-headset text-green-500 mr-2"></i>고객 지원
                          </td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">전담 매니저</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">우선 지원</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">맞춤형 교육 자료</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- FAQ Section -->
                <div class="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 md:p-8">
                  <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-question-circle text-blue-500 mr-2"></i>
                    자주 묻는 질문
                  </h3>
                  <div class="space-y-4">
                    <div class="bg-white rounded-lg p-4 shadow-sm">
                      <h4 class="font-semibold text-gray-800 mb-2">❓ 플랜은 언제든지 변경할 수 있나요?</h4>
                      <p class="text-sm text-gray-600">네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다. 변경된 플랜은 즉시 적용됩니다.</p>
                    </div>
                    <div class="bg-white rounded-lg p-4 shadow-sm">
                      <h4 class="font-semibold text-gray-800 mb-2">❓ 환불 정책은 어떻게 되나요?</h4>
                      <p class="text-sm text-gray-600">Core 및 Premium 플랜은 2주(14일) 무료 체험 기간이 제공됩니다. 무료 체험 기간 내 취소 시 요금이 청구되지 않습니다. 자세한 내용은 환불정책을 참조해주세요.</p>
                    </div>
                    <div class="bg-white rounded-lg p-4 shadow-sm">
                      <h4 class="font-semibold text-gray-800 mb-2">❓ B2B 플랜은 어떻게 신청하나요?</h4>
                      <p class="text-sm text-gray-600">contact@worvox.com으로 문의주시면 전담팀이 맞춤 견적을 제공해드립니다.</p>
                    </div>
                  </div>
                </div>

              </div>
              
              <!-- Footer -->
              ${this.getFooter()}
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading plan page:', error);
      alert('Failed to load plan page. Please try again.');
    }
  }

  // Vocabulary Learning Feature
  async showVocabularyLearning() {
    try {
      this.vocabularyWords = [];
      this.currentWordIndex = 0;
      
      // Fetch random words based on user's level
      const response = await axios.get(`/api/vocabulary/words/random`, {
        params: {
          difficulty: this.currentUser.level,
          limit: 20,
          userId: this.currentUser.id
        }
      });

      if (response.data.success && response.data.words.length > 0) {
        this.vocabularyWords = response.data.words;
        this.showVocabularyCard();
      } else {
        alert('No words available for your level. Try a different level!');
        this.showTopicSelection();
      }
    } catch (error) {
      console.error('Error loading vocabulary:', error);
      alert('Failed to load vocabulary. Please try again.');
      this.showTopicSelection();
    }
  }

  showVocabularyCard() {
    const word = this.vocabularyWords[this.currentWordIndex];
    const progress = this.currentWordIndex + 1;
    const total = this.vocabularyWords.length;

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="max-w-2xl mx-auto">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <button onclick="worvox.showTopicSelection()" 
              class="px-4 py-2 text-indigo-600 hover:text-indigo-800 transition-colors">
              <i class="fas fa-arrow-left mr-2"></i>Back
            </button>
            <div class="text-gray-600 font-semibold">
              ${progress} / ${total}
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-gray-200 rounded-full h-2 mb-8">
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300" 
                 style="width: ${(progress / total) * 100}%"></div>
          </div>

          <!-- Vocabulary Card -->
          <div class="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
            <!-- Word -->
            <div class="text-center mb-8">
              <div class="text-6xl md:text-7xl font-bold text-gray-800 mb-4">
                ${word.word}
              </div>
              <div class="text-gray-500 text-lg mb-2">
                ${word.part_of_speech || ''}
              </div>
              <div class="text-gray-400 text-sm mb-4">
                ${word.pronunciation || ''}
              </div>
              
              <!-- Pronunciation Button -->
              <button onclick="worvox.playWordPronunciation('${word.word}', '${word.meaning_ko}')" 
                class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all">
                <i class="fas fa-volume-up"></i>
                발음 듣기
              </button>
            </div>

            <!-- Meanings -->
            <div class="border-t border-gray-200 pt-6 mb-6">
              <!-- Korean Meaning -->
              <div class="mb-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-gray-600 text-sm">한국어 뜻</div>
                  <button onclick="worvox.playKoreanMeaning('${word.meaning_ko}')" 
                    class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-all">
                    <i class="fas fa-volume-up"></i>
                    듣기
                  </button>
                </div>
                <div class="text-2xl font-semibold text-gray-800">
                  ${word.meaning_ko}
                </div>
              </div>
              
              <!-- English Meaning -->
              ${word.meaning_en ? `
                <div class="pt-4 border-t border-gray-100">
                  <div class="text-gray-600 text-sm mb-2">English Definition</div>
                  <div class="text-lg text-gray-700 italic">
                    ${word.meaning_en}
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Example Sentence -->
            ${word.example_sentence ? `
              <div class="border-t border-gray-200 pt-6 mb-6">
                <div class="text-gray-600 text-sm mb-2">예문</div>
                <div class="text-lg text-gray-700 italic">
                  "${word.example_sentence}"
                </div>
              </div>
            ` : ''}

            <!-- Category Badge -->
            <div class="flex items-center justify-center gap-2 mb-8">
              <span class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                ${word.category || 'general'}
              </span>
              <span class="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                ${word.difficulty}
              </span>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-4">
              <button onclick="worvox.markWordAsLearned(${word.id}, false)" 
                class="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all">
                <i class="fas fa-times mr-2"></i>다시 보기
              </button>
              <button onclick="worvox.markWordAsLearned(${word.id}, true)" 
                class="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all">
                <i class="fas fa-check mr-2"></i>알았어요!
              </button>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex gap-4 mt-6">
            ${this.currentWordIndex > 0 ? `
              <button onclick="worvox.previousWord()" 
                class="px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-md">
                <i class="fas fa-chevron-left mr-2"></i>이전 단어
              </button>
            ` : ''}
            ${this.currentWordIndex < this.vocabularyWords.length - 1 ? `
              <button onclick="worvox.nextWord()" 
                class="ml-auto px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-md">
                다음 단어<i class="fas fa-chevron-right ml-2"></i>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  async playWordPronunciation(word, meaningKo) {
    try {
      // Play English word first
      const englishResponse = await axios.post('/api/tts/speak', {
        text: word,
        language: 'en'
      }, {
        responseType: 'blob'
      });

      const englishBlob = new Blob([englishResponse.data], { type: 'audio/mpeg' });
      const englishUrl = URL.createObjectURL(englishBlob);
      const englishAudio = new Audio(englishUrl);
      englishAudio.playbackRate = 0.85; // 15% slower for better pronunciation learning
      
      // When English audio ends, play Korean meaning
      englishAudio.onended = async () => {
        URL.revokeObjectURL(englishUrl);
        
        try {
          // Add a short pause before Korean
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Play Korean meaning
          const koreanResponse = await axios.post('/api/tts/speak', {
            text: meaningKo,
            language: 'ko'
          }, {
            responseType: 'blob'
          });

          const koreanBlob = new Blob([koreanResponse.data], { type: 'audio/mpeg' });
          const koreanUrl = URL.createObjectURL(koreanBlob);
          const koreanAudio = new Audio(koreanUrl);
          koreanAudio.playbackRate = 0.85;
          
          koreanAudio.onended = () => {
            URL.revokeObjectURL(koreanUrl);
          };
          
          koreanAudio.play();
        } catch (error) {
          console.error('Error playing Korean meaning:', error);
        }
      };
      
      englishAudio.play();
    } catch (error) {
      console.error('Error playing pronunciation:', error);
      alert('Failed to play pronunciation. Please try again.');
    }
  }

  async playKoreanMeaning(meaningKo) {
    try {
      const response = await axios.post('/api/tts/speak', {
        text: meaningKo,
        language: 'ko'
      }, {
        responseType: 'blob'
      });

      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.playbackRate = 0.85; // 15% slower for better comprehension
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
    } catch (error) {
      console.error('Error playing Korean meaning:', error);
      alert('Failed to play audio. Please try again.');
    }
  }

  async markWordAsLearned(wordId, isLearned) {
    try {
      await axios.post('/api/vocabulary/progress', {
        userId: this.currentUser.id,
        wordId: wordId,
        isLearned: isLearned
      });

      // Move to next word
      if (this.currentWordIndex < this.vocabularyWords.length - 1) {
        this.nextWord();
      } else {
        // Show completion message
        this.showVocabularyCompletion();
      }
    } catch (error) {
      console.error('Error marking word:', error);
      // Still allow moving to next word even if save fails
      if (this.currentWordIndex < this.vocabularyWords.length - 1) {
        this.nextWord();
      } else {
        this.showVocabularyCompletion();
      }
    }
  }

  nextWord() {
    if (this.currentWordIndex < this.vocabularyWords.length - 1) {
      this.currentWordIndex++;
      this.showVocabularyCard();
    }
  }

  previousWord() {
    if (this.currentWordIndex > 0) {
      this.currentWordIndex--;
      this.showVocabularyCard();
    }
  }

  showVocabularyCompletion() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center max-w-lg">
          <div class="text-6xl mb-6">🎉</div>
          <h2 class="text-3xl font-bold text-gray-800 mb-4">완료했습니다!</h2>
          <p class="text-gray-600 mb-8">
            ${this.vocabularyWords.length}개의 단어를 학습했습니다!
          </p>
          
          <div class="flex gap-4">
            <button onclick="worvox.showVocabularyLearning()" 
              class="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all">
              <i class="fas fa-redo mr-2"></i>더 학습하기
            </button>
            <button onclick="worvox.showTopicSelection()" 
              class="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all">
              <i class="fas fa-home mr-2"></i>홈으로
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Get daily usage count for a feature
  getDailyUsage(featureType) {
    // Map feature names from UI to internal storage keys
    const featureMap = {
      'ai_conversation': 'aiConversations',
      'pronunciation': 'pronunciationPractice',
      'word_search': 'wordSearch',
      'timer_mode': 'timerMode',
      'scenario_mode': 'scenarioMode'
    };
    
    const internalKey = featureMap[featureType] || featureType;
    
    if (!this.dailyUsage) {
      return 0;
    }
    return this.dailyUsage[internalKey] || 0;
  }

  // Premium user check helper
  isPremiumUser() {
    // Check if user has premium, core, or business plan
    // Check both currentUser.plan and userPlan for reliability
    const userPlan = this.currentUser?.plan || this.userPlan || 'free';
    return userPlan === 'premium' || userPlan === 'core' || userPlan === 'business';
  }

  // Check if user has Core or Premium (excludes Free)
  isCoreOrPremiumUser() {
    const userPlan = this.currentUser?.plan || this.userPlan || 'free';
    return userPlan === 'core' || userPlan === 'premium' || userPlan === 'business';
  }

  // ========================================
  // PHASE 1: Session Analysis & Report
  // ========================================
  
  showAnalysisLoading() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div class="text-center p-8">
          <div class="mb-6">
            <div class="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          </div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">🧠 AI가 대화를 분석하고 있어요</h2>
          <p class="text-gray-600 mb-6">잠시만 기다려주세요...</p>
          <div class="space-y-2 text-sm text-gray-500">
            <p class="animate-pulse">✓ 문법 체크 중</p>
            <p class="animate-pulse delay-100">✓ 어휘 분석 중</p>
            <p class="animate-pulse delay-200">✓ 개선점 찾는 중</p>
          </div>
        </div>
      </div>
    `;
  }

  async showSessionReport(reportId) {
    try {
      console.log('🔍 Fetching report with ID:', reportId);
      // 리포트 데이터 가져오기
      const response = await axios.get(`/api/analysis/reports/${reportId}`);
      console.log('📊 Report data received:', response.data);
      const { report, feedback } = response.data;
      
      // 에러와 제안 분리
      const errors = feedback.filter(f => f.type === 'error');
      const suggestions = feedback.filter(f => f.type === 'suggestion');
      
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
          ${this.getSidebar('conversation')}
          
          <div class="flex-1 overflow-y-auto">
            <div class="max-w-4xl mx-auto p-6 md:p-8">
              
              <!-- 헤더 -->
              <div class="text-center mb-8">
                <div class="text-6xl mb-4">🎉</div>
                <h1 class="text-3xl font-bold text-gray-800 mb-2">대화 분석 완료!</h1>
                <p class="text-gray-600">AI가 당신의 대화를 분석했어요</p>
              </div>
              
              <!-- 점수 카드 -->
              <div class="grid md:grid-cols-4 gap-4 mb-8">
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white text-center">
                  <div class="text-sm mb-1">종합 점수</div>
                  <div class="text-4xl font-bold">${report.overall_score}</div>
                  <div class="text-sm opacity-80">/ 100</div>
                </div>
                <div class="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
                  <div class="text-sm text-gray-600 mb-1">문법</div>
                  <div class="text-3xl font-bold text-gray-800">${report.grammar_score}</div>
                </div>
                <div class="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
                  <div class="text-sm text-gray-600 mb-1">어휘</div>
                  <div class="text-3xl font-bold text-gray-800">${report.vocabulary_score}</div>
                </div>
                <div class="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
                  <div class="text-sm text-gray-600 mb-1">유창성</div>
                  <div class="text-3xl font-bold text-gray-800">${report.fluency_score}</div>
                </div>
              </div>
              
              <!-- 고쳐야 할 문장 -->
              ${errors.length > 0 ? `
              <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span class="text-2xl">⚠️</span>
                  고쳐야 할 문장 TOP ${errors.length}
                </h2>
                <div class="space-y-4">
                  ${errors.map((err, i) => `
                    <div class="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                      <div class="flex items-start justify-between mb-2">
                        <span class="text-sm font-bold text-red-700">#${i + 1} ${this.getCategoryBadge(err.category)}</span>
                        <span class="text-xs px-2 py-1 bg-red-200 text-red-800 rounded-full">우선순위 ${err.priority}</span>
                      </div>
                      <div class="mb-2">
                        <div class="text-sm text-gray-600 mb-1">❌ 당신의 문장:</div>
                        <div class="text-gray-800 font-mono bg-white px-3 py-2 rounded">${err.original_text}</div>
                      </div>
                      <div class="mb-2">
                        <div class="text-sm text-gray-600 mb-1">✅ 올바른 표현:</div>
                        <div class="text-green-700 font-mono bg-green-50 px-3 py-2 rounded font-semibold">${err.improved_text}</div>
                      </div>
                      <div class="text-sm text-gray-700 bg-white px-3 py-2 rounded italic">
                        💡 ${err.explanation}
                      </div>
                      <button 
                        onclick="worvox.practiceSentence(${err.id}, '${err.improved_text.replace(/'/g, "\\'")}', ${report.session_id})"
                        class="mt-3 w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all">
                        🔄 이 문장 다시 연습하기
                      </button>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}
              
              <!-- 더 나은 표현 -->
              ${suggestions.length > 0 ? `
              <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span class="text-2xl">💡</span>
                  더 나은 표현
                </h2>
                <div class="space-y-4">
                  ${suggestions.map((sug, i) => `
                    <div class="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                      <div class="flex items-start justify-between mb-2">
                        <span class="text-sm font-bold text-blue-700">#${i + 1} ${this.getCategoryBadge(sug.category)}</span>
                      </div>
                      <div class="mb-2">
                        <div class="text-sm text-gray-600 mb-1">😊 당신의 표현:</div>
                        <div class="text-gray-800 font-mono bg-white px-3 py-2 rounded">${sug.original_text}</div>
                      </div>
                      <div class="mb-2">
                        <div class="text-sm text-gray-600 mb-1">🌟 더 자연스러운 표현:</div>
                        <div class="text-blue-700 font-mono bg-blue-50 px-3 py-2 rounded font-semibold">${sug.improved_text}</div>
                      </div>
                      <div class="text-sm text-gray-700 bg-white px-3 py-2 rounded italic">
                        💡 ${sug.explanation}
                      </div>
                      <button 
                        onclick="worvox.practiceSentence(${sug.id}, '${sug.improved_text.replace(/'/g, "\\'")}', ${report.session_id})"
                        class="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all">
                        🔄 이 표현 연습하기
                      </button>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}
              
              <!-- 액션 버튼 -->
              <div class="flex gap-4">
                <button 
                  onclick="worvox.showTopicSelection()"
                  class="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg">
                  🏠 홈으로 돌아가기
                </button>
                <button 
                  onclick="worvox.showHistory()"
                  class="flex-1 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold text-lg transition-all">
                  📚 히스토리 보기
                </button>
              </div>
              
            </div>
          </div>
        </div>
      `;
      
      console.log('✅ Report HTML rendered successfully');
      
    } catch (error) {
      console.error('❌ Show report error:', error);
      alert('리포트를 불러오는 데 실패했습니다:\n' + error.message);
      this.showTopicSelection();
    }
  }

  getCategoryBadge(category) {
    const badges = {
      'grammar': '<span class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">문법</span>',
      'vocabulary': '<span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">어휘</span>',
      'pronunciation': '<span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">발음</span>',
      'style': '<span class="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">스타일</span>',
    };
    return badges[category] || '';
  }

  async practiceSentence(feedbackId, sentence, sessionId) {
    // 확인 대화상자
    const confirmed = confirm(`🎯 문장 연습하기\n\n다음 문장을 따라 말해보세요:\n\n"${sentence}"\n\n준비되셨나요?`);
    
    if (!confirmed) return;
    
    // 피드백 완료 표시
    try {
      await axios.post(`/api/analysis/feedback/${feedbackId}/practice`);
    } catch (e) {
      console.error('Failed to mark as practiced:', e);
    }
    
    // 간단한 연습 UI 표시
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex items-center justify-center h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div class="max-w-2xl w-full p-8">
          <div class="bg-white rounded-3xl shadow-2xl p-8">
            <h2 class="text-3xl font-bold text-gray-800 mb-6 text-center">🎯 문장 연습</h2>
            
            <div class="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 mb-6">
              <p class="text-lg text-gray-800 font-semibold text-center leading-relaxed">
                ${sentence}
              </p>
            </div>
            
            <div class="text-center mb-6">
              <p class="text-gray-600 mb-4">이 문장을 3번 따라 말해보세요!</p>
              <div class="text-4xl mb-4">🎤</div>
              <p class="text-sm text-gray-500">연습을 완료했다면 아래 버튼을 눌러주세요</p>
            </div>
            
            <button 
              onclick="worvox.showSessionReportById(${sessionId})"
              class="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all mb-3">
              ✅ 연습 완료! 리포트로 돌아가기
            </button>
            
            <button 
              onclick="worvox.showTopicSelection()"
              class="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all">
              🏠 홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async showSessionReportById(sessionId) {
    try {
      // First try to get the session info to determine the mode
      const sessionResponse = await axios.get(`/api/sessions/${sessionId}`);
      const session = sessionResponse.data.session || sessionResponse.data;
      
      console.log('📍 Session data:', session);
      console.log('📍 Topic ID:', session.topic_id);
      
      // Determine if this is a mode report (timer/scenario/exam) or AI conversation
      if (session.topic_id === 999 || session.topic_id === 998 || session.topic_id === 997) {
        // Mode report: timer (999), scenario (998), exam (997)
        console.log('✅ Mode report detected, calling showModeReport');
        this.showModeReport(sessionId);
      } else {
        // AI conversation report
        console.log('✅ AI conversation detected, fetching analysis report');
        const response = await axios.get(`/api/analysis/sessions/${sessionId}/report`);
        if (response.data.success && response.data.report) {
          this.showSessionReport(response.data.report.id);
        } else {
          alert('이 세션의 리포트를 찾을 수 없습니다.');
          this.showHistory();
        }
      }
    } catch (error) {
      console.error('❌ Report error:', error);
      console.error('❌ Error details:', error.response?.data);
      alert('리포트를 불러오는 데 실패했습니다.\n' + (error.response?.data?.error || error.message));
      this.showHistory();
    }
  }
  
  async showModeReport(sessionId) {
    try {
      const response = await axios.get(`/api/mode-reports/session/${sessionId}`);
      if (!response.data.success) {
        this.showNoReportMessage(sessionId);
        return;
      }
      
      const { report } = response.data;
      const { modeType, reportData } = report;
      
      // Display report based on mode type
      if (modeType === 'timer') {
        this.displayTimerReport(reportData);
      } else if (modeType === 'scenario') {
        this.displayScenarioReport(reportData);
      } else if (modeType === 'exam') {
        this.displayExamReport(reportData);
      }
    } catch (error) {
      console.error('Failed to load mode report:', error);
      // Show friendly message instead of alert
      this.showNoReportMessage(sessionId);
    }
  }
  
  showNoReportMessage(sessionId) {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        ${this.getSidebar('history')}
        
        <div class="flex-1 flex items-center justify-center">
          <div class="max-w-md mx-auto text-center p-8">
            <div class="text-8xl mb-6">📊</div>
            <h2 class="text-3xl font-bold text-gray-800 mb-4">리포트를 찾을 수 없습니다</h2>
            <p class="text-gray-600 mb-8">
              이 세션에는 아직 분석 리포트가 생성되지 않았습니다.<br>
              연습을 완료하면 자동으로 리포트가 생성됩니다.
            </p>
            <div class="flex gap-4 justify-center">
              <button onclick="worvox.showHistory()" 
                class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all">
                <i class="fas fa-arrow-left mr-2"></i>히스토리로 돌아가기
              </button>
              <button onclick="worvox.showTopicSelection()" 
                class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all">
                <i class="fas fa-home mr-2"></i>홈으로
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  displayTimerReport(reportData) {
    const app = document.getElementById('app');
    const { 
      originalSentence, transcription, timeLimit, 
      accuracyScore, pronunciationScore, fluencyScore, 
      averageScore, rating, feedback 
    } = reportData;
    
    let ratingColor, ratingIcon;
    if (averageScore >= 80) {
      ratingColor = 'text-green-600';
      ratingIcon = '🌟';
    } else if (averageScore >= 60) {
      ratingColor = 'text-blue-600';
      ratingIcon = '👍';
    } else if (averageScore >= 40) {
      ratingColor = 'text-yellow-600';
      ratingIcon = '😊';
    } else {
      ratingColor = 'text-red-600';
      ratingIcon = '💪';
    }
    
    app.innerHTML = `
      <div class="flex h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        ${this.getSidebar('timer-mode')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Header -->
          <div class="bg-white border-b border-purple-200 px-4 md:px-6 py-3">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-800">
                <i class="fas fa-clock mr-2 text-purple-600"></i>타이머 모드 리포트
              </h2>
              <button onclick="worvox.showHistory()" class="text-gray-600 hover:text-gray-800">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
          </div>
          
          <!-- Content -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-8">
              <div class="max-w-4xl mx-auto">
                <!-- Rating Card -->
                <div class="bg-white rounded-2xl p-8 shadow-lg border-2 border-purple-200 mb-6 text-center">
                  <div class="text-6xl mb-4">${ratingIcon}</div>
                  <h2 class="text-3xl font-bold ${ratingColor} mb-2">${rating}</h2>
                  <div class="text-5xl font-bold text-purple-600 mb-2">${averageScore}점</div>
                  <p class="text-gray-600">평균 점수</p>
                </div>
                
                <!-- Score Breakdown -->
                <div class="bg-white rounded-2xl p-6 shadow-lg mb-6">
                  <h3 class="font-bold text-gray-900 mb-4">상세 점수</h3>
                  <div class="grid grid-cols-3 gap-4">
                    <div class="text-center">
                      <div class="text-3xl font-bold text-purple-600">${accuracyScore}</div>
                      <div class="text-sm text-gray-600">정확도</div>
                    </div>
                    <div class="text-center">
                      <div class="text-3xl font-bold text-blue-600">${pronunciationScore}</div>
                      <div class="text-sm text-gray-600">발음</div>
                    </div>
                    <div class="text-center">
                      <div class="text-3xl font-bold text-green-600">${fluencyScore}</div>
                      <div class="text-sm text-gray-600">유창성</div>
                    </div>
                  </div>
                </div>
                
                <!-- Original & Transcription -->
                <div class="bg-white rounded-2xl p-6 shadow-lg mb-6">
                  <div class="mb-4">
                    <div class="text-sm text-gray-500 mb-2">원문 (${timeLimit}초 제한)</div>
                    <div class="text-lg text-gray-900">${originalSentence}</div>
                  </div>
                  <div>
                    <div class="text-sm text-gray-500 mb-2">당신의 답변</div>
                    <div class="text-lg text-purple-600">${transcription}</div>
                  </div>
                </div>
                
                ${feedback ? `
                <div class="bg-blue-50 rounded-2xl p-6 shadow-lg mb-6">
                  <h3 class="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <i class="fas fa-lightbulb text-yellow-500"></i>
                    AI 피드백
                  </h3>
                  <p class="text-gray-700">${feedback}</p>
                </div>
                ` : ''}
                
                <div class="flex gap-4">
                  <button onclick="worvox.showTimerMode()" class="flex-1 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold">
                    <i class="fas fa-redo mr-2"></i>다시 도전
                  </button>
                  <button onclick="worvox.showHistory()" class="flex-1 px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold">
                    <i class="fas fa-arrow-left mr-2"></i>돌아가기
                  </button>
                </div>
              </div>
            </div>
            
            ${this.getFooter()}
          </div>
        </div>
      </div>
    `;
  }
  
  displayScenarioReport(reportData) {
    const app = document.getElementById('app');
    const { scenario, results, averageAccuracy, rating } = reportData;
    
    let ratingColor, ratingIcon;
    if (averageAccuracy >= 80) {
      ratingColor = 'text-green-600';
      ratingIcon = '🌟';
    } else if (averageAccuracy >= 60) {
      ratingColor = 'text-blue-600';
      ratingIcon = '👍';
    } else if (averageAccuracy >= 40) {
      ratingColor = 'text-yellow-600';
      ratingIcon = '😊';
    } else {
      ratingColor = 'text-red-600';
      ratingIcon = '💪';
    }
    
    app.innerHTML = `
      <div class="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        ${this.getSidebar('scenario-mode')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Header -->
          <div class="bg-white border-b border-blue-200 px-4 md:px-6 py-3">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-800">
                <i class="fas fa-film mr-2 text-blue-600"></i>${scenario.icon} ${scenario.title} - 리포트
              </h2>
              <button onclick="worvox.showHistory()" class="text-gray-600 hover:text-gray-800">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
          </div>
          
          <!-- Content -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-8">
              <div class="max-w-4xl mx-auto">
                <!-- Rating Card -->
                <div class="bg-white rounded-2xl p-8 shadow-lg border-2 border-blue-200 mb-6 text-center">
                  <div class="text-6xl mb-4">${ratingIcon}</div>
                  <h2 class="text-3xl font-bold ${ratingColor} mb-2">${rating}</h2>
                  <div class="text-5xl font-bold text-blue-600 mb-2">${averageAccuracy}%</div>
                  <p class="text-gray-600">평균 정확도</p>
                </div>
                
                <!-- Results -->
                <div class="bg-white rounded-2xl p-6 shadow-lg mb-6">
                  <h3 class="font-bold text-gray-900 mb-4">상세 결과</h3>
                  <div class="space-y-4">
                    ${results.map((result, index) => `
                      <div class="border border-gray-200 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-sm font-semibold text-gray-700">문장 ${index + 1}</span>
                          <div class="flex gap-2">
                            <span class="text-xs px-2 py-1 rounded ${result.accuracy >= 80 ? 'bg-green-100 text-green-700' : result.accuracy >= 60 ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}">
                              정확도 ${result.accuracy}%
                            </span>
                            ${result.pronunciation ? `<span class="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">발음 ${result.pronunciation}점</span>` : ''}
                          </div>
                        </div>
                        <div class="mb-2">
                          <div class="text-xs text-gray-600 mb-1">원문:</div>
                          <div class="bg-gray-50 rounded p-2 text-sm text-gray-900">${result.original}</div>
                        </div>
                        <div class="mb-3">
                          <div class="text-xs text-gray-600 mb-1">당신의 답변:</div>
                          <div class="bg-blue-50 rounded p-2 text-sm text-blue-900">${result.transcription}</div>
                        </div>
                        
                        <!-- AI Feedback (Premium) -->
                        ${result.aiFeedback ? `
                          <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
                            <div class="flex items-center gap-2 mb-2">
                              <i class="fas fa-robot text-blue-600"></i>
                              <span class="text-sm font-bold text-gray-900">💎 AI 발음 코칭</span>
                            </div>
                            <div class="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              ${result.aiFeedback}
                            </div>
                          </div>
                        ` : this.currentUser?.plan === 'premium' ? `
                          <div class="bg-gray-100 rounded-lg p-3 text-center">
                            <span class="text-xs text-gray-600">AI 피드백 생성 중...</span>
                          </div>
                        ` : `
                          <div class="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
                            <div class="blur-sm select-none pointer-events-none">
                              <div class="text-sm font-bold text-gray-900 mb-2">💎 AI 발음 코칭</div>
                              <div class="text-sm text-gray-700">발음과 억양에 대한 상세한 분석과 개선 방법을 AI가 알려드립니다.</div>
                            </div>
                            <div class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
                              <div class="text-center px-4">
                                <i class="fas fa-crown text-yellow-500 text-2xl mb-2"></i>
                                <div class="text-sm font-bold text-gray-900 mb-1">Premium 전용</div>
                                <p class="text-xs text-gray-600 mb-2">발음/억양 중심 AI 분석</p>
                                <button onclick="worvox.showPlan()" class="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg font-semibold transition-all">
                                  업그레이드
                                </button>
                              </div>
                            </div>
                          </div>
                        `}
                      </div>
                    `).join('')}
                  </div>
                </div>
                
                <div class="flex gap-4">
                  <button onclick="worvox.showScenarioMode()" class="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold">
                    <i class="fas fa-redo mr-2"></i>다시 도전
                  </button>
                  <button onclick="worvox.showHistory()" class="flex-1 px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold">
                    <i class="fas fa-arrow-left mr-2"></i>돌아가기
                  </button>
                </div>
              </div>
            </div>
            
            ${this.getFooter()}
          </div>
        </div>
      </div>
    `;
  }
  
  displayExamReport(reportData) {
    const app = document.getElementById('app');
    const { 
      answers, avgAccuracy, avgPronunciation, avgFluency, 
      overallAverage, opicLevel, opicDescription 
    } = reportData;
    
    let opicColor, opicBg;
    if (overallAverage >= 90) {
      opicColor = 'text-purple-600';
      opicBg = 'bg-purple-100';
    } else if (overallAverage >= 80) {
      opicColor = 'text-blue-600';
      opicBg = 'bg-blue-100';
    } else if (overallAverage >= 70) {
      opicColor = 'text-green-600';
      opicBg = 'bg-green-100';
    } else if (overallAverage >= 60) {
      opicColor = 'text-yellow-600';
      opicBg = 'bg-yellow-100';
    } else {
      opicColor = 'text-orange-600';
      opicBg = 'bg-orange-100';
    }
    
    app.innerHTML = `
      <div class="flex h-screen bg-gradient-to-br from-orange-50 to-red-50">
        ${this.getSidebar('exam-mode')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Header -->
          <div class="bg-white border-b border-orange-200 px-4 md:px-6 py-3">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-800">
                <i class="fas fa-graduation-cap mr-2 text-orange-600"></i>시험 모드 리포트
              </h2>
              <button onclick="worvox.showHistory()" class="text-gray-600 hover:text-gray-800">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
          </div>
          
          <!-- Content -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-8">
              <div class="max-w-4xl mx-auto">
                <!-- OPIC Level Card -->
                <div class="bg-white rounded-2xl p-8 shadow-lg border-2 border-orange-200 mb-6 text-center">
                  <div class="text-5xl mb-4">🎓</div>
                  <div class="inline-block ${opicBg} ${opicColor} px-6 py-2 rounded-full font-bold text-2xl mb-2">
                    ${opicLevel}
                  </div>
                  <p class="text-gray-600 mt-2">${opicDescription}</p>
                  <div class="text-5xl font-bold text-orange-600 mt-4">${overallAverage}점</div>
                </div>
                
                <!-- Average Scores -->
                <div class="bg-white rounded-2xl p-6 shadow-lg mb-6">
                  <h3 class="font-bold text-gray-900 mb-4">평균 점수</h3>
                  <div class="grid grid-cols-3 gap-4">
                    <div class="text-center">
                      <div class="text-3xl font-bold text-orange-600">${avgAccuracy}</div>
                      <div class="text-sm text-gray-600">정확도</div>
                    </div>
                    <div class="text-center">
                      <div class="text-3xl font-bold text-blue-600">${avgPronunciation}</div>
                      <div class="text-sm text-gray-600">발음</div>
                    </div>
                    <div class="text-center">
                      <div class="text-3xl font-bold text-green-600">${avgFluency}</div>
                      <div class="text-sm text-gray-600">유창성</div>
                    </div>
                  </div>
                </div>
                
                <!-- All Answers -->
                <div class="bg-white rounded-2xl p-6 shadow-lg mb-6">
                  <h3 class="font-bold text-gray-900 mb-4">답변 상세</h3>
                  <div class="space-y-6">
                    ${answers.map((answer, index) => `
                      <div class="border-l-4 border-orange-500 pl-4 pb-4">
                        <div class="flex items-center justify-between mb-2">
                          <span class="font-semibold text-gray-800">문제 ${index + 1}</span>
                          <div class="flex gap-2">
                            <span class="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700">정확도 ${answer.accuracy}</span>
                            <span class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">발음 ${answer.pronunciation}</span>
                            <span class="text-xs px-2 py-1 rounded bg-green-100 text-green-700">유창성 ${answer.fluency}</span>
                          </div>
                        </div>
                        
                        <!-- Question -->
                        <div class="text-sm text-gray-900 mb-1"><strong>Q:</strong> ${answer.question || answer.questionEn}</div>
                        ${(answer.questionKR || answer.questionKr) ? `<div class="text-xs text-gray-500 mb-2">${answer.questionKR || answer.questionKr}</div>` : ''}
                        
                        <!-- User Answer -->
                        <div class="bg-gray-50 rounded-lg p-3 mb-3">
                          <div class="text-xs text-gray-600 mb-1">당신의 답변:</div>
                          <div class="text-sm text-gray-700">${answer.transcription || '(답변 없음)'}</div>
                        </div>
                        
                        <!-- AI Feedback (Premium) -->
                        ${answer.improvedAnswer ? `
                          <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
                            <div class="flex items-center gap-2 mb-2">
                              <i class="fas fa-lightbulb text-yellow-500"></i>
                              <span class="text-sm font-bold text-gray-900">💡 AI 피드백</span>
                            </div>
                            <div class="text-xs text-gray-600 mb-2">더 나은 답변 (예시):</div>
                            <div class="text-sm text-blue-900 font-medium mb-1">${answer.improvedAnswer}</div>
                            ${answer.improvedAnswerKR ? `<div class="text-xs text-gray-600 mb-2">${answer.improvedAnswerKR}</div>` : ''}
                            ${answer.keyPoints && answer.keyPoints.length > 0 ? `
                              <div class="mt-3 space-y-1">
                                <div class="text-xs font-semibold text-gray-700">핵심 포인트:</div>
                                ${answer.keyPoints.map(point => `
                                  <div class="flex items-start gap-2">
                                    <i class="fas fa-check-circle text-green-500 text-xs mt-0.5"></i>
                                    <span class="text-xs text-gray-700">${point}</span>
                                  </div>
                                `).join('')}
                              </div>
                            ` : ''}
                          </div>
                        ` : this.currentUser?.plan === 'premium' ? `
                          <div class="bg-gray-100 rounded-lg p-3 text-center">
                            <span class="text-xs text-gray-600">AI 피드백 생성 중...</span>
                          </div>
                        ` : `
                          <div class="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
                            <div class="blur-sm select-none pointer-events-none">
                              <div class="text-xs font-bold text-gray-900 mb-2">💡 AI 피드백</div>
                              <div class="text-xs text-gray-700">더 나은 표현과 핵심 포인트를 AI가 분석해드립니다.</div>
                            </div>
                            <div class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
                              <div class="text-center px-4">
                                <i class="fas fa-crown text-yellow-500 text-2xl mb-2"></i>
                                <div class="text-xs font-bold text-gray-900 mb-1">Premium 전용</div>
                                <button onclick="worvox.showPlan()" class="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg font-semibold transition-all">
                                  업그레이드
                                </button>
                              </div>
                            </div>
                          </div>
                        `}
                      </div>
                    `).join('')}
                  </div>
                </div>
                
                <div class="flex gap-4">
                  <button onclick="worvox.showExamMode()" class="flex-1 px-6 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold">
                    <i class="fas fa-redo mr-2"></i>다시 시험보기
                  </button>
                  <button onclick="worvox.showHistory()" class="flex-1 px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold">
                    <i class="fas fa-arrow-left mr-2"></i>돌아가기
                  </button>
                </div>
              </div>
            </div>
            
            ${this.getFooter()}
          </div>
        </div>
      </div>
    `;
  }
  
  // ========================================
  // End of PHASE 1 Functions
  // ========================================

  // Show Terms of Service
  showTerms() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
        ${this.getSidebar('home')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Mobile Header -->
          <div class="md:hidden bg-white border-b border-gray-200 px-4 py-3">
            <div class="flex items-center justify-between">
              <button onclick="worvox.showTopicSelection()" class="text-gray-600">
                <i class="fas fa-arrow-left text-xl"></i>
              </button>
              <h1 class="text-lg font-semibold text-gray-800">이용약관</h1>
              <div class="w-6"></div>
            </div>
          </div>
          
          <!-- Desktop Top Bar -->
          <div class="hidden md:flex bg-white border-b border-gray-200 px-6 py-3 items-center">
            <button onclick="worvox.showTopicSelection()" class="text-gray-600 hover:text-gray-800 mr-4">
              <i class="fas fa-arrow-left text-xl"></i>
            </button>
            <h2 class="text-lg font-semibold text-gray-800">이용약관</h2>
          </div>
          
          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-8">
              <div class="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6 md:p-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-6">WorVox 이용약관</h1>
                <p class="text-sm text-gray-500 mb-8">최종 업데이트: 2026년 2월 24일</p>
                
                <div class="space-y-8 text-gray-700">
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제1조 (목적)</h2>
                    <p class="leading-relaxed">
                      본 약관은 위아솔루션즈(이하 "회사")가 제공하는 WorVox 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                    </p>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제2조 (정의)</h2>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li><strong>"서비스"</strong>란 회사가 제공하는 AI 기반 영어 학습 플랫폼 WorVox를 의미합니다.</li>
                      <li><strong>"이용자"</strong>란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
                      <li><strong>"회원"</strong>이란 회사와 서비스 이용계약을 체결하고 회원 ID를 부여받은 자를 말합니다.</li>
                      <li><strong>"유료 서비스"</strong>란 회사가 유료로 제공하는 Premium, Business 플랜 및 Real Conversation 수업권 등을 말합니다.</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제3조 (약관의 효력 및 변경)</h2>
                    <ol class="list-decimal pl-6 space-y-2 leading-relaxed">
                      <li>본 약관은 서비스를 이용하고자 하는 모든 이용자에게 그 효력이 발생합니다.</li>
                      <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있습니다.</li>
                      <li>약관이 변경될 경우, 회사는 변경사항을 시행일로부터 최소 7일 전에 공지합니다.</li>
                      <li>이용자가 변경된 약관에 동의하지 않는 경우, 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
                    </ol>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제4조 (회원 가입 및 계정)</h2>
                    <ol class="list-decimal pl-6 space-y-2 leading-relaxed">
                      <li>회원 가입은 이용자가 약관에 동의하고 회사가 정한 가입 양식에 따라 회원 정보를 기입하여 신청합니다.</li>
                      <li>회사는 다음 각 호의 경우 회원 가입을 거부하거나 승인을 유보할 수 있습니다:
                        <ul class="list-disc pl-6 mt-2 space-y-1">
                          <li>타인의 명의를 도용한 경우</li>
                          <li>허위 정보를 기재한 경우</li>
                          <li>이미 가입된 회원인 경우</li>
                          <li>기타 회사가 정한 이용 신청 요건을 충족하지 못한 경우</li>
                        </ul>
                      </li>
                      <li>회원은 계정 정보를 안전하게 관리할 책임이 있으며, 타인에게 양도하거나 대여할 수 없습니다.</li>
                    </ol>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제5조 (서비스의 제공)</h2>
                    <ol class="list-decimal pl-6 space-y-2 leading-relaxed">
                      <li>회사는 다음과 같은 서비스를 제공합니다:
                        <ul class="list-disc pl-6 mt-2 space-y-1">
                          <li>AI 영어 대화 연습</li>
                          <li>발음 연습 및 피드백</li>
                          <li>단어장 및 어휘 학습</li>
                          <li>학습 통계 및 분석</li>
                          <li>Real Conversation (1:1 원어민 수업)</li>
                          <li>기타 회사가 추가 개발하거나 제휴를 통해 제공하는 서비스</li>
                        </ul>
                      </li>
                      <li>서비스는 연중무휴, 1일 24시간 제공을 원칙으로 합니다. 단, 시스템 점검 등 필요한 경우 서비스를 일시 중단할 수 있습니다.</li>
                      <li>회사는 서비스 향상을 위해 서비스의 내용을 변경하거나 추가할 수 있습니다.</li>
                    </ol>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제6조 (유료 서비스)</h2>
                    <ol class="list-decimal pl-6 space-y-2 leading-relaxed">
                      <li>회사는 무료 서비스와 유료 서비스를 구분하여 제공할 수 있습니다.</li>
                      <li>유료 서비스의 요금 및 결제 방법은 각 서비스 페이지에 명시됩니다.</li>
                      <li>Premium 및 Business 플랜은 월 단위 정기결제로 제공됩니다.</li>
                      <li>Real Conversation 수업권은 일회성 결제로 제공되며, 구매 후 유효기간 내 자유롭게 사용할 수 있습니다.</li>
                      <li>유료 서비스 이용 요금의 환불은 환불정책에 따릅니다.</li>
                    </ol>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제7조 (회원의 의무)</h2>
                    <ol class="list-decimal pl-6 space-y-2 leading-relaxed">
                      <li>회원은 다음 행위를 해서는 안 됩니다:
                        <ul class="list-disc pl-6 mt-2 space-y-1">
                          <li>허위 정보 등록 또는 타인의 정보 도용</li>
                          <li>회사의 서비스 운영을 방해하는 행위</li>
                          <li>타인의 명예를 훼손하거나 불이익을 주는 행위</li>
                          <li>서비스를 영리 목적으로 이용하는 행위</li>
                          <li>저작권 등 타인의 권리를 침해하는 행위</li>
                          <li>음란물, 불법 정보 등을 게시하는 행위</li>
                        </ul>
                      </li>
                      <li>회원은 관련 법령, 본 약관, 이용안내 및 주의사항 등을 준수해야 합니다.</li>
                    </ol>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제8조 (회원 탈퇴 및 자격 상실)</h2>
                    <ol class="list-decimal pl-6 space-y-2 leading-relaxed">
                      <li>회원은 언제든지 회사에 탈퇴를 요청할 수 있으며, 회사는 즉시 회원 탈퇴를 처리합니다.</li>
                      <li>회사는 회원이 본 약관을 위반한 경우 사전 통보 후 회원 자격을 제한 또는 정지시킬 수 있습니다.</li>
                      <li>회원 탈퇴 시 남은 유료 서비스 기간에 대해서는 환불정책에 따라 처리됩니다.</li>
                    </ol>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제9조 (면책 조항)</h2>
                    <ol class="list-decimal pl-6 space-y-2 leading-relaxed">
                      <li>회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
                      <li>회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임지지 않습니다.</li>
                      <li>회사는 이용자가 서비스를 통해 얻은 정보나 자료로 인한 손해에 대해 책임지지 않습니다.</li>
                    </ol>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제10조 (준거법 및 재판관할)</h2>
                    <p class="leading-relaxed">
                      본 약관과 회사와 이용자 간의 서비스 이용 계약에 대해서는 대한민국 법률을 준거법으로 하며, 분쟁 발생 시 회사의 본사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.
                    </p>
                  </section>
                  
                  <section class="pt-6 border-t border-gray-200">
                    <p class="text-sm text-gray-600">
                      <strong>시행일:</strong> 본 약관은 2026년 2월 24일부터 시행됩니다.
                    </p>
                  </section>
                </div>
              </div>
              
              ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Show Privacy Policy
  showPrivacy() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
        ${this.getSidebar('home')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Mobile Header -->
          <div class="md:hidden bg-white border-b border-gray-200 px-4 py-3">
            <div class="flex items-center justify-between">
              <button onclick="worvox.showTopicSelection()" class="text-gray-600">
                <i class="fas fa-arrow-left text-xl"></i>
              </button>
              <h1 class="text-lg font-semibold text-gray-800">개인정보처리방침</h1>
              <div class="w-6"></div>
            </div>
          </div>
          
          <!-- Desktop Top Bar -->
          <div class="hidden md:flex bg-white border-b border-gray-200 px-6 py-3 items-center">
            <button onclick="worvox.showTopicSelection()" class="text-gray-600 hover:text-gray-800 mr-4">
              <i class="fas fa-arrow-left text-xl"></i>
            </button>
            <h2 class="text-lg font-semibold text-gray-800">개인정보처리방침</h2>
          </div>
          
          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-8">
              <div class="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6 md:p-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-6">개인정보처리방침</h1>
                <p class="text-sm text-gray-500 mb-8">최종 업데이트: 2026년 2월 24일</p>
                
                <div class="space-y-8 text-gray-700">
                  <section>
                    <p class="leading-relaxed mb-4">
                      위아솔루션즈(이하 "회사")는 이용자의 개인정보를 중요시하며, "정보통신망 이용촉진 및 정보보호에 관한 법률", "개인정보보호법" 등 관련 법령을 준수하고 있습니다.
                    </p>
                    <p class="leading-relaxed">
                      회사는 개인정보처리방침을 통하여 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
                    </p>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">1. 수집하는 개인정보의 항목 및 수집방법</h2>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">가. 수집하는 개인정보의 항목</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li><strong>회원가입 시:</strong> 이메일 주소, 이름, 프로필 사진(선택), 학습 레벨</li>
                      <li><strong>소셜 로그인 시:</strong> Google 계정 정보(이메일, 이름, 프로필 사진)</li>
                      <li><strong>유료 서비스 이용 시:</strong> 결제 정보(카드번호는 PG사에서 처리하며 회사는 저장하지 않음)</li>
                      <li><strong>서비스 이용 과정에서 자동 수집:</strong> IP 주소, 쿠키, 접속 로그, 서비스 이용 기록, 학습 데이터</li>
                    </ul>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">나. 개인정보 수집방법</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>회원가입 및 서비스 이용 과정에서 이용자가 직접 입력</li>
                      <li>Google 소셜 로그인을 통한 자동 수집</li>
                      <li>서비스 이용 과정에서 자동으로 생성되어 수집</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">2. 개인정보의 수집 및 이용목적</h2>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">가. 회원관리</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li>회원제 서비스 제공에 따른 본인 확인</li>
                      <li>개인 식별, 불량회원의 부정 이용 방지</li>
                      <li>가입 의사 확인, 연령 확인</li>
                      <li>고충처리, 분쟁 조정을 위한 기록 보존</li>
                    </ul>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">나. 서비스 제공</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li>AI 영어 학습 서비스 제공</li>
                      <li>학습 진도 및 통계 관리</li>
                      <li>맞춤형 학습 콘텐츠 추천</li>
                      <li>Real Conversation 수업 예약 및 관리</li>
                    </ul>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">다. 요금 결제 및 정산</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>유료 서비스 이용에 따른 요금 결제</li>
                      <li>구매 및 결제, 환불 처리</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">3. 개인정보의 보유 및 이용기간</h2>
                    <p class="leading-relaxed mb-4">
                      회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체없이 파기합니다. 단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.
                    </p>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">가. 회사 내부 방침에 의한 정보보유</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li><strong>부정이용 방지:</strong> 부정 이용 기록 - 1년</li>
                    </ul>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">나. 관련 법령에 의한 정보보유</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li><strong>계약 또는 청약철회 등에 관한 기록:</strong> 5년 (전자상거래법)</li>
                      <li><strong>대금결제 및 재화 등의 공급에 관한 기록:</strong> 5년 (전자상거래법)</li>
                      <li><strong>소비자 불만 또는 분쟁처리에 관한 기록:</strong> 3년 (전자상거래법)</li>
                      <li><strong>표시/광고에 관한 기록:</strong> 6개월 (전자상거래법)</li>
                      <li><strong>접속에 관한 기록:</strong> 3개월 (통신비밀보호법)</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">4. 개인정보의 파기절차 및 방법</h2>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">가. 파기절차</h3>
                    <p class="leading-relaxed mb-4">
                      이용자가 회원가입 등을 위해 입력한 정보는 목적이 달성된 후 별도의 DB로 옮겨져(종이의 경우 별도의 서류함) 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라(보유 및 이용기간 참조) 일정 기간 저장된 후 파기됩니다.
                    </p>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">나. 파기방법</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li><strong>전자적 파일형태:</strong> 복구 불가능한 방법으로 영구 삭제</li>
                      <li><strong>종이 문서:</strong> 분쇄기로 분쇄하거나 소각</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">5. 개인정보의 제3자 제공</h2>
                    <p class="leading-relaxed mb-4">
                      회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다:
                    </p>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>이용자가 사전에 동의한 경우</li>
                      <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">6. 개인정보 처리위탁</h2>
                    <p class="leading-relaxed mb-4">
                      회사는 서비스 향상을 위해 아래와 같이 개인정보를 위탁하고 있으며, 관계 법령에 따라 위탁계약 시 개인정보가 안전하게 관리될 수 있도록 필요한 사항을 규정하고 있습니다.
                    </p>
                    <div class="overflow-x-auto">
                      <table class="min-w-full border border-gray-300">
                        <thead class="bg-gray-100">
                          <tr>
                            <th class="border border-gray-300 px-4 py-2 text-left">수탁업체</th>
                            <th class="border border-gray-300 px-4 py-2 text-left">위탁 업무 내용</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td class="border border-gray-300 px-4 py-2">NHN KCP</td>
                            <td class="border border-gray-300 px-4 py-2">결제 처리 및 정산</td>
                          </tr>
                          <tr>
                            <td class="border border-gray-300 px-4 py-2">Cloudflare</td>
                            <td class="border border-gray-300 px-4 py-2">서버 호스팅 및 데이터 저장</td>
                          </tr>
                          <tr>
                            <td class="border border-gray-300 px-4 py-2">Google</td>
                            <td class="border border-gray-300 px-4 py-2">소셜 로그인 처리</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">7. 이용자 및 법정대리인의 권리와 그 행사방법</h2>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있습니다.</li>
                      <li>이용자는 언제든지 회원탈퇴를 통해 개인정보의 수집 및 이용 동의를 철회할 수 있습니다.</li>
                      <li>만 14세 미만 아동의 경우, 법정대리인이 아동의 개인정보를 조회하거나 수정할 권리, 수집 및 이용 동의를 철회할 권리를 가집니다.</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">8. 개인정보 보호책임자</h2>
                    <p class="leading-relaxed mb-4">
                      회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                    </p>
                    <div class="bg-gray-50 rounded-lg p-4">
                      <p class="font-semibold mb-2">▶ 개인정보 보호책임자</p>
                      <ul class="space-y-1 text-sm">
                        <li>성명: 이강돈</li>
                        <li>직책: 대표</li>
                        <li>이메일: support@worvox.com</li>
                      </ul>
                    </div>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">9. 개인정보 자동 수집 장치의 설치·운영 및 거부</h2>
                    <p class="leading-relaxed mb-4">
                      회사는 이용자에게 개인화되고 맞춤화된 서비스를 제공하기 위해 이용자의 정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.
                    </p>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li><strong>쿠키의 사용 목적:</strong> 로그인 세션 유지, 서비스 이용 편의 제공</li>
                      <li><strong>쿠키 설정 거부 방법:</strong> 웹브라우저 옵션 설정을 통해 쿠키 저장을 거부할 수 있습니다. 단, 쿠키 저장을 거부할 경우 일부 서비스 이용에 어려움이 있을 수 있습니다.</li>
                    </ul>
                  </section>
                  
                  <section class="pt-6 border-t border-gray-200">
                    <p class="text-sm text-gray-600">
                      <strong>시행일:</strong> 본 개인정보처리방침은 2026년 2월 24일부터 시행됩니다.
                    </p>
                  </section>
                </div>
              </div>
              
              ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Show Refund Policy
  showRefund() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
        ${this.getSidebar('home')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Mobile Header -->
          <div class="md:hidden bg-white border-b border-gray-200 px-4 py-3">
            <div class="flex items-center justify-between">
              <button onclick="worvox.showTopicSelection()" class="text-gray-600">
                <i class="fas fa-arrow-left text-xl"></i>
              </button>
              <h1 class="text-lg font-semibold text-gray-800">환불정책</h1>
              <div class="w-6"></div>
            </div>
          </div>
          
          <!-- Desktop Top Bar -->
          <div class="hidden md:flex bg-white border-b border-gray-200 px-6 py-3 items-center">
            <button onclick="worvox.showTopicSelection()" class="text-gray-600 hover:text-gray-800 mr-4">
              <i class="fas fa-arrow-left text-xl"></i>
            </button>
            <h2 class="text-lg font-semibold text-gray-800">환불정책</h2>
          </div>
          
          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-8">
              <div class="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6 md:p-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-6">환불정책</h1>
                <p class="text-sm text-gray-500 mb-8">최종 업데이트: 2026년 2월 24일</p>
                
                <div class="space-y-8 text-gray-700">
                  <section>
                    <p class="leading-relaxed mb-4">
                      위아솔루션즈(이하 "회사")는 "전자상거래 등에서의 소비자보호에 관한 법률" 등 관련 법령을 준수하며, 공정하고 투명한 환불정책을 운영합니다.
                    </p>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">1. Core/Premium 플랜 환불</h2>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">가. 2주 무료 체험 기간</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li>Core 및 Premium 플랜 가입 시 <strong>2주(14일) 무료 체험</strong>이 제공됩니다.</li>
                      <li>무료 체험 기간 내 취소 시 <strong>요금이 청구되지 않습니다</strong>.</li>
                      <li>무료 체험 기간 종료 후 자동으로 정기결제가 시작됩니다.</li>
                      <li>체험 기간 중 카드 등록이 필요하며, 취소하지 않으면 체험 종료 시 자동 결제됩니다.</li>
                    </ul>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">나. 정기결제 중도 해지</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li>언제든지 구독을 취소할 수 있습니다.</li>
                      <li>취소 시점까지의 요금은 환불되지 않으며, 현재 결제 기간이 종료될 때까지 서비스를 계속 이용할 수 있습니다.</li>
                      <li><strong>예시:</strong> 2월 1일에 월 구독을 시작하고 2월 15일에 취소한 경우
                        <ul class="list-disc pl-6 mt-2 space-y-1">
                          <li>2월 말까지 서비스 이용 가능</li>
                          <li>3월 1일부터 Free 플랜으로 자동 전환</li>
                          <li>이미 결제된 2월 요금은 환불 불가</li>
                        </ul>
                      </li>
                    </ul>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">다. 서비스 장애로 인한 환불</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>회사의 귀책사유로 서비스를 이용하지 못한 경우, 이용하지 못한 기간만큼 일할 계산하여 환불해드립니다.</li>
                      <li>환불 신청은 support@worvox.com으로 연락 주시기 바랍니다.</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">2. Real Conversation 수업권 환불</h2>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">가. 환불 가능 조건</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li><strong>미사용 수업권:</strong> 한 번도 사용하지 않은 수업권은 구매일로부터 <strong>7일 이내</strong> 전액 환불 가능합니다.</li>
                      <li><strong>부분 사용 수업권:</strong> 일부 수업을 사용한 경우, 남은 수업권에 대해 환불 가능합니다.
                        <ul class="list-disc pl-6 mt-2 space-y-1">
                          <li>환불금액 = (총 구매금액 / 전체 수업 횟수) × 남은 수업 횟수</li>
                          <li>단, 사용한 수업은 정가 기준으로 차감됩니다.</li>
                        </ul>
                      </li>
                    </ul>
                    
                    <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                      <p class="font-semibold mb-2">📌 환불 계산 예시</p>
                      <p class="text-sm mb-2"><strong>4회 수업권 ₩180,000 구매 (회당 ₩45,000) 후 2회 사용</strong></p>
                      <ul class="text-sm space-y-1">
                        <li>• 사용한 수업: 2회 × ₩50,000(정가) = ₩100,000</li>
                        <li>• 환불 금액: ₩180,000 - ₩100,000 = <strong>₩80,000</strong></li>
                      </ul>
                    </div>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">나. 환불 불가 조건</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li>수업 예약 후 <strong>무단 불참(No-Show)</strong>한 경우 해당 수업은 사용으로 간주됩니다.</li>
                      <li>수업 시작 <strong>24시간 이내 취소</strong>한 경우 환불 불가합니다.</li>
                      <li>구매일로부터 <strong>30일 경과</strong> 후에는 환불이 제한될 수 있습니다.</li>
                    </ul>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">다. 수업 취소 및 일정 변경</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>수업 시작 <strong>24시간 전</strong>까지 무료로 취소 또는 일정 변경 가능합니다.</li>
                      <li>24시간 이내 취소 시 해당 수업권 1회가 차감됩니다.</li>
                      <li>강사의 사정으로 수업이 취소된 경우 수업권이 복구됩니다.</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">3. 환불 처리 절차</h2>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">가. 환불 신청 방법</h3>
                    <ol class="list-decimal pl-6 space-y-2 leading-relaxed mb-4">
                      <li>이메일로 환불 신청: <strong>support@worvox.com</strong></li>
                      <li>필수 포함 정보:
                        <ul class="list-disc pl-6 mt-2 space-y-1">
                          <li>이름 및 이메일 주소</li>
                          <li>구매 내역 (영수증 또는 주문번호)</li>
                          <li>환불 사유</li>
                          <li>환불 받을 계좌번호 (예금주, 은행명, 계좌번호)</li>
                        </ul>
                      </li>
                    </ol>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">나. 환불 처리 기간</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li>환불 신청 접수 후 <strong>영업일 기준 3~5일 이내</strong> 검토 후 승인 여부를 안내해드립니다.</li>
                      <li>승인 후 <strong>3~7영업일 이내</strong> 환불 처리됩니다.</li>
                      <li>신용카드 결제의 경우 카드사 정책에 따라 처리 기간이 다를 수 있습니다.</li>
                    </ul>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">다. 환불 수단</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li><strong>신용카드 결제:</strong> 결제 취소 처리 (카드사 정책에 따라 1~2개월 소요)</li>
                      <li><strong>계좌이체/무통장입금:</strong> 고객 지정 계좌로 환불</li>
                      <li><strong>간편결제:</strong> 각 결제수단별 정책에 따름</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">4. 환불 제한 사항</h2>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>부정한 방법으로 서비스를 이용한 경우</li>
                      <li>이용약관을 위반하여 서비스 이용이 제한된 경우</li>
                      <li>타인 명의를 도용하거나 허위 정보로 가입한 경우</li>
                      <li>과도한 서비스 남용으로 판단되는 경우</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">5. 고객 지원</h2>
                    <p class="leading-relaxed mb-4">
                      환불과 관련하여 궁금한 사항이 있으시면 언제든지 문의해주시기 바랍니다.
                    </p>
                    <div class="bg-gray-50 rounded-lg p-4">
                      <p class="font-semibold mb-2">▶ 고객 지원 연락처</p>
                      <ul class="space-y-1 text-sm">
                        <li>이메일: support@worvox.com</li>
                        <li>운영 시간: 평일 09:00 - 18:00 (주말 및 공휴일 제외)</li>
                        <li>응답 시간: 영업일 기준 24시간 이내</li>
                      </ul>
                    </div>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">6. 소비자 피해 보상</h2>
                    <p class="leading-relaxed">
                      본 환불정책에 명시되지 않은 사항에 대해서는 "전자상거래 등에서의 소비자보호에 관한 법률" 등 관련 법령 및 회사의 이용약관에 따릅니다.
                    </p>
                  </section>
                  
                  <section class="pt-6 border-t border-gray-200">
                    <p class="text-sm text-gray-600">
                      <strong>시행일:</strong> 본 환불정책은 2026년 2월 24일부터 시행됩니다.
                    </p>
                  </section>
                </div>
              </div>
              
              ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Show user profile/settings page
  async showProfile() {
    const app = document.getElementById('app');
    
    // Determine auth provider for display
    const authProvider = this.currentUser.auth_provider || 'email';
    const isGoogleAuth = authProvider === 'google';
    const isEmailAuth = authProvider === 'email';
    
    app.innerHTML = `
      <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
        <!-- Sidebar -->
        ${this.getSidebar('profile')}
        
        <!-- Main Content -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Header -->
          <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
            <div class="flex items-center gap-2">
              <button onclick="worvox.showTopicSelection()" 
                class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
                <i class="fas fa-arrow-left text-xl"></i>
              </button>
              <div>
                <h1 class="text-lg md:text-2xl font-bold text-gray-800">
                  <i class="fas fa-user-circle mr-2 text-emerald-600"></i>내 정보
                </h1>
                <p class="hidden md:block text-gray-600 text-sm mt-1">프로필 및 계정 설정</p>
              </div>
            </div>
          </div>

          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-8">
              <div class="max-w-4xl mx-auto space-y-6">
                
                <!-- Profile Card -->
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <div class="flex items-center gap-4 mb-6">
                    <div class="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      ${this.currentUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-gray-900">${this.currentUser.username}</h2>
                      <p class="text-gray-600">${this.currentUser.email || '이메일 없음'}</p>
                      <div class="flex items-center gap-2 mt-1">
                        ${isGoogleAuth ? `
                          <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            <i class="fab fa-google mr-1"></i>Google 계정
                          </span>
                        ` : `
                          <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            <i class="fas fa-envelope mr-1"></i>이메일 계정
                          </span>
                        `}
                        ${this.isPremiumUser() ? `
                          <span class="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full font-bold">
                            <i class="fas fa-crown mr-1"></i>PREMIUM
                          </span>
                        ` : `
                          <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            FREE
                          </span>
                        `}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Account Information -->
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 class="text-lg font-bold text-gray-900 mb-4">
                    <i class="fas fa-info-circle text-emerald-600 mr-2"></i>계정 정보
                  </h3>
                  
                  <div class="space-y-4">
                    <!-- Username -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">이름</label>
                      <input type="text" id="profileUsername" value="${this.currentUser.username}" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    </div>
                    
                    <!-- Email (read-only) -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                      <input type="email" value="${this.currentUser.email || '이메일 없음'}" disabled
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed">
                      <p class="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다</p>
                    </div>
                    
                    <!-- English Level -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">영어 레벨</label>
                      <select id="profileLevel" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        <option value="beginner" ${this.currentUser.level === 'beginner' ? 'selected' : ''}>🌱 Beginner - 초급</option>
                        <option value="intermediate" ${this.currentUser.level === 'intermediate' ? 'selected' : ''}>🌿 Intermediate - 중급</option>
                        <option value="advanced" ${this.currentUser.level === 'advanced' ? 'selected' : ''}>🌳 Advanced - 고급</option>
                      </select>
                    </div>
                    
                    <!-- Save Button -->
                    <button onclick="worvox.updateProfile()" 
                      class="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all">
                      <i class="fas fa-save mr-2"></i>프로필 저장
                    </button>
                  </div>
                </div>

                <!-- Change Password (Email accounts only) -->
                ${isEmailAuth ? `
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 class="text-lg font-bold text-gray-900 mb-4">
                    <i class="fas fa-lock text-emerald-600 mr-2"></i>비밀번호 변경
                  </h3>
                  
                  <div class="space-y-4">
                    <!-- Current Password -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">현재 비밀번호</label>
                      <input type="password" id="currentPassword" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="현재 비밀번호 입력">
                    </div>
                    
                    <!-- New Password -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
                      <input type="password" id="newPassword" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="8자 이상">
                    </div>
                    
                    <!-- Confirm New Password -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">새 비밀번호 확인</label>
                      <input type="password" id="confirmPassword" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="새 비밀번호 재입력">
                    </div>
                    
                    <!-- Change Password Button -->
                    <button onclick="worvox.changePassword()" 
                      class="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all">
                      <i class="fas fa-key mr-2"></i>비밀번호 변경
                    </button>
                  </div>
                </div>
                ` : `
                <div class="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                  <div class="flex items-start gap-3">
                    <i class="fas fa-info-circle text-blue-600 text-xl mt-1"></i>
                    <div>
                      <h4 class="font-semibold text-blue-900 mb-1">Google 계정</h4>
                      <p class="text-sm text-blue-700">Google 계정으로 로그인하셨습니다. 비밀번호는 Google에서 관리됩니다.</p>
                    </div>
                  </div>
                </div>
                `}

                <!-- AI Prompt Settings (Premium only) -->
                <div class="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-6 shadow-lg border-2 border-purple-300">
                  <h3 class="text-lg font-bold text-gray-900 mb-4">
                    <i class="fas fa-robot text-purple-600 mr-2"></i>AI 프롬프트 생성
                    <span class="ml-2 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full font-bold animate-pulse">
                      <i class="fas fa-sparkles mr-1"></i>AI 기능
                    </span>
                  </h3>
                  
                  <div class="space-y-4">
                    <!-- AI Toggle - Enhanced Button Style -->
                    <div class="flex flex-col gap-4">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                          <h4 class="font-semibold text-gray-900">🤖 AI 맞춤형 프롬프트</h4>
                          ${this.isPremiumUser() ? '' : `
                            <span class="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full font-bold">
                              <i class="fas fa-crown mr-1"></i>PREMIUM
                            </span>
                          `}
                        </div>
                        <p class="text-sm text-gray-600 mb-2">
                          매번 새로운 맞춤형 문장과 시나리오를 AI가 생성합니다
                        </p>
                        <div class="flex items-center gap-2">
                          <span class="text-xs px-2 py-1 rounded-full ${
                            this.currentUser.level === 'beginner' ? 'bg-green-100 text-green-700' :
                            this.currentUser.level === 'intermediate' ? 'bg-blue-100 text-blue-700' :
                            'bg-purple-100 text-purple-700'
                          }">
                            현재 레벨: ${
                              this.currentUser.level === 'beginner' ? '🌱 Beginner' :
                              this.currentUser.level === 'intermediate' ? '🌿 Intermediate' :
                              '🌳 Advanced'
                            }
                          </span>
                        </div>
                      </div>
                      
                      <!-- Large Toggle Button -->
                      <button 
                        onclick="worvox.toggleAIPrompts(!worvox.currentUser.use_ai_prompts)"
                        ${this.isPremiumUser() ? '' : 'disabled'}
                        class="w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-between shadow-lg ${
                          this.currentUser.use_ai_prompts 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-purple-300' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        } ${this.isPremiumUser() ? '' : 'opacity-50 cursor-not-allowed'}">
                        <span class="flex items-center gap-3">
                          <i class="fas fa-robot text-2xl"></i>
                          <span>AI 프롬프트 생성</span>
                        </span>
                        <span class="flex items-center gap-2">
                          <span class="text-sm font-semibold">${this.currentUser.use_ai_prompts ? 'ON' : 'OFF'}</span>
                          <i class="fas ${this.currentUser.use_ai_prompts ? 'fa-toggle-on text-3xl' : 'fa-toggle-off text-3xl'}"></i>
                        </span>
                      </button>
                    </div>

                    ${!this.isPremiumUser() ? `
                    <!-- Upgrade Notice -->
                    <div class="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                      <div class="flex items-start gap-3">
                        <i class="fas fa-info-circle text-purple-600 text-xl mt-0.5"></i>
                        <div class="flex-1">
                          <h4 class="font-semibold text-purple-900 mb-1">Premium 기능</h4>
                          <p class="text-sm text-purple-700 mb-3">
                            AI 프롬프트 생성은 Premium 플랜 이상에서 사용 가능합니다.<br>
                            여러분의 영어 레벨에 맞춰 무한대의 새로운 문장과 시나리오가 생성됩니다.
                          </p>
                          <button onclick="worvox.showPlan()" 
                            class="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold text-sm transition-all">
                            <i class="fas fa-crown mr-2"></i>Premium 구독하기
                          </button>
                        </div>
                      </div>
                    </div>
                    ` : `
                    <!-- AI Features Info -->
                    <div class="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-lg p-4 shadow-sm">
                      <h4 class="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                        <i class="fas fa-check-circle text-emerald-600"></i>
                        ✨ AI 생성 기능이 활성화되었습니다!
                      </h4>
                      <ul class="text-sm text-emerald-800 space-y-2">
                        <li class="flex items-start gap-2">
                          <i class="fas fa-stopwatch text-emerald-600 mt-0.5"></i>
                          <span><strong>타이머 모드:</strong> 레벨별 맞춤 문장 생성</span>
                        </li>
                        <li class="flex items-start gap-2">
                          <i class="fas fa-film text-emerald-600 mt-0.5"></i>
                          <span><strong>시나리오 모드:</strong> 실전 대화 시나리오 생성</span>
                        </li>
                        <li class="flex items-start gap-2">
                          <i class="fas fa-graduation-cap text-emerald-600 mt-0.5"></i>
                          <span><strong>시험 모드:</strong> 레벨별 맞춤 질문 생성</span>
                        </li>
                        <li class="text-xs text-emerald-600 mt-3 bg-white/50 rounded px-2 py-1">
                          <i class="fas fa-info-circle mr-1"></i>생성된 프롬프트는 자동으로 저장되어 오프라인에서도 사용 가능합니다
                        </li>
                      </ul>
                    </div>
                    `}
                  </div>
                </div>

                <!-- Attendance Calendar -->
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 class="text-lg font-bold text-gray-900 mb-4">
                    <i class="fas fa-calendar-check text-emerald-600 mr-2"></i>출석 현황
                  </h3>
                  <div id="attendanceCalendar">
                    <div class="text-center py-8">
                      <i class="fas fa-spinner fa-spin text-3xl text-gray-400 mb-2"></i>
                      <p class="text-sm text-gray-500">출석 현황을 불러오는 중...</p>
                    </div>
                  </div>
                </div>

                <!-- Subscription Info -->
                ${this.currentUser.plan && this.currentUser.plan !== 'free' ? `
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 class="text-lg font-bold text-gray-900 mb-4">
                    <i class="fas fa-credit-card text-emerald-600 mr-2"></i>구독 정보
                  </h3>
                  
                  <div class="space-y-4">
                    ${this.currentUser.is_trial ? `
                    <!-- Free Trial Badge -->
                    <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                      <div class="flex items-center gap-3 mb-3">
                        <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl">
                          🎁
                        </div>
                        <div>
                          <h4 class="text-lg font-bold text-gray-900">2주 무료 체험 중</h4>
                          <p class="text-sm text-green-700">${this.currentUser.plan.toUpperCase()} 플랜</p>
                        </div>
                      </div>
                    </div>
                    ` : ''}
                    
                    <!-- Current Plan -->
                    <div class="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <div>
                        <p class="text-sm text-gray-600 mb-1">${this.currentUser.is_trial ? '체험 플랜' : '현재 플랜'}</p>
                        <p class="text-xl font-bold text-gray-900">${this.currentUser.plan.toUpperCase()} 플랜</p>
                        ${this.currentUser.is_trial ? `
                          <p class="text-sm text-green-600 font-medium">✨ 무료 체험</p>
                        ` : `
                          <p class="text-sm text-gray-500">${this.currentUser.billing_period === 'monthly' ? '월간 구독' : '연간 구독'}</p>
                        `}
                      </div>
                      <div class="text-right">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${this.currentUser.is_trial ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}">
                          <i class="fas fa-check-circle mr-1"></i>${this.currentUser.is_trial ? '체험 중' : '활성'}
                        </span>
                      </div>
                    </div>
                    
                    <!-- Subscription Period -->
                    <div class="grid grid-cols-2 gap-4">
                      <div class="p-4 bg-gray-50 rounded-lg">
                        <p class="text-xs text-gray-500 mb-1">${this.currentUser.is_trial ? '체험 시작일' : '구독 시작일'}</p>
                        <p class="text-sm font-semibold text-gray-900">
                          ${(this.currentUser.is_trial ? this.currentUser.trial_start_date : this.currentUser.subscription_start_date) ? 
                            new Date(this.currentUser.is_trial ? this.currentUser.trial_start_date : this.currentUser.subscription_start_date).toLocaleDateString('ko-KR') : '-'}
                        </p>
                      </div>
                      <div class="p-4 bg-gray-50 rounded-lg">
                        <p class="text-xs text-gray-500 mb-1">${this.currentUser.is_trial ? '체험 종료일' : '구독 종료일'}</p>
                        <p class="text-sm font-semibold text-gray-900">
                          ${(this.currentUser.is_trial ? this.currentUser.trial_end_date : this.currentUser.subscription_end_date) ? 
                            new Date(this.currentUser.is_trial ? this.currentUser.trial_end_date : this.currentUser.subscription_end_date).toLocaleDateString('ko-KR') : '-'}
                        </p>
                      </div>
                    </div>
                    
                    <!-- Remaining Days -->
                    ${(this.currentUser.is_trial ? this.currentUser.trial_end_date : this.currentUser.subscription_end_date) ? `
                    <div class="p-4 ${this.currentUser.is_trial ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} rounded-lg border">
                      <div class="flex items-center justify-between">
                        <div class="flex-1">
                          <p class="text-sm ${this.currentUser.is_trial ? 'text-green-900' : 'text-blue-900'} font-medium">남은 기간</p>
                          ${this.currentUser.is_trial ? `
                            <p class="text-xs ${this.currentUser.auto_billing_enabled ? 'text-orange-600' : 'text-green-600'} mt-1">
                              ${this.currentUser.auto_billing_enabled ? 
                                `⚠️ 체험 종료 후 자동 결제: ${this.currentUser.plan === 'core' ? '₩9,900' : '₩19,000'}/월` : 
                                '✓ 체험 종료 후 자동 결제 안됨'}
                            </p>
                          ` : `
                            <p class="text-xs text-blue-600 mt-1">구독이 자동으로 갱신됩니다</p>
                          `}
                        </div>
                        <div class="text-right">
                          <p class="text-3xl font-bold ${this.currentUser.is_trial ? 'text-green-600' : 'text-blue-600'}">
                            ${Math.max(0, Math.ceil((new Date(this.currentUser.is_trial ? this.currentUser.trial_end_date : this.currentUser.subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24)))}
                          </p>
                          <p class="text-sm ${this.currentUser.is_trial ? 'text-green-600' : 'text-blue-600'} font-medium">일</p>
                        </div>
                      </div>
                    </div>
                    ` : ''}
                    
                    ${this.currentUser.is_trial && this.currentUser.auto_billing_enabled ? `
                    <!-- Trial Warning -->
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div class="flex items-start gap-3">
                        <i class="fas fa-info-circle text-yellow-600 text-lg mt-0.5"></i>
                        <div class="flex-1 text-sm">
                          <p class="font-semibold text-yellow-900 mb-1">자동 결제 안내</p>
                          <p class="text-yellow-700">
                            무료 체험 종료 시 등록된 카드로 ${this.currentUser.plan === 'core' ? '₩9,900' : '₩19,000'}이 자동 결제됩니다.
                            원치 않으시면 아래 버튼으로 해지해주세요.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Cancel Trial Button -->
                    <button onclick="worvox.cancelTrial()" 
                      class="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-semibold transition-all border border-red-200">
                      <i class="fas fa-times-circle mr-2"></i>무료 체험 해지 (${this.currentUser.trial_end_date ? new Date(this.currentUser.trial_end_date).toLocaleDateString('ko-KR') : '종료일'}까지 사용 가능)
                    </button>
                    ` : this.currentUser.is_trial ? `
                    <!-- Trial Canceled Notice -->
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div class="flex items-start gap-3">
                        <i class="fas fa-check-circle text-gray-600 text-lg mt-0.5"></i>
                        <div class="flex-1 text-sm">
                          <p class="font-semibold text-gray-900 mb-1">자동 결제 해지됨</p>
                          <p class="text-gray-600">
                            체험 종료일(${this.currentUser.trial_end_date ? new Date(this.currentUser.trial_end_date).toLocaleDateString('ko-KR') : '-'})까지 계속 사용하실 수 있습니다.
                          </p>
                        </div>
                      </div>
                    </div>
                    ` : `
                    <!-- Cancel Subscription -->
                    <button onclick="worvox.cancelSubscription()" 
                      class="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-semibold transition-all border border-red-200">
                      <i class="fas fa-times-circle mr-2"></i>구독 취소
                    </button>
                    `}
                  </div>
                </div>
                ` : ''}

                <!-- Account Actions -->
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 class="text-lg font-bold text-gray-900 mb-4">
                    <i class="fas fa-cog text-emerald-600 mr-2"></i>계정 관리
                  </h3>
                  
                  <div class="space-y-3">
                    ${this.currentUser.email === 'harperleekr@gmail.com' ? `
                    <button onclick="worvox.showAdmin()" 
                      class="w-full py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2">
                      <i class="fas fa-shield-alt"></i>
                      <span>Admin Dashboard</span>
                    </button>
                    ` : ''}
                    
                    <button onclick="worvox.showPlan()" 
                      class="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2">
                      <i class="fas fa-crown"></i>
                      <span>${this.isPremiumUser() ? '플랜 관리' : 'Premium으로 업그레이드'}</span>
                    </button>
                    
                    <button onclick="worvox.logout()" 
                      class="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-all">
                      <i class="fas fa-sign-out-alt mr-2"></i>로그아웃
                    </button>
                  </div>
                </div>

              </div>
              
              ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Load attendance calendar
    this.loadAttendanceCalendar();
  }

  // Load and render attendance calendar
  async loadAttendanceCalendar() {
    try {
      // Get attendance data from usage tracking
      const response = await axios.get(`/api/usage/users/${this.currentUser.id}/attendance`);
      const attendanceDates = response.data.attendanceDates || [];
      const total = response.data.total || 0;
      const currentStreak = response.data.currentStreak || 0;
      
      this.renderAttendanceCalendar(attendanceDates, total, currentStreak);
    } catch (error) {
      console.error('Failed to load attendance:', error);
      // Render empty calendar on error
      this.renderAttendanceCalendar([], 0, 0);
    }
  }

  // Render attendance calendar
  renderAttendanceCalendar(attendanceDates, totalDays = 0, currentStreak = 0) {
    const container = document.getElementById('attendanceCalendar');
    if (!container) return;

    // Get current date
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Get first and last day of current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Convert attendance dates to Set for quick lookup
    const attendanceSet = new Set(attendanceDates.map(date => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }));

    // Calculate attendance rate
    const attendanceCount = Array.from(attendanceSet).filter(dateStr => {
      const [year, month] = dateStr.split('-').map(Number);
      return year === currentYear && month === currentMonth + 1;
    }).length;
    const attendanceRate = daysInMonth > 0 ? Math.round((attendanceCount / daysInMonth) * 100) : 0;

    // Days of week labels
    const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

    // Build calendar HTML
    let calendarHTML = `
      <div class="mb-4">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold text-gray-900">
            ${currentYear}년 ${currentMonth + 1}월
          </h4>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">출석률</span>
            <span class="text-lg font-bold text-emerald-600">${attendanceRate}%</span>
          </div>
        </div>
        
        <!-- Day Labels -->
        <div class="grid grid-cols-7 gap-2 mb-2">
          ${dayLabels.map((day, idx) => `
            <div class="text-center text-sm font-medium ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-600'}">
              ${day}
            </div>
          `).join('')}
        </div>
        
        <!-- Calendar Days -->
        <div class="grid grid-cols-7 gap-2">
    `;

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarHTML += '<div class="aspect-square"></div>';
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isAttended = attendanceSet.has(dateStr);
      const isToday = day === today.getDate();
      const isPast = new Date(currentYear, currentMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isFuture = new Date(currentYear, currentMonth, day) > today;

      let dayClass = 'aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ';
      
      if (isToday && isAttended) {
        dayClass += 'bg-gradient-to-br from-emerald-500 to-green-600 text-white ring-2 ring-emerald-300 ring-offset-2';
      } else if (isToday) {
        dayClass += 'bg-gray-200 text-gray-700 ring-2 ring-gray-300 ring-offset-2';
      } else if (isAttended) {
        dayClass += 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500';
      } else if (isFuture) {
        dayClass += 'bg-gray-50 text-gray-400';
      } else if (isPast) {
        dayClass += 'bg-red-50 text-red-300';
      } else {
        dayClass += 'bg-gray-100 text-gray-500';
      }

      calendarHTML += `
        <div class="${dayClass}" title="${isAttended ? '출석' : '미출석'}">
          ${day}
        </div>
      `;
    }

    calendarHTML += `
        </div>
      </div>
      
      <!-- Legend -->
      <div class="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-gray-200">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-emerald-100 border-2 border-emerald-500 rounded"></div>
          <span class="text-xs text-gray-600">출석</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-red-50 rounded"></div>
          <span class="text-xs text-gray-600">미출석 (지나간 날)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-gray-50 rounded"></div>
          <span class="text-xs text-gray-600">아직 오지 않은 날</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded ring-2 ring-emerald-300"></div>
          <span class="text-xs text-gray-600">오늘 (출석)</span>
        </div>
      </div>
      
      <!-- Attendance Stats -->
      <div class="mt-4 grid grid-cols-3 gap-3">
        <div class="p-3 bg-emerald-50 rounded-lg text-center">
          <div class="text-xs text-gray-600 mb-1">이번 달</div>
          <div class="text-xl font-bold text-emerald-600">${attendanceCount}일</div>
        </div>
        <div class="p-3 bg-blue-50 rounded-lg text-center">
          <div class="text-xs text-gray-600 mb-1">총 출석</div>
          <div class="text-xl font-bold text-blue-600">${totalDays}일</div>
        </div>
        <div class="p-3 bg-purple-50 rounded-lg text-center">
          <div class="text-xs text-gray-600 mb-1">연속 출석</div>
          <div class="text-xl font-bold text-purple-600">${currentStreak}일</div>
        </div>
      </div>
    `;

    container.innerHTML = calendarHTML;
  }

  // Update user profile
  async updateProfile() {
    const username = document.getElementById('profileUsername').value.trim();
    const level = document.getElementById('profileLevel').value;

    if (!username) {
      alert('이름을 입력해주세요.');
      return;
    }

    try {
      console.log('Updating profile:', { username, level });

      const response = await axios.patch(`/api/users/${this.currentUser.id}/level`, {
        level
      });

      // Update username separately if needed
      if (username !== this.currentUser.username) {
        // For now, just update locally
        // TODO: Add backend endpoint for username update
        this.currentUser.username = username;
      }

      this.currentUser.level = level;
      localStorage.setItem('worvox_user', JSON.stringify(this.currentUser));

      alert('프로필이 업데이트되었습니다!');
      this.showProfile(); // Refresh page

    } catch (error) {
      console.error('Profile update error:', error);
      alert('프로필 업데이트에 실패했습니다. 다시 시도해주세요.');
    }
  }

  // Change password (email accounts only)
  async changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    if (newPassword.length < 8) {
      alert('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      console.log('Changing password...');

      const response = await axios.patch(`/api/users/${this.currentUser.id}/password`, {
        currentPassword,
        newPassword
      });

      alert('비밀번호가 변경되었습니다!');
      
      // Clear password fields
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';

    } catch (error) {
      console.error('Password change error:', error);
      if (error.response?.status === 401) {
        alert('현재 비밀번호가 올바르지 않습니다.');
      } else {
        alert('비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
      }
    }
  }

  // Toggle AI prompts
  async toggleAIPrompts(enabled) {
    if (!this.isPremiumUser()) {
      alert('AI 프롬프트 생성은 Premium 플랜 이상에서 사용 가능합니다.');
      return;
    }

    try {
      console.log('Toggling AI prompts:', enabled);

      const response = await axios.patch(`/api/users/${this.currentUser.id}`, {
        use_ai_prompts: enabled ? 1 : 0
      });

      this.currentUser.use_ai_prompts = enabled;
      localStorage.setItem('worvox_user', JSON.stringify(this.currentUser));

      if (enabled) {
        alert('✨ AI 프롬프트 생성이 활성화되었습니다!\n\n타이머/시나리오/시험 모드에서 매번 새로운 맞춤형 문장이 생성됩니다.');
      } else {
        alert('AI 프롬프트 생성이 비활성화되었습니다.\n기본 문장 풀을 사용합니다.');
      }
      
      // Refresh profile page to show updated button state
      this.showProfile();

    } catch (error) {
      console.error('AI prompts toggle error:', error);
      alert('설정 변경에 실패했습니다. 다시 시도해주세요.');
      document.getElementById('aiPromptsToggle').checked = !enabled;
    }
  }

  // Cancel subscription
  async cancelSubscription() {
    // Confirmation dialog
    const confirmed = confirm(
      '구독을 취소하시겠습니까?\n\n' +
      '구독을 취소하면:\n' +
      '• 현재 구독 기간이 종료될 때까지 플랜 혜택을 계속 사용할 수 있습니다\n' +
      '• 구독 종료일 이후 자동으로 Free 플랜으로 전환됩니다\n' +
      '• 언제든지 다시 구독할 수 있습니다'
    );

    if (!confirmed) return;

    try {
      console.log('Canceling subscription for user:', this.currentUser.id);

      const response = await axios.post(`/api/users/${this.currentUser.id}/cancel-subscription`);

      if (response.data.success) {
        alert('구독이 취소되었습니다.\n현재 구독 기간이 종료될 때까지 플랜 혜택을 계속 사용하실 수 있습니다.');
        
        // Update local user data
        this.currentUser.plan = 'free';
        this.currentUser.billing_period = null;
        this.currentUser.subscription_start_date = null;
        this.currentUser.subscription_end_date = null;
        localStorage.setItem('worvox_user', JSON.stringify(this.currentUser));
        
        // Refresh profile page
        this.showProfile();
      } else {
        alert('구독 취소에 실패했습니다. 다시 시도해주세요.');
      }

    } catch (error) {
      console.error('Cancel subscription error:', error);
      alert('구독 취소에 실패했습니다. 다시 시도해주세요.\n' + (error.response?.data?.error || error.message));
    }
  }

  // Cancel free trial (disable auto billing)
  async cancelTrial() {
    const trialEndDate = this.currentUser.trial_end_date ? 
      new Date(this.currentUser.trial_end_date).toLocaleDateString('ko-KR') : '종료일';
    
    // Confirmation dialog
    const confirmed = confirm(
      '무료 체험을 해지하시겠습니까?\n\n' +
      '해지하시면:\n' +
      `• ${trialEndDate}까지 ${this.currentUser.plan.toUpperCase()} 기능을 계속 사용할 수 있습니다\n` +
      '• 자동 결제가 취소됩니다\n' +
      '• 체험 종료 후 자동으로 Free 플랜으로 전환됩니다\n' +
      '• 언제든지 다시 구독할 수 있습니다'
    );

    if (!confirmed) return;

    try {
      console.log('Canceling trial for user:', this.currentUser.id);

      const response = await axios.post('/api/payments/trial/cancel', {
        userId: this.currentUser.id
      });

      if (response.data.success) {
        alert(`체험이 해지되었습니다.\n${trialEndDate}까지 계속 사용하실 수 있습니다.`);
        
        // Update local user data
        this.currentUser.auto_billing_enabled = false;
        localStorage.setItem('worvox_user', JSON.stringify(this.currentUser));
        
        // Refresh profile page
        this.showProfile();
      } else {
        alert('체험 해지에 실패했습니다. 다시 시도해주세요.');
      }

    } catch (error) {
      console.error('Cancel trial error:', error);
      alert('체험 해지에 실패했습니다. 다시 시도해주세요.\n' + (error.response?.data?.error || error.message));
    }
  }

  toggleBillingPeriod(period) {
    const monthlyBtn = document.getElementById('monthlyToggle');
    const yearlyBtn = document.getElementById('yearlyToggle');
    
    const corePrice = document.getElementById('corePrice');
    const corePeriod = document.getElementById('corePeriod');
    const coreYearlySavings = document.getElementById('coreYearlySavings');
    
    const premiumPrice = document.getElementById('premiumPrice');
    const premiumPeriod = document.getElementById('premiumPeriod');
    const premiumYearlySavings = document.getElementById('premiumYearlySavings');
    
    if (period === 'monthly') {
      // Monthly prices
      monthlyBtn.classList.add('bg-gradient-to-r', 'from-purple-500', 'to-pink-500', 'text-white');
      monthlyBtn.classList.remove('text-gray-600');
      yearlyBtn.classList.remove('bg-gradient-to-r', 'from-purple-500', 'to-pink-500', 'text-white');
      yearlyBtn.classList.add('text-gray-600');
      
      corePrice.textContent = '₩9,900';
      corePeriod.textContent = '/월';
      coreYearlySavings.classList.add('hidden');
      
      premiumPrice.textContent = '₩19,000';
      premiumPeriod.textContent = '/월';
      premiumYearlySavings.classList.add('hidden');
      
      this.currentBillingPeriod = 'monthly';
    } else {
      // Yearly prices (18% discount)
      yearlyBtn.classList.add('bg-gradient-to-r', 'from-purple-500', 'to-pink-500', 'text-white');
      yearlyBtn.classList.remove('text-gray-600');
      monthlyBtn.classList.remove('bg-gradient-to-r', 'from-purple-500', 'to-pink-500', 'text-white');
      monthlyBtn.classList.add('text-gray-600');
      
      // Core: 9,900 × 12 = 118,800 → 18% discount = 97,416
      corePrice.textContent = '₩97,416';
      corePeriod.textContent = '/년';
      coreYearlySavings.classList.remove('hidden');
      
      // Premium: 19,000 × 12 = 228,000 → 18% discount = 186,960
      premiumPrice.textContent = '₩186,960';
      premiumPeriod.textContent = '/년';
      premiumYearlySavings.classList.remove('hidden');
      
      this.currentBillingPeriod = 'yearly';
    }
  }
  
  // Select plan based on current billing period
  // Start 2-week free trial with billing key
  async startFreeTrial(plan) {
    if (!this.currentUser) {
      
      this.showLogin();
      return;
    }

    console.log(`🎁 Starting free trial for ${plan}`);

    // Calculate future date
    const futureDate = this.getFutureDate(14);
    const planName = plan === 'core' ? 'Core' : 'Premium';
    const planPrice = plan === 'core' ? '₩9,900' : '₩19,000';

    // Show confirmation modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">🎁</div>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">2주 무료 체험</h3>
          <p class="text-gray-600 text-sm">
            ${planName} 플랜을 지금 무료로 시작하세요!
          </p>
        </div>
        
        <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
          <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
            <i class="fas fa-info-circle text-blue-600 mr-2"></i>
            중요 안내
          </h4>
          <ul class="space-y-2 text-sm text-gray-700">
            <li class="flex items-start">
              <i class="fas fa-check text-green-500 mr-2 mt-0.5"></i>
              <span><strong>지금은 결제되지 않습니다</strong></span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-check text-green-500 mr-2 mt-0.5"></i>
              <span><strong>2주간 모든 기능 무료</strong> 사용</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-calendar-check text-blue-500 mr-2 mt-0.5"></i>
              <span>체험 종료일: <strong>${futureDate}</strong></span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-credit-card text-purple-500 mr-2 mt-0.5"></i>
              <span>체험 종료 후 자동 결제: <strong>${planPrice}</strong>/월</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-bell text-yellow-500 mr-2 mt-0.5"></i>
              <span><strong>3일 전</strong> 이메일로 알림 발송</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-times-circle text-red-500 mr-2 mt-0.5"></i>
              <span><strong>언제든 해지 가능</strong> (내 정보 > 구독 관리)</span>
            </li>
          </ul>
        </div>
        
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <p class="text-xs text-gray-700">
            <i class="fas fa-exclamation-triangle text-yellow-600 mr-1"></i>
            다음 단계에서 카드 정보를 등록하시면 무료 체험이 시작됩니다.
          </p>
        </div>
        
        <div class="flex items-start mb-6">
          <input type="checkbox" id="agreeTerms" class="mt-1 mr-2">
          <label for="agreeTerms" class="text-sm text-gray-700">
            위 내용을 확인했으며, 무료 체험 종료 후 자동 결제에 동의합니다.
          </label>
        </div>
        
        <div class="flex gap-3">
          <button onclick="this.closest('.fixed').remove()" 
            class="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all">
            취소
          </button>
          <button onclick="worvox.confirmFreeTrial('${plan}'); this.closest('.fixed').remove();" 
            class="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            id="confirmTrialBtn"
            disabled>
            카드 등록하고 시작
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Enable button when checkbox is checked
    const checkbox = document.getElementById('agreeTerms');
    const confirmBtn = document.getElementById('confirmTrialBtn');
    checkbox.addEventListener('change', () => {
      confirmBtn.disabled = !checkbox.checked;
    });
  }

  // Get future date string (for display)
  getFutureDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // Confirm and proceed with trial - Show payment method selection
  async confirmFreeTrial(plan) {
    try {
      console.log(`✅ User confirmed trial for ${plan}`);
      console.log(`👤 Current user:`, this.currentUser);

      // Show payment method selection modal
      this.showTrialPaymentMethodModal(plan);

    } catch (error) {
      console.error('Free trial confirmation error:', error);
      alert('무료 체험 시작 중 오류가 발생했습니다: ' + (error.message || ''));
    }
  }

  // Show payment method selection for free trial
  showTrialPaymentMethodModal(plan) {
    const planName = plan === 'core' ? 'Core' : 'Premium';
    const planPrice = plan === 'core' ? '₩9,900' : '₩19,000';

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] backdrop-blur-sm';
    overlay.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 transform transition-all">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          <i class="fas fa-credit-card mr-2 text-purple-600"></i>결제 수단 선택
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          ${planName} 플랜 - 2주 무료 체험
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-500 mb-6">
          체험 종료 후 ${planPrice}/월 자동 결제
        </p>
        
        <!-- Toss Payments (Domestic) -->
        <button onclick="worvox.processTrialToss('${plan}')" 
                class="w-full mb-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-105 flex items-center justify-between group">
          <div class="flex items-center">
            <i class="fas fa-credit-card text-2xl mr-3"></i>
            <div class="text-left">
              <div class="text-base font-bold">Toss Payments</div>
              <div class="text-xs opacity-90">국내 카드 결제 (신용/체크)</div>
            </div>
          </div>
          <i class="fas fa-chevron-right opacity-70 group-hover:opacity-100 transition"></i>
        </button>

        <button onclick="this.closest('[class*=fixed]').remove()" 
                class="w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium py-3 transition">
          취소
        </button>
      </div>
    `;
    
    document.body.appendChild(overlay);
  }

  // Process Toss free trial
  async processTrialToss(plan) {
    // Close modal
    document.querySelector('[class*="fixed inset-0"]')?.remove();

    try {
      console.log(`🎁 Starting Toss free trial for ${plan}`);

      // Step 1: Start trial on backend (get customerKey)
      const startResponse = await axios.post('/api/payments/trial/start', {
        userId: this.currentUser.id,
        plan
      });

      console.log(`📡 Trial start response:`, startResponse.data);

      if (!startResponse.data.success) {
        const errorMsg = startResponse.data.details || startResponse.data.error || '체험 시작 실패';
        throw new Error(errorMsg);
      }

      const { customerKey } = startResponse.data;
      console.log(`📝 Customer key: ${customerKey}`);

      // Step 2: Initialize Toss Payments Billing
      const clientKey = 'test_ck_d26DlbXAaV0eR7QxP00rqY50Q9RB';
      const tossPayments = TossPayments(clientKey);

      // Step 3: Request billing key (카드 등록)
      const billing = tossPayments.payment({ customerKey });
      
      await billing.requestBillingAuth({
        method: 'CARD',
        successUrl: window.location.origin + `/trial-success?plan=${plan}&userId=${this.currentUser.id}&customerKey=${customerKey}`,
        failUrl: window.location.origin + '/trial-fail',
        customerEmail: this.currentUser.email,
        customerName: this.currentUser.username
      });

    } catch (error) {
      console.error('Toss free trial error:', error);
      alert('Toss 무료 체험 시작 중 오류가 발생했습니다: ' + (error.response?.data?.error || error.message));
    }
  }

  async selectPlan(planName) {
    if (!this.currentUser) {
      
      return;
    }

    const period = this.currentBillingPeriod || 'monthly';
    let amount;
    let priceText;
    
    if (planName === 'Core') {
      amount = period === 'monthly' ? 9900 : 97416;
      priceText = period === 'monthly' ? '₩9,900/월' : '₩97,416/년';
    } else if (planName === 'Premium') {
      amount = period === 'monthly' ? 19000 : 186960;
      priceText = period === 'monthly' ? '₩19,000/월' : '₩186,960/년';
    } else {
      return;
    }

    // Show payment method selection modal
    this.showPaymentMethodModal(planName, amount, priceText, period);
  }

  // Show payment method selection modal
  showPaymentMethodModal(planName, amount, priceText, period) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] backdrop-blur-sm';
    overlay.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 transform transition-all">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          <i class="fas fa-credit-card mr-2 text-purple-600"></i>결제 수단 선택
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
          ${planName} 플랜 - ${priceText}
        </p>
        
        <!-- Toss Payments (Domestic) -->
        <button onclick="worvox.processTossPayment('${planName}', ${amount}, '${period}')" 
                class="w-full mb-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-105 flex items-center justify-between group">
          <div class="flex items-center">
            <i class="fas fa-credit-card text-2xl mr-3"></i>
            <div class="text-left">
              <div class="text-base font-bold">Toss Payments</div>
              <div class="text-xs opacity-90">국내 카드 결제 (신용/체크)</div>
            </div>
          </div>
          <i class="fas fa-chevron-right opacity-70 group-hover:opacity-100 transition"></i>
        </button>

        <button onclick="this.closest('[class*=fixed]').remove()" 
                class="w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium py-3 transition">
          취소
        </button>
      </div>
    `;
    
    document.body.appendChild(overlay);
  }

  // Process Toss Payment
  async processTossPayment(planName, amount, period) {
    // Close modal
    document.querySelector('[class*="fixed inset-0"]')?.remove();

    try {
      // 1. Prepare order
      const prepareResponse = await axios.post('/api/payments/prepare', {
        planName,
        price: amount,
        period,
        userId: this.currentUser.id
      });

      if (!prepareResponse.data.success) {
        throw new Error('결제 준비 실패');
      }

      const { orderId, orderName } = prepareResponse.data;

      // 2. Initialize Toss Payments
      const clientKey = 'test_ck_d26DlbXAaV0eR7QxP00rqY50Q9RB';
      const tossPayments = TossPayments(clientKey);
      
      const customerKey = `customer_${this.currentUser.id}`;
      const payment = tossPayments.payment({ customerKey });

      // 3. Request payment
      await payment.requestPayment({
        method: 'CARD',
        amount: { 
          value: amount,
          currency: 'KRW'
        },
        orderId: orderId,
        orderName: orderName,
        successUrl: window.location.origin + '/payment/success',
        failUrl: window.location.origin + '/payment/fail',
        customerEmail: this.currentUser.email,
        customerName: this.currentUser.username,
      });

    } catch (error) {
      console.error('Toss payment error:', error);
      alert('Toss 결제 시작 중 오류가 발생했습니다.\n' + (error.message || ''));
    }
  }

  // Payment Stay Tuned Modal
  showPaymentStayTuned(plan, price) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 24px;
        padding: 48px 40px;
        max-width: 480px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
        animation: slideUp 0.3s ease-out;
      ">
        <div style="font-size: 64px; margin-bottom: 24px;">🚀</div>
        <h2 style="
          font-size: 32px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 16px;
        ">Stay Tuned!</h2>
        <p style="
          font-size: 18px;
          color: #6b7280;
          margin-bottom: 24px;
          line-height: 1.6;
        ">
          Payment feature is coming soon.<br>
          We're working hard to bring you the best experience!
        </p>
        <div style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          border-radius: 16px;
          margin-bottom: 32px;
        ">
          <div style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin-bottom: 8px;">
            Selected Plan
          </div>
          <div style="color: white; font-size: 28px; font-weight: bold; margin-bottom: 4px;">
            ${plan}
          </div>
          <div style="color: rgba(255, 255, 255, 0.95); font-size: 20px; font-weight: 600;">
            ${price}/month
          </div>
        </div>
        <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 16px 48px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.5)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)';">
          Got it!
        </button>
      </div>
    `;
    
    // Add animation keyframes
    if (!document.getElementById('stayTunedAnimation')) {
      const style = document.createElement('style');
      style.id = 'stayTunedAnimation';
      style.textContent = `
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(modal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // Admin Dashboard
  async showAdmin() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
        ${this.getSidebar('admin')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Header -->
          <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
            <div class="flex items-center gap-2">
              <button onclick="worvox.showProfile()" 
                class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
                <i class="fas fa-arrow-left text-xl"></i>
              </button>
              <div>
                <h1 class="text-lg md:text-2xl font-bold text-gray-800">
                  <i class="fas fa-shield-alt mr-2 text-red-600"></i>Admin Dashboard
                </h1>
                <p class="hidden md:block text-gray-600 text-sm mt-1">시스템 관리 및 사용자 통계</p>
              </div>
            </div>
          </div>
        
        <main class="flex-1 overflow-y-auto p-4 md:p-8">
          <div class="max-w-7xl mx-auto">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h1 class="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <i class="fas fa-shield-alt text-red-600"></i>
                  Admin Dashboard
                </h1>
                <p class="text-gray-600 mt-1">시스템 관리 및 사용자 통계</p>
              </div>
            </div>

            <!-- Loading State -->
            <div id="admin-loading" class="text-center py-12">
              <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p class="mt-4 text-gray-600">데이터 로딩 중...</p>
            </div>

            <!-- Admin Content -->
            <div id="admin-content" class="hidden">
              <!-- Statistics Cards -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="bg-white rounded-lg shadow p-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-gray-500 text-sm">총 사용자</p>
                      <p id="stat-total-users" class="text-2xl font-bold text-gray-900">0</p>
                    </div>
                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <i class="fas fa-users text-blue-600 text-xl"></i>
                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-gray-500 text-sm">활성 사용자</p>
                      <p id="stat-active-users" class="text-2xl font-bold text-gray-900">0</p>
                    </div>
                    <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <i class="fas fa-user-check text-green-600 text-xl"></i>
                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-gray-500 text-sm">총 세션</p>
                      <p id="stat-total-sessions" class="text-2xl font-bold text-gray-900">0</p>
                    </div>
                    <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <i class="fas fa-comments text-purple-600 text-xl"></i>
                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-gray-500 text-sm">총 매출</p>
                      <p id="stat-total-revenue" class="text-2xl font-bold text-gray-900">₩0</p>
                    </div>
                    <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <i class="fas fa-won-sign text-yellow-600 text-xl"></i>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Charts Row - Compact Size -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div class="bg-white rounded-lg shadow p-3">
                  <h3 class="text-sm font-semibold mb-2">플랜 분포</h3>
                  <div class="h-32">
                    <canvas id="plan-chart" class="max-h-32"></canvas>
                  </div>
                </div>
                <div class="bg-white rounded-lg shadow p-3">
                  <h3 class="text-sm font-semibold mb-2">최근 결제</h3>
                  <div id="recent-payments" class="space-y-1 h-32 overflow-y-auto text-xs">
                    <!-- Payments will be loaded here -->
                  </div>
                </div>
              </div>

              <!-- Users Table -->
              <div class="bg-white rounded-lg shadow">
                <div class="p-6 border-b border-gray-200">
                  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h3 class="text-lg font-semibold">사용자 관리</h3>
                    <input type="text" id="user-search" placeholder="사용자 검색..." 
                      class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">플랜</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">세션</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학습시간</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                      </tr>
                    </thead>
                    <tbody id="users-table-body" class="bg-white divide-y divide-gray-200">
                      <!-- Users will be loaded here -->
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
        </div>
      </div>
    `;

    // Load admin data
    this.loadAdminData();

    // Setup search
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterUsers(e.target.value);
      });
    }
  }

  async loadAdminData() {
    try {
      // Load statistics
      const statsResponse = await axios.get('/api/admin/stats', {
        headers: { 'X-User-Id': this.currentUser.id }
      });

      if (statsResponse.data.success) {
        const stats = statsResponse.data.data;
        
        // Update stat cards
        document.getElementById('stat-total-users').textContent = stats.totalUsers || 0;
        document.getElementById('stat-active-users').textContent = stats.activeUsers || 0;
        document.getElementById('stat-total-sessions').textContent = stats.totalSessions || 0;
        document.getElementById('stat-total-revenue').textContent = '₩' + (stats.totalRevenue || 0).toLocaleString();

        // Draw plan distribution chart
        this.drawPlanChart(stats.planDistribution || []);
      }

      // Load users
      const usersResponse = await axios.get('/api/admin/users', {
        headers: { 'X-User-Id': this.currentUser.id }
      });

      if (usersResponse.data.success) {
        this.allUsers = usersResponse.data.data.users || [];
        this.displayUsers(this.allUsers);
      }

      // Hide loading, show content
      document.getElementById('admin-loading').classList.add('hidden');
      document.getElementById('admin-content').classList.remove('hidden');

    } catch (error) {
      console.error('Load admin data error:', error);
      document.getElementById('admin-loading').innerHTML = `
        <div class="text-center">
          <i class="fas fa-exclamation-circle text-red-500 text-4xl mb-4"></i>
          <p class="text-red-600 font-semibold">데이터 로딩 실패</p>
          <p class="text-gray-600 mt-2">${error.response?.data?.error || error.message}</p>
          <button onclick="worvox.loadAdminData()" class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            다시 시도
          </button>
        </div>
      `;
    }
  }

  drawPlanChart(planDistribution) {
    const ctx = document.getElementById('plan-chart');
    if (!ctx) return;

    const planColors = {
      free: '#9CA3AF',
      core: '#3B82F6',
      premium: '#8B5CF6',
      business: '#EF4444'
    };

    const labels = planDistribution.map(p => p.plan.toUpperCase());
    const data = planDistribution.map(p => p.count);
    const colors = planDistribution.map(p => planColors[p.plan] || '#6B7280');

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 1,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              font: {
                size: 10
              },
              padding: 8
            }
          }
        }
      }
    });
  }

  displayRecentPayments(payments) {
    const container = document.getElementById('recent-payments');
    if (!container) return;

    if (payments.length === 0) {
      container.innerHTML = '<p class="text-gray-400 text-center py-2 text-xs">결제 내역이 없습니다.</p>';
      return;
    }

    container.innerHTML = payments.slice(0, 5).map(payment => `
      <div class="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
        <div class="flex-1 min-w-0">
          <p class="font-medium text-xs truncate">${payment.username || payment.email}</p>
          <p class="text-xs text-gray-400">${payment.plan_name}</p>
        </div>
        <div class="text-right ml-2">
          <p class="font-semibold text-xs">₩${payment.amount.toLocaleString()}</p>
          <p class="text-xs text-gray-400">${new Date(payment.confirmed_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</p>
        </div>
      </div>
    `).join('');
  }

  displayUsers(users) {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    if (users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-4 text-center text-gray-500">사용자가 없습니다.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = users.map(user => {
      const planBadge = this.getPlanBadge(user.plan || 'free');
      const studyHours = Math.floor((user.total_study_minutes || 0) / 60);
      const studyMinutes = (user.total_study_minutes || 0) % 60;
      
      return `
        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                ${user.username.charAt(0).toUpperCase()}
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-900">${user.username}</p>
                ${user.is_admin ? '<span class="text-xs text-red-600">👑 Admin</span>' : ''}
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email || '-'}</td>
          <td class="px-6 py-4 whitespace-nowrap">${planBadge}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.total_sessions || 0}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${studyHours}h ${studyMinutes}m</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(user.created_at).toLocaleDateString('ko-KR')}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm">
            <button onclick="worvox.viewUserDetail(${user.id})" class="text-blue-600 hover:text-blue-900 mr-3" title="상세 보기">
              <i class="fas fa-eye"></i>
            </button>
            <button onclick="worvox.changeUserPlan(${user.id}, '${user.plan || 'free'}')" class="text-green-600 hover:text-green-900 mr-3" title="플랜 변경">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="worvox.deleteUser(${user.id}, '${user.username.replace(/'/g, "\\'")}')" class="text-red-600 hover:text-red-900" title="사용자 삭제">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  getPlanBadge(plan) {
    const badges = {
      free: '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">FREE</span>',
      core: '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">CORE</span>',
      premium: '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">PREMIUM</span>',
      business: '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">BUSINESS</span>'
    };
    return badges[plan] || badges.free;
  }

  filterUsers(searchTerm) {
    if (!this.allUsers) return;
    
    const filtered = this.allUsers.filter(user => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    this.displayUsers(filtered);
  }

  async changeUserPlan(userId, currentPlan) {
    const plans = ['free', 'core', 'premium', 'business'];
    const planNames = { 
      free: 'Free (무료)', 
      core: 'Core (₩9,900/월)', 
      premium: 'Premium (₩19,000/월)', 
      business: 'Business (협의)' 
    };
    
    const options = plans.map(p => `<option value="${p}" ${p === currentPlan ? 'selected' : ''}>${planNames[p]}</option>`).join('');
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">플랜 변경</h3>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">플랜 선택</label>
          <select id="new-plan-select" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            ${options}
          </select>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">결제 주기</label>
          <select id="billing-period-select" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="monthly">월간 (1개월)</option>
            <option value="yearly">연간 (12개월)</option>
          </select>
        </div>
        
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p class="text-sm text-blue-800">
            <i class="fas fa-info-circle mr-1"></i>
            플랜 변경 시 구독 기간이 오늘부터 자동으로 설정됩니다.
          </p>
        </div>
        
        <div class="flex gap-2">
          <button onclick="this.closest('.fixed').remove()" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
            취소
          </button>
          <button onclick="worvox.confirmPlanChange(${userId}, document.getElementById('new-plan-select').value, document.getElementById('billing-period-select').value); this.closest('.fixed').remove();" 
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            변경
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  async confirmPlanChange(userId, newPlan, billingPeriod) {
    try {
      console.log(`📝 Changing plan for user ${userId}: ${newPlan} (${billingPeriod})`);
      
      const response = await axios.post(`/api/admin/users/${userId}/plan`, 
        { 
          plan: newPlan,
          billingPeriod: billingPeriod || 'monthly'
        },
        { headers: { 'X-User-Id': this.currentUser.id } }
      );

      if (response.data.success) {
        const periodText = billingPeriod === 'yearly' ? '12개월' : '1개월';
        alert(`✅ 플랜이 변경되었습니다.\n\n새 플랜: ${newPlan.toUpperCase()}\n구독 기간: ${periodText}`);
        this.loadAdminData();
      }
    } catch (error) {
      console.error('Change plan error:', error);
      alert('❌ 플랜 변경에 실패했습니다: ' + (error.response?.data?.error || error.message));
    }
  }

  async deleteUser(userId, username) {
    // Confirmation dialog
    const confirmed = confirm(
      `⚠️ 사용자 삭제 확인\n\n사용자: ${username}\n\n이 작업은 되돌릴 수 없습니다.\n- 모든 대화 세션\n- 학습 기록\n- 결제 내역\n등이 영구적으로 삭제됩니다.\n\n정말 삭제하시겠습니까?`
    );

    if (!confirmed) {
      return;
    }

    // Double confirmation for safety
    const doubleConfirm = confirm(
      `최종 확인: "${username}" 사용자를 정말로 삭제하시겠습니까?`
    );

    if (!doubleConfirm) {
      return;
    }

    try {
      console.log(`🗑️ Attempting to delete user ${userId} (${username})`);
      
      const response = await axios.delete(`/api/admin/users/${userId}`, {
        headers: { 'X-User-Id': this.currentUser.id }
      });

      if (response.data.success) {
        alert(`✅ 사용자 "${username}"이(가) 삭제되었습니다.`);
        // Reload admin data to refresh the user list
        this.loadAdminData();
      }
    } catch (error) {
      console.error('Delete user error:', error);
      alert('❌ 사용자 삭제에 실패했습니다: ' + (error.response?.data?.error || error.message));
    }
  }

  async viewUserDetail(userId) {
    try {
      const response = await axios.get(`/api/admin/users/${userId}`, {
        headers: { 'X-User-Id': this.currentUser.id }
      });

      if (response.data.success) {
        const { user, sessions, payments, lastPayment, loginSessions, usageSummary } = response.data;
        
        // Fetch Live Speaking credits
        let liveSpeakingCredits = { remaining: 0, total: 0, used: 0, purchases: [] };
        try {
          const creditsResponse = await axios.get(`/api/hiing/credits/${userId}`);
          if (creditsResponse.data.success) {
            liveSpeakingCredits = {
              remaining: creditsResponse.data.remaining_credits || 0,
              total: creditsResponse.data.total_credits || 0,
              used: creditsResponse.data.used_credits || 0,
              purchases: creditsResponse.data.recent_purchase ? [creditsResponse.data.recent_purchase] : []
            };
          }
        } catch (err) {
          console.error('Failed to load live speaking credits:', err);
        }

        // Fetch Live Speaking sessions
        let liveSpeakingSessions = [];
        try {
          const sessionsResponse = await axios.get(`/api/hiing/sessions/${userId}`);
          if (sessionsResponse.data.success) {
            liveSpeakingSessions = sessionsResponse.data.sessions || [];
          }
        } catch (err) {
          console.error('Failed to load live speaking sessions:', err);
        }
        
        // Format last payment date
        const lastPaymentDate = lastPayment 
          ? new Date(lastPayment.confirmed_at).toLocaleDateString('ko-KR') 
          : '결제 없음';
        
        // Usage features with Korean names
        const featureNames = {
          aiConversations: 'AI 대화',
          pronunciationPractice: '발음 연습',
          wordSearch: '단어 검색',
          timerMode: '타이머 모드',
          scenarioMode: '시나리오 모드'
        };
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto';
        modal.innerHTML = `
          <div class="bg-white rounded-lg p-6 max-w-5xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-start mb-6 sticky top-0 bg-white pb-4 border-b z-10">
              <h3 class="text-2xl font-semibold">${user.username} 상세 정보</h3>
              <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl leading-none">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <h4 class="font-semibold mb-3 text-lg border-b pb-2">📋 기본 정보</h4>
                <div class="space-y-2 text-sm">
                  <p><strong>이메일:</strong> ${user.email || '-'}</p>
                  <p><strong>레벨:</strong> ${user.level}</p>
                  <p><strong>플랜:</strong> ${this.getPlanBadge(user.plan || 'free')}</p>
                  <p><strong>가입일:</strong> ${new Date(user.created_at).toLocaleDateString('ko-KR')}</p>
                  <p><strong>마지막 로그인:</strong> ${user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('ko-KR') : '-'}</p>
                </div>
              </div>
              <div>
                <h4 class="font-semibold mb-3 text-lg border-b pb-2">💳 결제 정보</h4>
                <div class="space-y-2 text-sm">
                  <p><strong>현재 플랜:</strong> ${this.getPlanBadge(user.plan || 'free')}</p>
                  <p><strong>결제 주기:</strong> ${user.billing_period === 'monthly' ? '월간' : user.billing_period === 'yearly' ? '연간' : '-'}</p>
                  <p><strong>마지막 결제:</strong> ${lastPaymentDate}</p>
                  <p><strong>총 결제 횟수:</strong> ${payments.filter(p => p.status === 'completed').length}회</p>
                  <p><strong>총 결제 금액:</strong> ₩${payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <h4 class="font-semibold mb-3 text-lg border-b pb-2">📞 1:1 전화영어</h4>
                <div class="space-y-2 text-sm">
                  <p><strong>남은 수업권:</strong> <span class="text-blue-600 font-bold">${liveSpeakingCredits.remaining}회</span></p>
                  <p><strong>총 구매:</strong> ${liveSpeakingCredits.total}회</p>
                  <p><strong>사용 완료:</strong> ${liveSpeakingCredits.used}회</p>
                  <p><strong>예약 수업:</strong> ${liveSpeakingSessions.filter(s => s.status === 'scheduled').length}회</p>
                  <p><strong>완료 수업:</strong> ${liveSpeakingSessions.filter(s => s.status === 'completed').length}회</p>
                </div>
              </div>
            </div>

            <div class="mb-6">
              <h4 class="font-semibold mb-3 text-lg border-b pb-2">📊 기능 사용 통계</h4>
              <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                ${Object.entries(featureNames).map(([key, name]) => `
                  <div class="bg-blue-50 rounded-lg p-3 text-center">
                    <div class="text-2xl font-bold text-blue-600">${usageSummary[key] || 0}</div>
                    <div class="text-xs text-gray-600 mt-1">${name}</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 class="font-semibold mb-3 text-lg border-b pb-2">📚 학습 통계</h4>
                <div class="space-y-2 text-sm">
                  <p><strong>총 세션:</strong> ${sessions.length}회</p>
                  <p><strong>총 메시지:</strong> ${sessions.reduce((sum, s) => sum + (s.message_count || 0), 0)}개</p>
                  <p><strong>로그인 횟수:</strong> ${loginSessions.length}회</p>
                </div>
              </div>
              <div>
                <h4 class="font-semibold mb-3 text-lg border-b pb-2">🎯 게임화 정보</h4>
                <div class="space-y-2 text-sm">
                  <p><strong>사용자 레벨:</strong> ${user.user_level || 1}</p>
                  <p><strong>경험치 (XP):</strong> ${user.xp || 0}</p>
                  <p><strong>총 경험치:</strong> ${user.total_xp || 0}</p>
                  <p><strong>코인:</strong> ${user.coins || 0}</p>
                  <p><strong>현재 연속:</strong> ${user.current_streak || 0}일</p>
                  <p><strong>최장 연속:</strong> ${user.longest_streak || 0}일</p>
                </div>
              </div>
            </div>

            ${liveSpeakingSessions.length > 0 ? `
            <div class="mb-6">
              <h4 class="font-semibold mb-3 text-lg border-b pb-2">📞 1:1 전화영어 예약 내역</h4>
              <div class="max-h-64 overflow-y-auto">
                ${liveSpeakingSessions.slice(0, 10).map(s => `
                  <div class="border-b py-2 hover:bg-gray-50 flex justify-between items-center">
                    <div class="flex-1">
                      <p class="text-sm font-medium">${s.teacher_name || 'Unknown Teacher'}</p>
                      <p class="text-xs text-gray-500">${new Date(s.scheduled_at).toLocaleString('ko-KR')} - ${s.duration}분</p>
                      ${s.student_phone ? `<p class="text-xs text-gray-400">📱 ${s.student_phone}</p>` : ''}
                    </div>
                    <span class="px-2 py-1 text-xs rounded ${s.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                      ${s.status === 'completed' ? '✅ 완료' : '⏰ 예약'}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}

            <div class="mb-6">
              <h4 class="font-semibold mb-3 text-lg border-b pb-2">🕒 최근 세션 (최대 10개)</h4>
              <div class="max-h-64 overflow-y-auto">
                ${sessions.slice(0, 10).map(s => `
                  <div class="border-b py-2 hover:bg-gray-50">
                    <p class="text-sm font-medium">${s.topic_name || 'Unknown'}</p>
                    <p class="text-xs text-gray-500">${new Date(s.started_at).toLocaleString('ko-KR')} - 메시지: ${s.message_count || 0}개</p>
                  </div>
                `).join('') || '<p class="text-gray-500 text-sm py-4 text-center">세션 없음</p>'}
              </div>
            </div>

            <div>
              <h4 class="font-semibold mb-3 text-lg border-b pb-2">💰 결제 내역</h4>
              <div class="max-h-64 overflow-y-auto">
                ${payments.map(p => `
                  <div class="border-b py-2 flex justify-between hover:bg-gray-50">
                    <div>
                      <p class="text-sm font-medium">${p.plan_name}</p>
                      <p class="text-xs text-gray-500">${new Date(p.created_at).toLocaleString('ko-KR')}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-semibold">₩${p.amount.toLocaleString()}</p>
                      <p class="text-xs ${p.status === 'completed' ? 'text-green-600' : p.status === 'failed' ? 'text-red-600' : 'text-yellow-600'}">${p.status}</p>
                    </div>
                  </div>
                `).join('') || '<p class="text-gray-500 text-sm py-4 text-center">결제 없음</p>'}
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
    } catch (error) {
      console.error('View user detail error:', error);
      alert('사용자 정보 로딩 실패: ' + (error.response?.data?.error || error.response?.data?.details || error.message));
    }
  }
}

// Initialize app
const worvox = new WorVox();
// Backward compatibility alias
const heyspeak = worvox;

// Initialize dark mode on page load
worvox.initDarkMode();

// Google Sign-In callback
window.handleGoogleLogin = async (response) => {
  try {
    console.log('🔐 Google Sign-In response received');
    console.log('Credential length:', response.credential?.length);
    
    // Send credential to backend
    console.log('📤 Sending credential to backend...');
    const result = await axios.post('/api/users/google-login', {
      credential: response.credential
    });
    
    console.log('✅ Login successful:', result.data);
    
    // Store user data with correct key
    localStorage.setItem('worvox_user', JSON.stringify(result.data.user));
    console.log('💾 User data stored in localStorage');
    
    // Update app state
    worvox.currentUser = result.data.user;
    
    // Update user plan from database
    worvox.userPlan = result.data.user.plan || 'free';
    console.log('📊 User plan updated to:', worvox.userPlan);
    
    // If new user, show onboarding steps
    if (result.data.isNew) {
      console.log('🆕 New user - showing onboarding');
      worvox.onboardingStep = 2; // Start from step 2 (level selection)
      worvox.showOnboardingStep();
    } else {
      console.log('👤 Existing user - loading data...');
      // Load user data and show home
      await worvox.loadUsageFromServer();
      await worvox.loadGamificationStats();
      worvox.showTopicSelection();
    }
    
  } catch (error) {
    console.error('❌ Google login error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    let errorMsg = '로그인에 실패했습니다. 다시 시도해주세요.';
    
    if (error.response?.data?.error) {
      errorMsg = error.response.data.error;
      if (error.response.data.details) {
        errorMsg += '\n상세: ' + error.response.data.details;
      }
    } else if (error.message) {
      errorMsg += '\n오류: ' + error.message;
    }
    
    alert(errorMsg);
  }
};

// Initialize Google Sign-In on page load
window.addEventListener('load', () => {
  if (window.google) {
    google.accounts.id.initialize({
      client_id: '506018364729-ichplnfnqlk2hmh1bhblepm0un44ltdr.apps.googleusercontent.com',
      callback: handleGoogleLogin,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    
    // Render button if it exists
    const googleButtonDiv = document.getElementById('googleSignInButton');
    if (googleButtonDiv) {
      google.accounts.id.renderButton(
        googleButtonDiv,
        {
          theme: 'outline',
          size: 'large',
          width: 280,
          text: 'signin_with'
        }
      );
    }
    
    console.log('Google Sign-In initialized');
  } else {
    console.warn('Google Sign-In library not loaded');
  }
});

// Initialize WorVox app
window.worvox = new WorVox();
console.log('WorVox app initialized');
