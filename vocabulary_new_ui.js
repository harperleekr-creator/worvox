// New Vocabulary UI with Difficulty Tabs and Modes
// This code will replace the existing showVocabulary function

async showVocabulary(difficulty = 'beginner', mode = 'list') {
  this.vocabularyDifficulty = difficulty; // 'beginner', 'intermediate', 'advanced'
  this.vocabularyMode = mode; // 'list', 'flashcard', 'quiz'
  
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
      <div class="flex h-screen bg-gray-50">
        <!-- Sidebar -->
        ${this.getSidebar('vocabulary')}
        
        <!-- Main Content -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Header with Back Button -->
          <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
            <div class="flex items-center gap-2 mb-4">
              <button onclick="worvox.showTopicSelection()" 
                class="md:hidden text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
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
                <i class="fas fa-seedling mr-2"></i>초급 (Beginner)
              </button>
              <button onclick="worvox.showVocabulary('intermediate', '${mode}')" 
                class="flex-shrink-0 px-4 md:px-6 py-2 md:py-3 ${difficulty === 'intermediate' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} rounded-lg transition-all font-semibold text-sm md:text-base">
                <i class="fas fa-book mr-2"></i>중급 (Intermediate)
              </button>
              <button onclick="worvox.showVocabulary('advanced', '${mode}')" 
                class="flex-shrink-0 px-4 md:px-6 py-2 md:py-3 ${difficulty === 'advanced' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} rounded-lg transition-all font-semibold text-sm md:text-base">
                <i class="fas fa-graduation-cap mr-2"></i>고급 (Advanced)
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
            
            <!-- Word Count & Progress -->
            <div class="mt-4 flex items-center gap-4 text-sm">
              <div class="flex items-center gap-2">
                <i class="fas fa-book text-${difficulty === 'beginner' ? 'green' : difficulty === 'intermediate' ? 'blue' : 'purple'}-600"></i>
                <span class="font-semibold">${words.length} words</span>
              </div>
              ${this.currentUser ? `
                <div class="flex items-center gap-2">
                  <i class="fas fa-check-circle text-green-600"></i>
                  <span>${Object.keys(progressData).length} learned</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="fas fa-star text-yellow-500"></i>
                  <span>${bookmarkedWords.length} bookmarked</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto p-4 md:p-6">
            ${this.renderVocabularyContent(mode, words, difficulty, progressData, bookmarkedWords)}
          </div>
        </div>
      </div>
    `;
    
    // Initialize mode-specific features
    if (mode === 'flashcard') {
      this.flashcardIndex = 0;
      this.flashcardFlipped = false;
    } else if (mode === 'quiz') {
      this.initializeQuiz(words, difficulty);
    }
    
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
  // Generate quiz questions from words
  const quizWords = words.slice(0, 10); // 10 questions per quiz
  
  return `
    <div class="max-w-3xl mx-auto">
      <div id="quizContainer">
        <!-- Quiz will be initialized by initializeQuiz() -->
      </div>
    </div>
  `;
}
