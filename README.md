# Tower Stack

A minimalist, addictive tower stacking game built with vanilla HTML, CSS, and JavaScript.

## 🎮 How to Play
- **Tap or Click** to place the moving block.
- Stack blocks as high as possible.
- Any part of the block that overhangs the tower will be sliced off.
- The game gets faster as you go higher.
- If you miss the tower completely or the block becomes too small, it's Game Over!

## 🛠 Installation & Deployment
This game is a static web project. You can deploy it immediately:

1. **Local**: Open `index.html` in any web browser.
2. **Web Server**: Upload the entire `/tower-stack` folder to your web server (Apache, Nginx, Vercel, Netlify, etc.).

## 📁 Project Structure
```
/tower-stack
  /assets          # Images (SVG) and Sounds (WAV)
  index.html       # Main game structure
  style.css        # Styles and animations
  game.js          # Game logic
  readme.md        # This file
```

## ⚙️ Customization

### Changing Colors
Open `game.js` and modify the `this.colors` array in the `Game` constructor:
```javascript
this.colors = ['#ff9a9e', '#fecfef', '#a18cd1', ...];
```

### Adjusting Difficulty
In `game.js`:
- **Initial Speed**: Change `this.speed = 3;` in `initBase()`.
- **Speed Increase**: Change `this.speed += 0.1;` in `placeBlock()`.
- **Block Size**: Change `this.baseWidth = 200;` in `Game` constructor.

### Assets
- Replace images in `/assets` with your own SVGs or PNGs.
- Replace audio files in `/assets` with your own `.wav` or `.mp3` files.

## 📱 Compatibility
- Works on Desktop (Mouse)
- Works on Mobile/Tablet (Touch)
- Responsive design adapts to screen size.

## 📄 License
Open source. Feel free to modify and distribute.
