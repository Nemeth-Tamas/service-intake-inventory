import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Checks if ffmpeg and ffprobe are installed and available in the PATH.
 */
export async function checkFmpegsInstalled(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version');
    await execAsync('ffprobe -version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Aggressively optimizes an uploaded video:
 * - Trims to max 90 seconds.
 * - Strips audio (-an).
 * - Caps resolution to max 720p (using dynamic scaling logic).
 * - Re-encodes using H.264 video codec (-c:v libx264).
 * - Uses yuv420p pixel format for browser compatibility.
 * - Caps video bitrate around 1000k.
 * - Uses +faststart for immediate browser playback start.
 */
export async function optimizeVideo(inputPath: string, outputPath: string): Promise<void> {
  // Scale down to max 720p without upscaling
  const scaleFilter = "scale='if(gt(iw,ih),-2,min(720,ih))':'if(gt(iw,ih),min(720,ih),-2)'";
  const cmd = `ffmpeg -y -i "${inputPath}" -t 90 -an -vf "${scaleFilter}" -c:v libx264 -pix_fmt yuv420p -b:v 1000k -movflags +faststart "${outputPath}"`;
  
  try {
    await execAsync(cmd);
  } catch (error: any) {
    if (error.code === 127 || error.message.includes('not found') || error.message.includes('ENOENT')) {
      throw new Error('ffmpeg is not installed on this system');
    }
    throw error;
  }
}

/**
 * Extracts video metadata using ffprobe.
 */
export async function getVideoMetadata(filePath: string) {
  try {
    const { stdout } = await execAsync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration,codec_name -of json "${filePath}"`);
    const info = JSON.parse(stdout);
    const stream = info.streams?.[0];
    return {
      width: stream?.width ? parseInt(stream.width, 10) : null,
      height: stream?.height ? parseInt(stream.height, 10) : null,
      durationSeconds: stream?.duration ? Math.round(parseFloat(stream.duration)) : null,
      codec: stream?.codec_name || null,
    };
  } catch (error: any) {
    if (error.code === 127 || error.message.includes('not found') || error.message.includes('ENOENT')) {
      throw new Error('ffprobe is not installed on this system');
    }
    return {
      width: null,
      height: null,
      durationSeconds: null,
      codec: null,
    };
  }
}

/**
 * Generates a thumbnail image from a video.
 */
export async function generateThumbnail(inputPath: string, outputPath: string): Promise<void> {
  // ss 1.500: capture frame at 1.5s
  const scaleFilter = "scale='if(gt(iw,ih),-2,min(360,ih))':'if(gt(iw,ih),min(360,ih),-2)'";
  const cmd = `ffmpeg -y -ss 00:00:01.500 -i "${inputPath}" -vframes 1 -f image2 -vf "${scaleFilter}" "${outputPath}"`;
  
  try {
    await execAsync(cmd);
  } catch (error: any) {
    try {
      // Fallback: try capturing the very first frame without scaling
      const fallbackCmd = `ffmpeg -y -ss 00:00:00.000 -i "${inputPath}" -vframes 1 -f image2 "${outputPath}"`;
      await execAsync(fallbackCmd);
    } catch (fallbackError: any) {
      throw new Error('Failed to generate thumbnail: ' + fallbackError.message);
    }
  }
}
