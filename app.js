const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Initialize app
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

// Serve HTML files
app.engine('html', require('ejs').renderFile);

// Set up multer for profile image uploads
const upload = multer({
  dest: 'public/uploads/',
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);
    if (mimeType && extName) {
      return cb(null, true);
    }
    cb('Error: Only images (jpeg, jpg, png) are allowed.');
  },
});

// Load or initialize user database
const usersFile = path.join(__dirname, 'data/users.json');
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, JSON.stringify([]));
}
const readUsers = () => JSON.parse(fs.readFileSync(usersFile));
const saveUsers = (data) => fs.writeFileSync(usersFile, JSON.stringify(data, null, 2));

// Routes
app.get('/', (req, res) => res.redirect('/login'));

app.get('/register', (req, res) => res.render('register'));
app.post('/register', upload.single('profileImage'), (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();

  if (users.find((user) => user.username === username)) {
    return res.send('Username already exists.');
  }

  const newUser = {
    id: Date.now(),
    username,
    password,
    profileImage: req.file ? `/uploads/${req.file.filename}` : null,
  };

  users.push(newUser);
  saveUsers(users);

  res.redirect('/login');
});

app.get('/login', (req, res) => res.render('login'));
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();

  const user = users.find((user) => user.username === username && user.password === password);

  if (!user) {
    return res.send('Invalid username or password.');
  }

  res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
  const users = readUsers();
  res.render('dashboard', { users });
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
