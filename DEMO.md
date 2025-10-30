# Creating the Demo GIF

## Tools Needed
- **Screen recording**: QuickTime Player (Mac) or OBS Studio (cross-platform)
- **GIF conversion**: Gifski (Mac), ffmpeg, or online tools like ezgif.com

## Recording Steps

### What to Show (30-45 seconds total)

1. **Opening shot** (2s)
   - Show the empty homepage

2. **Add a function** (5s)
   - Click "Add Function"
   - Type `get_weather` as function name
   - Add description: "Get current weather for a location"

3. **Add parameters** (10s)
   - Click "Add Parameter"
   - First param: key=`location`, type=`string`, description="City name", check Required
   - Second param: key=`unit`, type=`string`, description="Temperature unit"

4. **Advanced options** (5s)
   - Click "Advanced" on the `unit` parameter
   - Add enum values: `celsius, fahrenheit`
   - Close modal

5. **Show live preview** (3s)
   - Pan to right side showing the JSON preview updating

6. **Copy to clipboard** (2s)
   - Click "Copy" button
   - Show toast notification

7. **Share URL** (3s)
   - Click "Share" button
   - Show the shareable URL modal

8. **Duplicate function** (3s)
   - Click "Duplicate" on the function
   - Show two functions now exist

9. **Test validation** (2s)
   - Click "Test" button
   - Show green checkmark validation

10. **Final shot** (2s)
    - Show completed schema with 2 functions

## Recording Settings
- **Resolution**: 1280x720 or 1920x1080
- **Frame rate**: 30fps minimum
- **Duration**: Keep under 60 seconds
- **File size**: Target under 10MB for GitHub

## QuickTime Recording (Mac)
```bash
# Open QuickTime Player
# File > New Screen Recording
# Select area around browser window (don't include entire screen)
# Click record and follow the steps above
# File > Export As > Save
```

## Converting to GIF

### Using Gifski (Recommended for Mac)
```bash
# Install gifski
brew install gifski

# Convert video to GIF
gifski -o demo.gif --fps 15 --quality 90 --width 800 recording.mov
```

### Using ffmpeg
```bash
# Install ffmpeg
brew install ffmpeg

# Generate palette for better colors
ffmpeg -i recording.mov -vf "fps=15,scale=800:-1:flags=lanczos,palettegen" palette.png

# Create GIF
ffmpeg -i recording.mov -i palette.png -filter_complex "fps=15,scale=800:-1:flags=lanczos[x];[x][1:v]paletteuse" demo.gif
```

### Using online tool
1. Upload video to https://ezgif.com/video-to-gif
2. Set size to 800px width
3. Set frame rate to 15fps
4. Optimize for file size
5. Download result

## Optimization
If the GIF is too large:
```bash
# Use gifsicle to optimize
brew install gifsicle
gifsicle -O3 --colors 256 demo.gif -o demo-optimized.gif
```

## Add to Repository
```bash
# Copy the GIF to the repo root
cp demo.gif /path/to/repo/

# Commit
git add demo.gif
git commit -m "Add demo GIF"
git push origin main
```

The GIF will automatically display in the README!

## Tips
- Keep cursor movements smooth
- Don't type too fast (people need to read)
- Use a clean browser window (no bookmarks bar, close unnecessary tabs)
- Consider adding subtle cursor highlighting
- Test the GIF size - GitHub has a 10MB limit
- Make sure text is readable at 800px width

