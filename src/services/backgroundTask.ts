import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { updateWallpaperWithDailyQuote } from './dailyQuote';

const BACKGROUND_TASK_NAME = 'DAILY_QUOTE_UPDATE';

// Define the background task in global scope
TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    console.log('[BackgroundTask] Running daily quote update task');
    const success = await updateWallpaperWithDailyQuote();

    if (success) {
      console.log('[BackgroundTask] Daily quote updated successfully');
    } else {
      console.log('[BackgroundTask] No update performed');
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
