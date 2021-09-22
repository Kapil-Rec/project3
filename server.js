const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const evn = require('./env');
app.use(bodyParser.json())
const dbName = "TestDataBase";

/////////////////////---------DATA BASE CONNECION  -------------///////////////////////

mongoose.connect(`mongodb://localhost:27017/${dbName}`, { useNewUrlParser: true }, (error, result) => {
    if (error) {
        console.log("Not Connected")
    } else {
        console.log("Database Connected")
    }
});
/////////////////////--------- SCHEMA DESING -------------///////////////////////

const schema = mongoose.Schema;
const apiSchema = new schema({
    name: String,
    img: String,
    summary: String
})
apiModel = mongoose.model('api', apiSchema);

/////////////////////--------- IMAGE UPLOAD CODE -------------///////////////////////

const imageStorage = multer.diskStorage({
    // Destination to store image     
    destination: 'images',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '_' + Date.now()
            + path.extname(file.originalname))
        // file.fieldname is name of the field (image)
        // path.extname get the uploaded file extension
    }
});
const imageUpload = multer({
    storage: imageStorage,
    limits: {
        fileSize: 1000000 // 1000000 Bytes = 1 MB
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg)$/)) {
            // upload only png and jpg format
            return cb(new Error('Please upload a Image'))
        }
        cb(undefined, true)
    }
})
/////////////////////---------ADD API -------------///////////////////////

app.post('/add', imageUpload.single('image'), (req, res) => {
    console.log(req.file);
    apiModel.findOne({ name: req.body.name }, (findErr, findRes) => {
        if (findErr) {
            return res.send({ responseCode: 501, responseMessage: "Internal Server Error" });
        } else if (findRes) {
            return res.send({ responseCode: 409, responseMessage: "Already Exist" });
        } else {
            const obj = {
                name: req.body.name,
                img: req.file.path,
                summary: req.body.summary
            }
            new apiModel(obj).save((saveErr, saveRes) => {
                if (saveErr) {
                    return res.send({ responseMessage: "Save Error" })
                } else {
                    return res.send({ responseCode: 200, responseMessage: "Image Is Uploaded Successfully", responseResult: saveRes })
                }
            })
        }
    })
})

/////////////////////---------DATA READ API -------------///////////////////////

app.get('/read', (req, res) => {
    apiModel.find((findErr, findRes) => {
        if (findErr) {
            return res.send({ responseCode: 501, responseMessage: "Internal Error" })
        } else {
            return res.send({ responseCode: 200, responseMessage: "Data Read ", reponseResult: findRes })
        }
    })
})
/////////////////////---------DELETE API BY ID -------------///////////////////////

app.delete('/delete', (req, res) => {
    apiModel.findOne({ _id: req.body._id }, (findErr, findRes) => {
        if (findErr) {
            return res.send({ responseMessage: "Internal error" });
        } else if (!findRes) {
            return res.send({ responseMessage: "Credancial not found" });
        } else {
            const location = findRes.img;
            console.log(location);
            fs.unlinkSync(`${location}`)
            apiModel.deleteOne({ _id: req.body._id }, (delErr, delRes) => {
                console.log(delRes);
                if (delErr) {
                    return res.send({ responseMessage: "Internal server Error" })
                } else {
                    return res.send({ responseCode: 200, responseMessage: "Record Delete Successfully" })
                }
            })
        }
    })
});
/////////////////////---------UPDATE API -------------///////////////////////
app.put('/udpdateRecord', (req, res) => {
    try {
        apiModel.findOne({ _id: req.body._id }, (findErr, findRes) => {
            if (findErr) {
                return res.send({ responseMessage: "Internal server Error" })
            } else if (!findRes) {
                return res.send({ responseCode: 404, responseMessage: "Data not found" });

            } else {
                apiModel.findOne({ $and: [{ name: req.body.name }, { _id: { $ne: findRes._id } }] }, (Err, Res) => {
                    if (Err) {
                        return res.send({ responseCode: 500, responseMessage: "Internal Server Error" });
                    } else if (Res) {
                        if (Res.name == req.body.name) {
                            return res.send({ responseCode: 409, responseMessage: "Creidancial Already exist" });
                        }
                    } else {
                        apiModel.findByIdAndUpdate({ _id: findRes._id }, { $set: req.body }, (updateErr, updateRes) => {
                            if (updateErr) {
                                return res.send({ responseCode: 500, responseMessage: "Internal Error" });
                            } else {
                                return res.send({ responseCode: 200, responseMessage: "Data update Successfully" });
                            }
                        })
                    }
                })
            }
        })
    } catch (error) {
    }
})
/////////////////////---------SERVER CODE-------------///////////////////////

var port = 8001;
app.listen(port, (result, error) => {
    if (error) {
        console.log("Server not running");
    } else {
        console.log(`Server is running on ${port}`);
    }
})

