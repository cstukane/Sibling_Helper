// Simple analytics service
class AnalyticsService {
  private isEnabled: boolean = true;

  // Enable or disable analytics
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Log an event
  logEvent(eventName: string, properties: Record<string, any> = {}) {
    if (!this.isEnabled) {
      return;
    }

    // In a real app, you would send this to your analytics service
    console.log(`[ANALYTICS] ${eventName}:`, properties);
  }

  // Log navigation events
  logNavigation(screen: string) {
    this.logEvent('nav_menu_opened', { screen });
  }

  // Log settings events
  logSettings() {
    this.logEvent('settings_opened', {});
  }

  // Log appearance changes
  logAppearanceChange(mode: 'system' | 'light' | 'dark') {
    this.logEvent('appearance_changed', { mode });
  }

  // Log child switching
  logChildSwitch(childId: string) {
    // In a real app, you would hash the child ID for privacy
    const childIdHashed = childId.substring(0, 6);
    this.logEvent('active_child_switched', { child_id_hashed: childIdHashed });
  }

  // Log submission creation
  logSubmissionCreated(questId: string, points: number | null, isOffline: boolean) {
    this.logEvent('submission_created', { 
      quest_id: questId, 
      points: points, 
      offline: isOffline 
    });
  }

  // Log pending submissions view
  logPendingOpened() {
    this.logEvent('pending_opened', {});
  }

  // Log parent linking events
  logLinkParentAttempt(length: number, source: string) {
    this.logEvent('link_parent_attempt', { length, source });
  }

  logLinkParentSuccess(parentId: string) {
    // In a real app, you would hash the parent ID for privacy
    const parentIdHashed = parentId.substring(0, 6);
    this.logEvent('link_parent_success', { parent_id_hashed: parentIdHashed });
  }

  logLinkParentFailure(reason: string) {
    this.logEvent('link_parent_failure', { reason });
  }
}

// Create a singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;