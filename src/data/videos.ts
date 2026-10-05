/**
 * Video Gallery entries. To add a video: paste its YouTube id (the part after "v=" in the video link)
 * and write a short title and description. They appear as cards on the Media page, in this order.
 * While this list is empty the page shows the channel's latest uploads player with `channelDescription` under it.
 */
export interface VideoItem { id: string; title: string; description: string }
export const videos: VideoItem[] = [
  // { id: "YOUTUBE_VIDEO_ID", title: "Health camp in Rehli", description: "What happened, where, and who it helped." },
];
export const channelDescription =
  "Watch our latest field videos: health camps, plantation drives, Shiksha Kendra classes, women's skill training and relief work across Madhya Pradesh. New videos are added to our YouTube channel as they are recorded.";
