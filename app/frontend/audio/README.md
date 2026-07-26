"""Placeholder for audio files.

INSTRUCTIONS FOR AUDIO FILES:

1. **MP3 Format**: 
   - Upload via admin panel (/admin)
   - Each cue can have one audio file
   - Max file size: 50MB
   - Supports: MP3, WAV, OGG, M4A

2. **Naming**: 
   - Files are renamed to: cue_<ID>.mp3
   - Original name is not preserved

3. **Latency Target**:
   - <150ms from cue trigger to audio playback on local network
   - Audio is preloaded on app startup

4. **Fallback**:
   - If MP3 missing or fails to play
   - App automatically uses Text-to-Speech (TTS)
   - Configure per-cue via audio_mode setting

5. **Upload Process**:
   1. Go to /admin
   2. Create a cue or select existing cue
   3. Choose audio file from local device
   4. Click "Upload Audio"
   5. Audio is ready for immediate use

6. **Testing**:
   - Use "Test Audio" button in app to verify audio works
   - Check browser console for audio errors
   - Verify device volume and app volume settings

7. **Recommended Audio Settings**:
   - Bitrate: 192kbps or higher
   - Sample rate: 44.1kHz or 48kHz
   - Duration: 1-5 seconds per cue
   - Level: -12dB to -3dB (consistent volume)

Example MP3 creation with FFmpeg:
  ffmpeg -f lavfi -i "sine=f=1000:d=2" -q:a 9 output.mp3

This creates a 2-second 1kHz tone.
"""
