/**
 * Skeleton Loading Components
 * 로딩 중 콘텐츠 placeholder
 */

// Skeleton CSS (Tailwind 사용)
const skeletonStyles = `
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  .skeleton {
    background: linear-gradient(
      90deg,
      #f0f0f0 0%,
      #e0e0e0 50%,
      #f0f0f0 100%
    );
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
    border-radius: 4px;
  }

  .dark .skeleton {
    background: linear-gradient(
      90deg,
      #2d2d2d 0%,
      #3d3d3d 50%,
      #2d2d2d 100%
    );
    background-size: 1000px 100%;
  }
`;

// CSS 주입
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = skeletonStyles;
  document.head.appendChild(style);
}

class SkeletonLoader {
  /**
   * 대시보드 스켈레톤
   */
  static dashboard() {
    return `
      <div class="space-y-6 animate-pulse">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          ${Array(4).fill(0).map(() => `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between mb-3">
                <div class="w-12 h-12 skeleton rounded-lg"></div>
                <div class="w-16 h-4 skeleton"></div>
              </div>
              <div class="w-20 h-8 skeleton mb-2"></div>
              <div class="w-24 h-4 skeleton"></div>
            </div>
          `).join('')}
        </div>

        <!-- Feature Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${Array(6).fill(0).map(() => `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 skeleton rounded-full"></div>
                <div class="flex-1">
                  <div class="w-32 h-5 skeleton mb-2"></div>
                  <div class="w-24 h-4 skeleton"></div>
                </div>
              </div>
              <div class="w-full h-10 skeleton rounded-lg"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 히스토리 리스트 스켈레톤
   */
  static historyList(count = 5) {
    return `
      <div class="space-y-4">
        ${Array(count).fill(0).map(() => `
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 skeleton rounded-lg flex-shrink-0"></div>
              <div class="flex-1 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="w-40 h-5 skeleton"></div>
                  <div class="w-24 h-4 skeleton"></div>
                </div>
                <div class="w-full h-4 skeleton"></div>
                <div class="w-3/4 h-4 skeleton"></div>
                <div class="flex gap-2">
                  <div class="w-16 h-6 skeleton rounded-full"></div>
                  <div class="w-20 h-6 skeleton rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * 테이블 스켈레톤
   */
  static table(rows = 5, cols = 4) {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              ${Array(cols).fill(0).map(() => `
                <th class="px-6 py-4">
                  <div class="w-24 h-4 skeleton"></div>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            ${Array(rows).fill(0).map(() => `
              <tr>
                ${Array(cols).fill(0).map(() => `
                  <td class="px-6 py-4">
                    <div class="w-32 h-4 skeleton"></div>
                  </td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * 카드 그리드 스켈레톤
   */
  static cardGrid(count = 6) {
    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${Array(count).fill(0).map(() => `
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div class="w-full h-40 skeleton rounded-lg mb-4"></div>
            <div class="w-3/4 h-6 skeleton mb-3"></div>
            <div class="w-full h-4 skeleton mb-2"></div>
            <div class="w-5/6 h-4 skeleton mb-4"></div>
            <div class="flex gap-2">
              <div class="w-20 h-8 skeleton rounded-lg"></div>
              <div class="w-24 h-8 skeleton rounded-lg"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * 프로필 스켈레톤
   */
  static profile() {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-6 mb-8">
          <div class="w-24 h-24 skeleton rounded-full"></div>
          <div class="flex-1 space-y-3">
            <div class="w-48 h-8 skeleton"></div>
            <div class="w-64 h-5 skeleton"></div>
            <div class="flex gap-2">
              <div class="w-20 h-6 skeleton rounded-full"></div>
              <div class="w-24 h-6 skeleton rounded-full"></div>
            </div>
          </div>
        </div>
        
        <div class="space-y-4">
          ${Array(4).fill(0).map(() => `
            <div class="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <div class="w-32 h-5 skeleton"></div>
              <div class="w-40 h-5 skeleton"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 통계 차트 스켈레톤
   */
  static chart() {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-6">
          <div class="w-40 h-6 skeleton"></div>
          <div class="w-24 h-4 skeleton"></div>
        </div>
        <div class="w-full h-64 skeleton rounded-lg"></div>
        <div class="flex justify-around mt-6">
          ${Array(4).fill(0).map(() => `
            <div class="text-center">
              <div class="w-16 h-4 skeleton mb-2 mx-auto"></div>
              <div class="w-12 h-6 skeleton mx-auto"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 간단한 텍스트 스켈레톤
   */
  static text(lines = 3) {
    return `
      <div class="space-y-3">
        ${Array(lines).fill(0).map((_, i) => `
          <div class="w-${i === lines - 1 ? '3/4' : 'full'} h-4 skeleton"></div>
        `).join('')}
      </div>
    `;
  }

  /**
   * 버튼 스켈레톤
   */
  static button(count = 1) {
    return `
      <div class="flex gap-3">
        ${Array(count).fill(0).map(() => `
          <div class="w-32 h-10 skeleton rounded-lg"></div>
        `).join('')}
      </div>
    `;
  }

  /**
   * 커스텀 스켈레톤
   */
  static custom(width = 'full', height = '4') {
    return `<div class="w-${width} h-${height} skeleton"></div>`;
  }
}

// 전역 접근
if (typeof window !== 'undefined') {
  window.SkeletonLoader = SkeletonLoader;
}
