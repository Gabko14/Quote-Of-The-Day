import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { rotateDailyQuoteInBackground } from './dailyQuote';
import { getCachedWallpaperPath } from './wallpaperCache';
import { setBothWallpapers } from './wallpaperService';
import { getDarkBackground } from '../db';

const BACKGROUND_TASK_NAME = 'DAILY_QUOTE_UPDATE';

// Define the background task in global scope
TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    console.log('[BackgroundTask] Running daily quote rotation task');
    const quote = await rotateDailyQuoteInBackground();

    if (!quote) {
      console.log('[BackgroundTask] No quotes available');
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    console.log('[BackgroundTask] Quote rotated to:', quote.id, quote.text.substring(0, 30));

    const isDark = await getDarkBackground();
    const cachedPath = getCachedWallpaperPath(quote.id, isDark);

    if (!cachedPath) {
      console.log('[BackgroundTask] No cached wallpaper for quote', quote.id, '- user needs to open app');
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    const result = await setBothWallpapers(cachedPath);
    if (result.success) {
      console.log('[BackgroundTask] Wallpaper set successfully for quote', quote.id);
    } else {
      console.log('[BackgroundTask] Failed to set wallpaper:', result.error);
    }

    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('[BackgroundTask] Error:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundTask(): Promise<boolean> {
  try {
    const status = await BackgroundTask.getStatusAsync();

    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
      console.log('[BackgroundTask] Background tasks are not available');
      return false;
    }

    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    if (isRegistered) {
      console.log('[BackgroundTask] Task already registered');
      return true;
    }

    // Register the task (minimumInterval is in minutes, min 15 minutes)
    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 60 * 12, // 12 hours in minutes
    });

    console.log('[BackgroundTask] Task registered successfully');
    return true;
  } catch (error) {
    console.error('[BackgroundTask] Registration error:', error);
    return false;
  }
}

export async function unregisterBackgroundTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    if (isRegistered) {
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_NAME);
      console.log('[BackgroundTask] Task unregistered');
    }
  } catch (error) {
    console.error('[BackgroundTask] Unregister error:', error);
  }
}

export async function getBackgroundTaskStatus(): Promise<{
  isRegistered: boolean;
  status: BackgroundTask.BackgroundTaskStatus | null;
}> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    const status = await BackgroundTask.getStatusAsync();
    return { isRegistered, status };
  } catch (error) {
    console.error('[BackgroundTask] Status check error:', error);
    return { isRegistered: false, status: null };
  }
}
