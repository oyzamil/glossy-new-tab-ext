# Glossy New Tab Browser Extension

A beautiful, feature-rich Chrome extension that replaces your new tab with a customizable dashboard.

![Glossy New Tab Browser Extension](screenshots/ext-thumb.png)

## 🌟 Features

- **🔍 Search Bar**: Quick web search with multiple search engine options (Google, Bing, DuckDuckGo, Yahoo, Ecosia)
- **⚡ Quick Shortcuts**: Add, edit, and manage your favorite websites with right-click context menu
- **🕐 Clock Widget**: Beautiful clock display with date
- **🌤️ Weather Widget**: Real-time weather information (location-based)
- **🎵 Audio Player**: Background audio player that works even when tab is not active
- **🎨 Custom Backgrounds**: Upload and manage custom images/videos as backgrounds (stored in IndexedDB)
- **⚙️ Settings Sidebar**: Easy access to all customization options

## 🛠️ Tech Stack

- **WXT**: Modern web extension framework
- **React 18**: UI library
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Ant Design (ANTD)**: Component library
- **IndexedDB (idb)**: Client-side storage for backgrounds
- **Chrome Storage API**: Settings and shortcuts storage

## 📝 Usage Guide

### Search Bar

- Type your query and press Enter or click the search button
- Click the dropdown on the right to switch between search engines
- Your search engine preference is saved automatically

### Shortcuts

- Click the "+" button to add a new shortcut
- Right-click any shortcut to enter edit mode
- Edit or delete shortcuts using the buttons that appear
- Click anywhere outside to exit edit mode
- Shortcuts are automatically saved

### Weather Widget

- Located in the bottom-left corner
- Automatically detects your location (requires permission)
- Shows current temperature, conditions, and location

### Audio Player

- Click the music note floating button to show/hide the player
- Play/pause, skip tracks, and adjust volume
- Audio continues playing even when the tab is not active
- Playlist shows all available tracks

### Background Customization

1. Click the floating settings button (bottom-right)
2. Click the image icon to open the sidebar
3. Upload images or videos as backgrounds
4. Click "Apply" on any background to set it
5. Click "Clear Current Background" to return to default gradient

### Custom Backgrounds Storage

- Images and videos are stored in IndexedDB
- No file size uploaded to servers
- Max file size: 10MB for images, 50MB for videos
- Stored locally in your browser

### Audio not playing

- Ensure audio files are in the `public/audio` folder
- Check file paths in `AudioPlayer.tsx`
- Verify audio file formats are supported (.mp3, .wav, .ogg)

### Weather not showing

- Allow location permission when prompted
- Check browser console for API errors
- The current implementation uses mock data - integrate with a real weather API

### Backgrounds not saving

- Check browser console for IndexedDB errors
- Clear browser data and try again
- Ensure file sizes are within limits

## 🔐 Permissions

This extension requires:

- `storage`: To save shortcuts and settings
- `unlimitedStorage`: To store backgrounds in IndexedDB
- Location access (optional): For weather widget

## 📄 License

MIT License - feel free to modify and distribute!

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests

## 🌐 Browser Compatibility

- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Brave
- ✅ Other Chromium-based browsers

## 📮 Support

For issues or questions:

1. Check the troubleshooting section
2. Review the browser console for errors
3. Create an issue with detailed information

---

Built with ❤️ using WXT, React, and TypeScript
