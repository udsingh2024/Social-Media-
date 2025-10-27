const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usermodel = require('./models/user');
const postmodel = require('./models/post');
const crypto = require('crypto')
const upload = require('./config/multerconfig')




// ✅ 1. Use middlewares BEFORE routes
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');



// ✅ 2. Home route
app.get('/', (req, res) => {
  res.render('index');
});


// ✅ 3. Register route
app.post('/register', async (req, res) => {
  let { username, name, age, email, password } = req.body;

  let user = await usermodel.findOne({ email });
  if (user) return res.status(400).send("User already registered");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let newUser = await usermodel.create({
        name, username, email, age, password: hash
      });

      //Generate token & cookie
      let token = jwt.sign({ email }, "secreteKey");
      res.cookie('token', token);
      res.send("Registered successfully!");
    });
  });
});


// ✅ 4. Login route
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  let { email, password } = req.body;
  let user = await usermodel.findOne({ email });
  if (!user) return res.status(400).send("User not found");

  bcrypt.compare(password, user.password, (err, result) => {
    if (result) { //if true
      let token = jwt.sign({ email }, "secreteKey");
      res.cookie('token', token);
      res.status(200).redirect('/profile')
    } else res.redirect('/login');
  });
});


// ✅ 5. Protected Profile route
app.get('/profile', isloggedin, async (req, res) => {
  const user = await usermodel.findOne({ email: req.user.email }).populate('posts');
  console.log(req.user);
  const posts = user && user.posts ? user.posts : [];
  res.render('profile', { user, posts });
});


app.get('/like/:id', isloggedin, async (req, res) => {
  const post = await postmodel.findOne({ _id: req.params.id }).populate('user');
  if(post.likes.indexOf(req.user.userid) === -1){
    post.likes.push(req.user.userid)
  }else{
    post.likes.splice(post.likes.indexOf(req.user.userid), 1)
  }
  await post.save()
  res.redirect('/profile')
});


app.get('/edit/:id', isloggedin, async (req, res) => {
  const post = await postmodel.findOne({ _id: req.params.id }).populate('user');
  res.render('edit', {post})
});


app.post('/update/:id', isloggedin, async (req, res) => {
  const post = await postmodel.findOneAndUpdate({ _id: req.params.id }, {content : req.body.content});
  res.redirect('/profile')
});

app.post('/post', isloggedin, async (req, res) => {
    let user = await usermodel.findOne({email: req.user.email}).populate('posts');
    let {content} = req.body;
    let post = await postmodel.create({
      user : user._id,
      content
    })
    user.posts.push(post._id)
    await user.save()
    res.redirect('/profile')
});

// ✅ 6. Logout route
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});


// ✅ 7. Auth middleware
function isloggedin(req, res, next) {
  // Use safe access to cookies
  const token = req.cookies && req.cookies.token;

  if (!token) {
    return res.status(401).redirect('/login')
  }

  try {
    const data = jwt.verify(token, "secreteKey");
    req.user = data;
    next();
  } catch (err) {
    console.error("JWT Error:", err.message);
    return res.status(401).send('Invalid token');
  }
}


app.get('/profile/upload', (req, res)=>{
  res.render('profileupload')
})

app.post('/upload',isloggedin, upload.single('image'), async (req, res)=>{
  let user = await usermodel.findOne({email: req.user.email})
  user.profile_pic = req.file.filename
  await user.save()
  res.redirect('/profile')
})


// ✅ 8. Start server
app.listen(8080, () => {
  console.log('✅ Server running at http://localhost:8080');
});
