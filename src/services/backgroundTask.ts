import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { updateWallpaperWithDailyQuote } from './dailyQuote';

const BACKGROUND_FETCH_TASK = 'DAILY_QUOTE_UPDATE';

// Define the background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('[BackgroundFetch] Running daily quote update task');
    const success = await updateWallpaperWithDailyQuote();

    if (success) {
      console.log('[BackgroundFetch] Daily quote updated successfully');
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      console.log('[BackgroundFetch] No new data to update');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
  } catch (error) {
    console.error('[BackgroundFetch] Error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundTask(): Promise<boolean> {
  try {
    const status = await BackgroundFetch.getStatusAsync();

    if (status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
        status === BackgroundFetch.BackgroundFetchStatus.Denied) {
      console.log('[BackgroundFetch] Background fetch is not available');
      return false;
    }

    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (isRegistered) {
      console.log('[BackgroundFetch] Task already registered');
      return true;
    }

    // Register the task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60 * 60 * 12, // 12 hours minimum (will run ~once a day)
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('[BackgroundFetch] Task registered successfully');
    return true;
  } catch (error) {
    console.error('[BackgroundFetch] Registration error:', error);
    return false;
  }
}

export async function unregisterBackgroundTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      console.log('[BackgroundFetch] Task unregistered');
    }
  } catch (error) {
    console.error('[BackgroundFetch] Unregister error:', error);
  }
}

export async function getBackgroundTaskStatus(): Promise<{
  isRegistered: boolean;
  status: BackgroundFetch.BackgroundFetchStatus | null;
}> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    const status = await BackgroundFetch.getStatusAsync();
    return { isRegistered, status };
  } catch (error) {
    console.error('[BackgroundFetch] Status check error:', error);
    return { isRegistered: false, status: null };
  }
}
