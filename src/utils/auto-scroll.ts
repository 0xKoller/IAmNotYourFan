// High-quality auto-scroll engine for X/Twitter following list
// Inspired by luqmanoop (2025) + defensive improvements

export type ScrollProgress = {
  currentHeight: number;
  usersFound: number;
  isComplete: boolean;
};

export async function autoScrollFollowingList(
  onProgress: (progress: ScrollProgress) => void,
  options: {
    maxScrolls?: number;
    waitBetweenScrolls?: number;   // ms
    stabilityThreshold?: number;   // how many times height must stay the same
  } = {}
): Promise<void> {
  const {
    maxScrolls = 120,
    waitBetweenScrolls = 650,
    stabilityThreshold = 3,
  } = options;

  let previousHeight = 0;
  let stableCount = 0;
  let scrolls = 0;

  const scrollContainer = document.scrollingElement || document.documentElement;

  while (scrolls < maxScrolls) {
    const currentHeight = scrollContainer.scrollHeight;

    onProgress({
      currentHeight,
      usersFound: document.querySelectorAll('[data-testid="UserCell"], [data-testid="cellInnerDiv"]').length,
      isComplete: false,
    });

    if (currentHeight === previousHeight) {
      stableCount++;
      if (stableCount >= stabilityThreshold) {
        // Height hasn't changed for a while — we probably reached the end
        break;
      }
    } else {
      stableCount = 0;
    }

    // Scroll down
    window.scrollTo({
      top: currentHeight,
      behavior: 'smooth',
    });

    previousHeight = currentHeight;
    scrolls++;

    // Give X time to render more virtualized content
    await sleep(waitBetweenScrolls + Math.random() * 180);
  }

  onProgress({
    currentHeight: scrollContainer.scrollHeight,
    usersFound: document.querySelectorAll('[data-testid="UserCell"], [data-testid="cellInnerDiv"]').length,
    isComplete: true,
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Expose for console testing
if (typeof window !== 'undefined') {
  (window as any).Iamnotyourfan = {
    ...(window as any).Iamnotyourfan,
    autoScrollFollowingList,
  };
}
