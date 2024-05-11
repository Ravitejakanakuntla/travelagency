const express = require("express");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
const cors = require("cors");
app.use(cors());
const bcrypt = require("bcryptjs");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
const jwt = require("jsonwebtoken");
var nodemailer = require("nodemailer");
var cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')


cloudinary.config({
    cloud_name: "dx2xh8hmx",
    api_key: "382984544522699",
    api_secret: "NrfkISLHGsLkpPlzlT6y6n8GrsI",
    secure: true,
})
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: "travelagency",
            public_id: file.fieldname + '-' + Date.now()
        }
    }
})
const upload = multer({ storage: storage })


const JWT_SECRET =
    "hvdvay6ert72839289()aiyg8t87qt72393293883uhefiuh78ttq3ifi78272jbkj?[]]pou89ywe";

const mongoUrl =
    "mongodb+srv://kanakuntlaraviteja01:Ravidineshsaikiran@cluster0.cki1vwg.mongodb.net/";

mongoose
    .connect(mongoUrl, {
        useNewUrlParser: true,
    })
    .then(() => {
        console.log("Connected to database");
    })
    .catch((e) => console.log(e));

require("./userDetails");

const User = mongoose.model("DetailedText");

app.post("/register",upload.single("files"), async (req, res) => {
    const { fname, lname, email, password, userType } = req.body;
   const imageLink=req.file.path;
   console.log(imageLink);
    const encryptedPassword = await bcrypt.hash(password, 10);
    try {
        const oldUser = await User.findOne({ email });

        if (oldUser) {
            return res.json({ error: "User Exists" });
        }
        await User.create({
            fname,
            lname,
            email,
            password: encryptedPassword,
            userType,
            imageLink,
        });
        res.send({ status: "ok" });
    } catch (error) {
        res.send({ status: "error" });
    }
});

app.post("/login-user", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.json({ error: "User Not found" });
    }
    if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ email: user.email }, JWT_SECRET, {
            expiresIn: "15m",
        });

        if (res.status(201)) {
            return res.json({ status: "ok", data: token });
        } else {
            return res.json({ error: "error" });
        }
    }
    res.json({ status: "error", error: "InvAlid Password" });
});

app.post("/userData", async (req, res) => {
    const { token } = req.body;
    try {
        const user = jwt.verify(token, JWT_SECRET);
        // console.log(user);
        const useremail = user.email;
        User.findOne({ email: useremail })
            .then((data) => {
                res.send({ status: "ok", data: data });
            })
            .catch((error) => {
                res.send({ status: "error", data: error });
            });
    } catch (error) { }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${ PORT }`);
});

app.post("/forgotpassword", async (req, res) => {
    const { email } = req.body;
    try {
        const oldUser = await User.findOne({ email });
        if (!oldUser) {
            return res.json({ status: "User Not Exists!!" });
        }
        const secret = JWT_SECRET + oldUser.password;
        const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
            expiresIn: "5m",
        });
        const link = `http://localhost:5000/resetpassword/${oldUser._id}/${token}`;
        var transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "kanakuntlaraviteja@gmail.com",
                pass: "tjwr hkrl phqb zdvm",
            },
        });

        var mailOptions = {
            from: "youremail@gmail.com",
            to: "ravitejakanakuntla@gmail.com",
            subject: "Password Reset",
            text: link,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email sent: " + info.response);
            }
        });
        console.log(link);
    } catch (error) { }
});
app.get("/resetpassword/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    console.log(req.params);
    const oldUser = await User.findOne({ _id: id });
    if (!oldUser) {
        return res.json({ status: "User Not Exists!!" });
    }
    const secret = JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        res.render("index", { email: verify.email, status: "Not Verified" });
    } catch (error) {
        console.log(error);
        res.send("Not Verified");
    }
});

app.post("/resetpassword/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body;

    const oldUser = await User.findOne({ _id: id });
    if (!oldUser) {
        return res.json({ status: "User Not Exists!!" });
    }
    const secret = JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        const encryptedPassword = await bcrypt.hash(password, 10);
        await User.updateOne(
            {
                _id: id,
            },
            {
                $set: {
                    password: encryptedPassword,
                },
            }
        );

        res.render("index", { email: verify.email, status: "verified" });
    } catch (error) {
        console.log(error);
        res.json({ status: "Something Went Wrong" });
    }
});


app.post("/updateUser", async (req, res) => {
    const { id, fname, lname } = req.body;
    try {
        await User.updateOne({ _id: id }, {
            $set: {
                fname: fname,
                lname: lname,

            }
        })
        return res.json({ status: "ok", data: "updated" })
    } catch (error) {
        return res.json({ status: "error", data: error })
    }
})
// // Define the ProfileImage model
// const ProfileImageSchema = new mongoose.Schema({
//     filename: String,
//     contentType: String,
//     image: Buffer,
// });

//const ProfileImage = mongoose.model('ProfileImage', ProfileImageSchema);

// Set up Multer for file upload


// Define a POST endpoint to handle file uploads
//app.post("/upload", upload.single("profileImage"), async (req, res) => {
    //try {
        // const { originalname, mimetype, buffer } = req.file;
        // console.log(req.file);
        // // Save the image data to MongoDB using Mongoose
        // const profileImage = new ProfileImage({
        //     filename: originalname,
        //     contentType: mimetype,
        //     image: buffer,
        // });

        // await profileImage.save();
//         console.log(req.file.path)

//         res.status(201).send('Image uploaded successfully.');
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server Error');
//     }
// });